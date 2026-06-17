import { useState, useCallback, useRef } from "react";
import { fetchChatHistory, sendChatMessage } from "../api/chatbot.js";

let _nextId = 1;
const nextId = () => _nextId++;

const WELCOME = {
  id: nextId(),
  sender: "bot",
  type: "text",
  text: "Hi, you can ask me anything about student accommodation.",
};

const SUGGESTIONS = {
  id: nextId(),
  sender: "bot",
  type: "suggestions",
  text: "Here are some things I can help you with.",
};

function historyToMessages(rows) {
  return rows.map((row) => ({
    id: nextId(),
    sender: row.role === "user" ? "user" : "bot",
    type: "text",
    text: row.content,
    showCopy: row.role === "model",
  }));
}

export default function useChatbot() {
  const [messages, setMessages] = useState([WELCOME, SUGGESTIONS]);
  const [isLoading, setIsLoading] = useState(false);
  const historyLoadedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    try {
      const rows = await fetchChatHistory();
      if (rows && rows.length > 0) {
        setMessages([...historyToMessages(rows)]);
      }
    } catch {
      // silently keep the welcome messages if history fetch fails
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: nextId(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: "bot",
          type: "text",
          text: data.reply,
          showCopy: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: "bot",
          type: "text",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { messages, isLoading, loadHistory, sendMessage };
}
