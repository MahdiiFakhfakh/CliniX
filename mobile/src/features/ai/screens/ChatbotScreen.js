import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
} from "react-native";
import { useChatbotMutation } from "@/src/features/ai/hooks/useChatbotMutation";

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const { mutateAsync, isPending } = useChatbotMutation();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await mutateAsync({
        message: input,
        history: messages,
      });

      const botMessage = {
        id: Date.now().toString() + "_bot",
        role: "assistant",
        content: response.reply.content,
      };

      setMessages((prev) => [...prev, botMessage]);
      setInput("");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: "Error connecting to AI",
        },
      ]);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.role === "user" ? styles.user : styles.bot,
      ]}
    >
      <Text style={styles.text}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.chat}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Clinix AI..."
        />
        <Button title={isPending ? "..." : "Send"} onPress={sendMessage} disabled={isPending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  chat: { flex: 1, padding: 10 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  message: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  bot: {
    backgroundColor: "#F1F0F0",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 16,
  },
});