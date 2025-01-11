import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/PatternDetail.module.css";

export default function PatternDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pattern, setPattern] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
    if (id) {
      fetchPattern();
    }
  }, [id]);

  useEffect(() => {
    if (pattern) {
      const initialMessage = {
        role: "assistant",
        content:
          selectedLanguage === "ko"
            ? `안녕하세요! 저는 영어 패턴 "${pattern.name_ko}"에 대해 도움을 드릴 수 있는 AI 튜터입니다. 이 패턴에 대해 궁금한 점이 있으시다면 무엇이든 물어보세요!`
            : `こんにちは！私は英語パターン「${pattern.name_jp}」についてお手伝いできるAIチューターです。このパターンについて気になることがありましたら、何でもお聞きください！`,
      };
      setChatMessages([initialMessage]);
    }
  }, [pattern, selectedLanguage]);

  const fetchPattern = async () => {
    try {
      const response = await fetch(`/api/getPattern?id=${id}`);
      const data = await response.json();
      setPattern(data);
      generateGeminiContent(data);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const generateGeminiContent = async (patternData) => {
    setQuizLoading(true);
    try {
      const prompt = `다음 영어 패턴에 대해 한국어와 일본어로 퀴즈를 만들어주세요:
      
      패턴: ${patternData.name_ko}
      설명: ${patternData.explanation.kr}
      예시:
      ${patternData.examples.join("\n")}
      
      다음 형식으로 퀴즈를 만들어주세요:
      
      **1. 한국어 퀴즈:**
      
      질문: [한국어 질문]
      A. [선택지1]
      B. [선택지2]
      C. [선택지3]
      D. [선택지4]
      정답: [정답]
      
      **2. 일본어 퀴즈:**
      
      質問: [일본어 질문]
      A. [선택지1]
      B. [선택지2]
      C. [선택지3]
      D. [선택지4]
      答え: [정답]`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log("Gemini API 응답:", data.response);

      const quizzes = parseQuizData(data.response);
      setQuizData(quizzes);
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setQuizLoading(false);
    }
  };

  const parseQuizData = (response) => {
    try {
      // 한국어 퀴즈 파싱
      const krQuizMatch = response.match(
        /질문:\s*(.*?)\nA\.\s*(.*?)\nB\.\s*(.*?)\nC\.\s*(.*?)\nD\.\s*(.*?)\n정답:\s*([A-D])/s
      );
      // 일본어 퀴즈 파싱
      const jpQuizMatch = response.match(
        /質問:\s*(.*?)\nA\.\s*(.*?)\nB\.\s*(.*?)\nC\.\s*(.*?)\nD\.\s*(.*?)\n答え:\s*([A-D])/s
      );

      if (!krQuizMatch || !jpQuizMatch) {
        console.error("퀴즈 데이터 파싱 실패");
        return null;
      }

      const correctAnswerMap = { A: 0, B: 1, C: 2, D: 3 };

      const quizData = {
        ko: {
          question: krQuizMatch[1].trim(),
          options: [
            krQuizMatch[2].trim(),
            krQuizMatch[3].trim(),
            krQuizMatch[4].trim(),
            krQuizMatch[5].trim(),
          ],
        },
        jp: {
          question: jpQuizMatch[1].trim(),
          options: [
            jpQuizMatch[2].trim(),
            jpQuizMatch[3].trim(),
            jpQuizMatch[4].trim(),
            jpQuizMatch[5].trim(),
          ],
        },
        correctAnswer: correctAnswerMap[krQuizMatch[6]],
      };

      // 데이터 유효성 검사
      if (
        !quizData.ko.question ||
        !quizData.jp.question ||
        quizData.ko.options.some((opt) => !opt) ||
        quizData.jp.options.some((opt) => !opt) ||
        typeof quizData.correctAnswer !== "number"
      ) {
        console.error("퀴즈 데이터가 불완전합니다");
        return null;
      }

      return quizData;
    } catch (error) {
      console.error("퀴즈 파싱 오류:", error);
      return null;
    }
  };

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "ko" ? "jp" : "ko";
    setSelectedLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const newMessages = [
      ...chatMessages,
      { role: "user", content: inputMessage },
    ];
    setChatMessages(newMessages);
    setInputMessage("");

    try {
      const prompt = `You are a helpful English tutor. The user is asking about the English pattern "${
        pattern.name_ko
      }".
      Context: 
      - Pattern explanation in Korean: ${pattern.explanation.kr}
      - Pattern explanation in Japanese: ${pattern.explanation.jp}
      - Example sentences: ${pattern.examples.join(", ")}
      
      User's question: ${inputMessage}
      
      Please provide a helpful explanation ${
        selectedLanguage === "ko" ? "in Korean" : "in Japanese"
      }. 
      ${
        selectedLanguage === "ko"
          ? "한국어로 친절하고 이해하기 쉽게 설명해주세요. 문법적인 설명이 필요한 경우 정확하게 설명해주시고, 추가 예문이 도움될 경우 예문도 함께 제시해주세요."
          : "日本語で親切で分かりやすく説明してください。文法的な説明が必要な場合は正確に説明し、追加の例文が役立つ場合は例文も一緒に提示してください。"
      }`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setChatMessages([
        ...newMessages,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      // 에러 메시지도 선택된 언어로 표시
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            selectedLanguage === "ko"
              ? "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요."
              : "申し訳ありません。エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        {selectedLanguage === "ko" ? "로딩 중..." : "ローディング中..."}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => router.push("/pattern")}
          className={styles.backButton}
        >
          {selectedLanguage === "ko" ? "뒤로 가기" : "戻る"}
        </button>
        <button onClick={toggleLanguage} className={styles.localeButton}>
          {selectedLanguage === "ko" ? "日本語" : "한국어"}
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>
          {pattern[selectedLanguage === "ko" ? "name_ko" : "name_jp"]}
        </h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {selectedLanguage === "ko" ? "설명" : "説明"}
          </h2>
          <p className={styles.explanation}>
            {pattern.explanation[selectedLanguage === "ko" ? "kr" : "jp"]}
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {selectedLanguage === "ko" ? "예시" : "例文"}
          </h2>
          {pattern.examples.map((example, index) => (
            <div key={index} className={styles.example}>
              <code className={styles.exampleCode}>{example}</code>
            </div>
          ))}
        </div>

        {quizLoading ? (
          <div className={styles.quizSection}>
            <h2 className={styles.quizTitle}>
              {selectedLanguage === "ko"
                ? "퀴즈 생성 중..."
                : "クイズを生成中..."}
            </h2>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
          </div>
        ) : (
          quizData &&
          quizData[selectedLanguage] && (
            <div className={styles.quizSection}>
              <h2 className={styles.quizTitle}>
                {selectedLanguage === "ko" ? "퀴즈" : "クイズ"}
              </h2>
              <p className={styles.quizQuestion}>
                {quizData[selectedLanguage].question}
              </p>
              <div className={styles.quizOptions}>
                {quizData[selectedLanguage].options.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.quizOption} ${
                      selectedAnswer === index ? styles.selected : ""
                    } ${
                      showFeedback
                        ? index === quizData.correctAnswer
                          ? styles.correct
                          : selectedAnswer === index
                          ? styles.incorrect
                          : ""
                        : ""
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {showFeedback && (
                <div
                  className={`${styles.feedback} ${
                    selectedAnswer === quizData.correctAnswer
                      ? styles.correct
                      : styles.incorrect
                  }`}
                >
                  {selectedAnswer === quizData.correctAnswer
                    ? selectedLanguage === "ko"
                      ? "정답입니다!"
                      : "正解です！"
                    : selectedLanguage === "ko"
                    ? "틀렸습니다. 다시 시도해보세요."
                    : "不正解です。もう一度挑戦してください。"}
                </div>
              )}
            </div>
          )
        )}

        <div className={styles.chatSection}>
          <h2 className={styles.sectionTitle}>
            {selectedLanguage === "ko" ? "AI 채팅" : "AIチャット"}
          </h2>
          <div className={styles.chatMessages}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`${styles.chatMessage} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.aiMessage
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder={
                selectedLanguage === "ko"
                  ? "메시지를 입력하세요..."
                  : "メッセージを入力してください..."
              }
              disabled={isSending}
            />
            <button
              onClick={sendChatMessage}
              className={styles.sendButton}
              disabled={isSending}
            >
              {selectedLanguage === "ko" ? "전송" : "送信"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
