const Notification = require("../models/Notifications");
const User = require("../models/User");

const notifyAdmins = async ({
  type = "database",
  title,
  message,
  priority = "medium",
  data = {},
  actor,
}) => {
  if (!title || !message) return [];

  try {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (!admins.length) return [];

    const sentAt = new Date();
    const docs = admins.map((admin) => ({
      user: admin._id,
      type,
      title,
      message,
      priority,
      data: {
        ...data,
        actor: actor ? actor.toString() : undefined,
      },
      sentAt,
    }));

    return Notification.insertMany(docs);
  } catch (error) {
    console.error("Failed to create admin notifications:", error);
    return [];
  }
};

module.exports = { notifyAdmins };
