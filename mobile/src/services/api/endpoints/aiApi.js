import axios from "axios";

const API_URL = "http://192.168.1.4:5000/api/chatbot/chat";

export async function chatWithClinixAI({ message, history }) {
  try {
    const response = await axios.post(API_URL, {
      message,
      history,
    });

    return response.data;
  } catch (error) {
    console.log("AXIOS ERROR:", error.response?.data || error.message);
    throw error;
  }
}