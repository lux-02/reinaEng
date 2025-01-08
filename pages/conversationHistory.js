import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/ConversationHistory.module.css";
import ReactMarkdown from "react-markdown";

export default function ConversationHistory() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/getConversations");
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error("대화 내역 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toggleConversation = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return <div className={styles.loading}>대화 내역을 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>대화 내역</h1>
      <div className={styles.conversationList}>
        {conversations.map((conversation) => (
          <div key={conversation._id} className={styles.conversationItem}>
            <div
              className={styles.conversationHeader}
              onClick={() => toggleConversation(conversation._id)}
            >
              <span className={styles.date}>
                {formatDate(conversation.date)}
              </span>
              <span className={styles.toggleIcon}>
                {expandedId === conversation._id ? "▼" : "▶"}
              </span>
            </div>
            {expandedId === conversation._id && (
              <div className={styles.messages}>
                {conversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      message.role === "user"
                        ? styles.userMessage
                        : styles.botMessage
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
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/")} className={styles.backButton}>
        메인으로 돌아가기
      </button>
    </div>
  );
}
