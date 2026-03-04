import React, { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { id: Date.now().toString(), sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    try {
      const res = await fetch("http://192.168.1.4:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: [] })
      });
      const data = await res.json();
      const botMessage = { id: Date.now().toString() + "_bot", sender: "bot", text: data.reply };
      setMessages(prev => [...prev, botMessage]);
      setInput("");
    } catch {
      const errorMsg = { id: Date.now().toString() + "_err", sender: "bot", text: "Error connecting to bot" };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ margin: 5, alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#DCF8C6" : "#F1F0F0", padding: 10, borderRadius: 5 }}>
            {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", padding: 10, borderTop: "1px solid #ccc" }}>
        <input style={{ flex: 1, padding: 10 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}