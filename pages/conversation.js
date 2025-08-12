import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/Conversation.module.css";
import ReactMarkdown from "react-markdown";

export default function Conversation() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [sessionId, setSessionId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Audio 객체는 클라이언트 사이드에서만 생성
    audioRef.current = new Audio();
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) setSelectedLanguage(savedLanguage);

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
          const assistantMessage = {
            role: "assistant",
            content: data.response,
          };

          // 음성 합성을 위해 화자 표시 제거
          const cleanedText = data.response.replace(/^\[.*?\]\s*/, "");

          // 음성 합성 요청
          const audioResponse = await fetch("/api/synthesizeSpeech", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: cleanedText }),
          });

          if (audioResponse.ok) {
            const audioData = await audioResponse.json();
            assistantMessage.audioContent = audioData.audioContent;
          }

          setMessages([assistantMessage]);
          playAudio(assistantMessage.audioContent);
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

  const playAudio = async (audioContent) => {
    try {
      if (!audioContent) {
        console.error("No audio content provided");
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audioBlob = new Blob([Buffer.from(audioContent, "base64")], {
        type: "audio/mp3",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      audioRef.current.onerror = (e) => {
        console.error("Audio loading error:", e);
        setIsPlaying(false);
      };

      if (autoPlayEnabled) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("자동 재생이 차단되었습니다:", error);
          setIsPlaying(false);
        }
      }

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("오디오 재생 중 오류 발생:", error);
      setIsPlaying(false);
    }
  };

  const toggleAudio = async (audioContent) => {
    if (!audioRef.current || !audioRef.current.src) {
      await playAudio(audioContent);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("오디오 재생 중 오류 발생:", error);
      }
    }
  };

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
        const assistantMessage = {
          role: "assistant",
          content: data.response,
        };

        // 음성 합성을 위해 화자 표시 제거
        const cleanedText = data.response.replace(/^\[.*?\]\s*/, "");

        // 음성 합성 요청
        const audioResponse = await fetch("/api/synthesizeSpeech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: cleanedText }),
        });

        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          assistantMessage.audioContent = audioData.audioContent;
        }

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        setInputMessage("");
        playAudio(assistantMessage.audioContent);
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
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            selectedLanguage === "ko"
              ? "죄송합니다. 네트워크 오류가 발생했습니다. 다시 시도해주세요."
              : "申し訳ありません。ネットワークエラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (messages.length === 0) {
      alert(
        selectedLanguage === "ko"
          ? "저장할 대화가 없습니다."
          : "保存する会話がありません。"
      );
      return;
    }

    try {
      const response = await fetch("/api/saveConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          messages,
        }),
      });

      if (response.ok) {
        router.push("/conversationHistory");
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
      alert(
        selectedLanguage === "ko"
          ? "대화 저장에 실패했습니다."
          : "会話の保存に失敗しました。"
      );
    }
  };

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "ko" ? "jp" : "ko";
    setSelectedLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
  };

  return (
    <>
      <Head>
        <title>Voca Quiz - 프리토킹</title>
        <meta
          name="description"
          content="AI와 함께 영어로 대화하며 학습해보세요"
        />
      </Head>
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
          <button
            onClick={() => router.push("/")}
            className={`${styles.backButton} ${
              selectedLanguage === "ko" ? "ko-text" : "jp-text"
            }`}
            lang={selectedLanguage === "ko" ? "ko" : "ja"}
          >
            {selectedLanguage === "ko" ? "메인으로" : "メインへ"}
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.chatContainer}>
            <div className={styles.messageList}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    message.role === "user"
                      ? styles.userMessage
                      : styles.botMessage
                  } ${selectedLanguage === "ko" ? "ko-text" : "jp-text"}`}
                  lang={selectedLanguage === "ko" ? "ko" : "ja"}
                >
                  <div className={styles.messageWrapper}>
                    <div className={styles.messageContent}>
                      {message.role === "user" ? (
                        message.content
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                    {message.audioContent && message.role === "assistant" && (
                      <div className={styles.audioButtonWrapper}>
                        <button
                          className={styles.audioButton}
                          onClick={() => toggleAudio(message.audioContent)}
                          disabled={
                            isPlaying &&
                            audioRef.current?.src !== message.audioContent
                          }
                          aria-label={
                            isPlaying &&
                            audioRef.current?.src === message.audioContent
                              ? "일시정지"
                              : "재생"
                          }
                        >
                          {isPlaying &&
                          audioRef.current?.src === message.audioContent ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div
                  className={`${styles.loadingMessage} ${
                    selectedLanguage === "ko" ? "ko-text" : "jp-text"
                  }`}
                  lang={selectedLanguage === "ko" ? "ko" : "ja"}
                >
                  {selectedLanguage === "ko"
                    ? "답변 생성 중..."
                    : "回答を生成中..."}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  selectedLanguage === "ko"
                    ? "메시지를 입력하세요..."
                    : "メッセージを入力してください..."
                }
                className={`${styles.input} ${
                  selectedLanguage === "ko" ? "ko-text" : "jp-text"
                }`}
                lang={selectedLanguage === "ko" ? "ko" : "ja"}
              />
              <button
                type="submit"
                className={`${styles.sendButton} ${
                  selectedLanguage === "ko" ? "ko-text" : "jp-text"
                }`}
                disabled={isLoading}
                lang={selectedLanguage === "ko" ? "ko" : "ja"}
              >
                {selectedLanguage === "ko" ? "전송" : "送信"}
              </button>
            </form>
          </div>

          <div className={styles.buttonContainer}>
            <button
              onClick={handleSaveConversation}
              className={`${styles.saveButton} ${
                selectedLanguage === "ko" ? "ko-text" : "jp-text"
              }`}
              disabled={messages.length === 0}
              lang={selectedLanguage === "ko" ? "ko" : "ja"}
            >
              {selectedLanguage === "ko" ? "대화 저장" : "会話を保存"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
