import { useState, useRef, useEffect } from "react";
import styles from "@/styles/Conversation.module.css";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";

export default function Conversation() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const newSessionId = Math.random().toString(36).substring(7);
    setSessionId(newSessionId);

    const getInitialGreeting = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "START_CONVERSATION",
            sessionId: newSessionId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessages([
            {
              role: "assistant",
              content: data.response,
            },
          ]);
        } else {
          console.error("Initial greeting error:", data.error);
        }
      } catch (error) {
        console.error("Failed to get initial greeting:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialGreeting();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.error}${
              data.details ? ` (${data.details})` : ""
            }`,
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was a network error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/saveConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages,
        }),
      });

      if (response.ok) {
        router.push("/conversationHistory");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatContainer}>
        <div className={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === "user" ? styles.userMessage : styles.botMessage
              }`}
            >
              <div className={styles.messageContent}>
                {message.role === "user" ? (
                  message.content
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.botMessage}`}>
              <div className={styles.loadingDots}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isLoading}
          >
            전송
          </button>
        </form>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={() => router.push("/")} className={styles.backButton}>
          메인으로 돌아가기
        </button>
        <button
          onClick={handleSaveConversation}
          className={styles.saveButton}
          disabled={isSaving || messages.length < 2}
        >
          {isSaving ? "저장 중..." : "대화 저장하기"}
        </button>
      </div>
    </div>
  );
}
