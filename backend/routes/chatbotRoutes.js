require("dotenv").config();
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const Conversation = require("../models/Conversation");
const Appointment = require("../models/Appointment"); 
const User = require("../models/User");               
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const SYSTEM_PROMPT = `You are a helpful medical assistant in a patient health 
management app called Clinix. Answer questions about medications, symptoms, and 
general health clearly and concisely. Always remind users to consult their doctor 
for serious concerns. Never diagnose or prescribe medication.

You can also help patients book appointments. When a patient wants to book:
1. Ask for the doctor's name (if not provided) and their preferred date/time.
2. Call check_available_slots to verify the doctor is free.
3. If the slot is free, confirm with the patient before calling book_appointment.
4. Always confirm the final booking with the appointment details.`;

// --- Tool definitions sent to the AI ---
const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_available_slots",
      description: "Check if a specific doctor is available at a requested date and time.",
      parameters: {
        type: "object",
        properties: {
          doctorName: {
            type: "string",
            description: "Full name of the doctor the patient wants to see"
          },
          requestedDate: {
            type: "string",
            description: "ISO 8601 date string, e.g. 2025-07-15T14:00:00"
          }
        },
        required: ["doctorName", "requestedDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book a confirmed appointment for the patient with the specified doctor.",
      parameters: {
        type: "object",
        properties: {
          doctorName: {
            type: "string",
            description: "Full name of the doctor"
          },
          appointmentDate: {
            type: "string",
            description: "ISO 8601 date string for the appointment"
          },
          reason: {
            type: "string",
            description: "Brief reason for the visit, as described by the patient"
          }
        },
        required: ["doctorName", "appointmentDate", "reason"]
      }
    }
  }
];

async function executeTool(toolName, args, patientId) {
  if (toolName === "check_available_slots") {
    const { doctorName, requestedDate } = args;

    const cleanName = doctorName.replace(/^Dr\.?\s*/i, "").trim();

const doctor = await Doctor.findOne({
  $or: [
    { fullName: { $regex: new RegExp(cleanName, "i") } },
    { firstName: { $regex: new RegExp(cleanName.split(" ")[0], "i") } },
    { lastName: { $regex: new RegExp(cleanName.split(" ").slice(1).join(" "), "i") } }
  ]
});

    if (!doctor) {
      return { available: false, reason: `No doctor named "${doctorName}" found in the system.` };
    }

    const requested = new Date(requestedDate);
    const dayStart = new Date(requested);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requested);
    dayEnd.setHours(23, 59, 59, 999);

    const requestedTime = requested.toTimeString().slice(0, 5);

    const conflict = await Appointment.findOne({
      doctor: doctor._id,
      date: { $gte: dayStart, $lte: dayEnd },
      time: requestedTime,
      status: { $nin: ["cancelled", "no_show"] }
    });

    if (conflict) {
      return {
        available: false,
        reason: `Dr. ${doctor.fullName} already has an appointment on that day at ${requestedTime}.`
      };
    }

    return {
      available: true,
      doctorId: doctor._id.toString(),
      doctorName: doctor.fullName,
      requestedDate,
      requestedTime
    };
  }

  if (toolName === "book_appointment") {
    const { doctorName, appointmentDate, reason } = args;

   const cleanName = doctorName.replace(/^Dr\.?\s*/i, "").trim();
const doctor = await Doctor.findOne({
  $or: [
    { fullName: { $regex: new RegExp(cleanName, "i") } },
    { firstName: { $regex: new RegExp(cleanName.split(" ")[0], "i") } }
  ]
});

    if (!doctor) {
      return { success: false, reason: `Doctor "${doctorName}" not found.` };
    }

    const patient = await Patient.findOne({ user: patientId });

    if (!patient) {
      return { success: false, reason: "Patient profile not found." };
    }

    const dateObj = new Date(appointmentDate);
    const time = dateObj.toTimeString().slice(0, 5);
    const dateOnly = new Date(dateObj);
    dateOnly.setHours(0, 0, 0, 0);

    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      date: dateOnly,
      time,
      reason,
      status: "scheduled",
      type: "consultation",
      fee: doctor.consultationFee || 0,
      paymentStatus: "pending",
      createdBy: patientId
    });

    await appointment.save();

    await Promise.all([
      Patient.findByIdAndUpdate(patient._id, {
        $addToSet: { appointments: appointment._id },
        nextAppointment: dateOnly
      }),
      Doctor.findByIdAndUpdate(doctor._id, {
        $addToSet: { appointments: appointment._id, patients: patient._id }
      })
    ]);

    return {
      success: true,
      appointmentId: appointment.appointmentId,
      doctorName: doctor.fullName,
      date: dateOnly.toDateString(),
      time,
      reason
    };
  }

  return { error: "Unknown tool" };
}
router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;
    const patientId = req.user._id;

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    let conversation = await Conversation.findOne({ patientId });
    if (!conversation) {
      conversation = new Conversation({ patientId, messages: [] });
    }

    const recentMessages = conversation.messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add the new user message
    const messagesPayload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages,
      { role: "user", content: message }
    ];

    // --- First AI call ---
    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messagesPayload,
        tools: TOOLS,
        tool_choice: "auto"
      })
    });

    let data = await response.json();
    let aiMessage = data?.choices?.[0]?.message;

    // --- Agentic loop: handle tool calls ---
    while (aiMessage?.tool_calls?.length > 0) {
      const toolCall = aiMessage.tool_calls[0]; // handle one at a time
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`[Tool Call] ${toolName}`, toolArgs);

      const toolResult = await executeTool(toolName, toolArgs, patientId);

      console.log(`[Tool Result]`, toolResult);

      // Append assistant's tool call + tool result to the payload
      messagesPayload.push(aiMessage); // assistant message with tool_calls
      messagesPayload.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
      });

      // --- Follow-up AI call with tool result ---
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: messagesPayload,
          tools: TOOLS,
          tool_choice: "auto"
        })
      });

      data = await response.json();
      aiMessage = data?.choices?.[0]?.message;
    }

    const text = aiMessage?.content;

    if (!text) {
      return res.json({
        success: true,
        reply: {
          content: "I couldn't generate a response. Please try again.",
          caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional."
        }
      });
    }

    // Save the user message + final assistant reply to DB
    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: text });
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.json({
      success: true,
      reply: {
        content: text,
        caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional."
      }
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ success: false, error: "AI request failed" });
  }
});

// GET /api/chatbot/history
router.get("/history", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ patientId: req.user._id });
    const messages = conversation ? conversation.messages : [];
    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

// DELETE /api/chatbot/history
router.delete("/history", protect, async (req, res) => {
  try {
    await Conversation.findOneAndDelete({ patientId: req.user._id });
    return res.json({ success: true, message: "Conversation cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to clear history" });
  }
});

module.exports = router;