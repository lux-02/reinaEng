import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/ConversationHistory.module.css";
import ReactMarkdown from "react-markdown";

export default function ConversationHistory() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) setSelectedLanguage(savedLanguage);
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/getConversations");
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error(
        selectedLanguage === "ko"
          ? "대화 내역 로드 실패:"
          : "会話履歴の読み込みに失敗しました:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      selectedLanguage === "ko" ? "ko-KR" : "ja-JP",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const toggleConversation = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "ko" ? "jp" : "ko";
    setSelectedLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
  };

  const playAudio = (audioContent) => {
    if (!audioContent || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = `data:audio/mp3;base64,${audioContent}`;
    audio.play();
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  if (isLoading) {
    return (
      <div
        className={`${styles.loading} ${
          selectedLanguage === "ko" ? "ko-text" : "jp-text"
        }`}
      >
        {selectedLanguage === "ko"
          ? "대화 내역을 불러오는 중..."
          : "会話履歴を読み込んでいます..."}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={toggleLanguage}
          className={`${styles.localeButton} ${
            selectedLanguage === "ko" ? "ko-text" : "jp-text"
          }`}
          lang={selectedLanguage === "ko" ? "ko" : "ja"}
        >
          {selectedLanguage === "ko" ? "한국어" : "日本語"}
        </button>
      </div>
      <h1
        className={`${styles.title} ${
          selectedLanguage === "ko" ? "ko-text" : "jp-text"
        }`}
        lang={selectedLanguage === "ko" ? "ko" : "ja"}
      >
        {selectedLanguage === "ko" ? "대화 내역" : "会話履歴"}
      </h1>
      <div className={styles.conversationList}>
        {conversations.map((conversation) => (
          <div key={conversation._id} className={styles.conversationItem}>
            <div
              className={styles.conversationHeader}
              onClick={() => toggleConversation(conversation._id)}
            >
              <span
                className={`${styles.date} ${
                  selectedLanguage === "ko" ? "ko-text" : "jp-text"
                }`}
                lang={selectedLanguage === "ko" ? "ko" : "ja"}
              >
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
                        <>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                          {message.audioContent && (
                            <button
                              className={styles.audioButton}
                              onClick={() => playAudio(message.audioContent)}
                              disabled={isPlaying}
                            >
                              🔊
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push("/")}
        className={`${styles.backButton} ${
          selectedLanguage === "ko" ? "ko-text" : "jp-text"
        }`}
        lang={selectedLanguage === "ko" ? "ko" : "ja"}
      >
        {selectedLanguage === "ko" ? "메인으로 돌아가기" : "メインへ戻る"}
      </button>
    </div>
  );
}
