import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/PatternDetail.module.css";

export default function PatternDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [geminiContent, setGeminiContent] = useState(null);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchPattern();
    }
  }, [id]);

  const fetchPattern = async () => {
    try {
      const response = await fetch(`/api/getPattern?id=${id}`);
      if (!response.ok) {
        throw new Error("패턴을 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setPattern(data);
      generateGeminiContent(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateGeminiContent = async (patternData) => {
    setLoadingGemini(true);
    try {
      const prompt = `다음 영어 표현에 대한 퀴즈를 만들어주세요:
      표현: ${patternData.name_ko}
      설명: ${patternData.explanation.kr}
      예시: ${patternData.examples.join("\n")}
      
      다음 형식으로 정확히 응답해주세요:
      1. 한국어 퀴즈:
      질문: (표현 사용과 관련된 질문)
      A. (선택지1)
      B. (선택지2)
      C. (선택지3)
      D. (선택지4)
      정답: (A, B, C, D 중 하나)

      2. 일본어 퀴즈:
      質問: (같은 질문을 일본어로)
      A. (같은 선택지1을 일본어로)
      B. (같은 선택지2를 일본어로)
      C. (같은 선택지3을 일본어로)
      D. (같은 선택지4를 일본어로)
      答え: (A, B, C, D 중 하나)`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Gemini API 호출 실패");

      const data = await response.json();
      const content = data.response;

      console.log("Gemini API 응답:", content);

      try {
        // 마크다운 형식 제거
        const cleanContent = content.replace(/\*\*/g, "");

        // 한국어 퀴즈 추출
        const krQuizMatch = cleanContent.match(
          /1\.\s*한국어\s*퀴즈:[\s\S]*?질문:\s*([^\n]+)/i
        );
        const krQuestion = krQuizMatch ? krQuizMatch[1].trim() : "";

        // 일본어 퀴즈 추출
        const jpQuizMatch = cleanContent.match(
          /2\.\s*일본어\s*퀴즈:[\s\S]*?質問:\s*([^\n]+)/i
        );
        const jpQuestion = jpQuizMatch ? jpQuizMatch[1].trim() : "";

        // 한국어 선택지 추출
        const krOptions = [];
        const krOptionsText = cleanContent.match(
          /(?<=1\.\s*한국어\s*퀴즈:[\s\S]*?)[A-D]\.\s*([^\n]+)(?=\n)/g
        );
        if (krOptionsText) {
          krOptions.push(
            ...krOptionsText.map((opt) => opt.replace(/^[A-D]\.\s*/, "").trim())
          );
        }

        // 일본어 선택지 추출
        const jpOptions = [];
        const jpOptionsText = cleanContent.match(
          /(?<=2\.\s*일본어\s*퀴즈:[\s\S]*?)[A-D]\.\s*([^\n]+)(?=\n)/g
        );
        if (jpOptionsText) {
          jpOptions.push(
            ...jpOptionsText.map((opt) => opt.replace(/^[A-D]\.\s*/, "").trim())
          );
        }

        // 정답 추출 (한국어/일본어 동일)
        const answerMatch = cleanContent.match(/정답:\s*([A-D])/);
        const correctAnswer = answerMatch ? "ABCD".indexOf(answerMatch[1]) : 0;

        console.log("추출된 퀴즈 데이터:", {
          kr: { question: krQuestion, options: krOptions },
          jp: { question: jpQuestion, options: jpOptions },
          correctAnswer,
        });

        if (
          krQuestion &&
          jpQuestion &&
          krOptions.length === 4 &&
          jpOptions.length === 4
        ) {
          setQuiz({
            kr: { question: krQuestion, options: krOptions },
            jp: { question: jpQuestion, options: jpOptions },
            correctAnswer,
          });
        }
      } catch (parseError) {
        console.error("Content parsing error:", parseError);
      }
    } catch (error) {
      console.error("Gemini content generation error:", error);
    } finally {
      setLoadingGemini(false);
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
    setIsCorrect(index === quiz.correctAnswer);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // 사용자 메시지 추가
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Context: We are discussing the English expression "${
            pattern.name_ko
          }" which means "${pattern.explanation.kr}".
          Examples: ${pattern.examples.join(", ")}
          
          User question: ${userMessage}
          
          Please provide a helpful and educational response in ${
            selectedLanguage === "ko" ? "Korean" : "Japanese"
          }.`,
        }),
      });

      if (!response.ok) throw new Error("Gemini API 호출 실패");

      const data = await response.json();

      // AI 응답 추가
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            selectedLanguage === "ko"
              ? "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요."
              : "申し訳ありません。エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || !pattern) {
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
          className={styles.backButton}
          onClick={() => router.push("/pattern")}
        >
          {selectedLanguage === "ko" ? "목록으로" : "一覧へ"}
        </button>
        <button className={styles.localeButton} onClick={toggleLanguage}>
          {selectedLanguage === "ko" ? "日本語" : "한국어"}
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{pattern[`name_${selectedLanguage}`]}</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {selectedLanguage === "ko" ? "설명" : "説明"}
          </h2>
          <p className={styles.explanation}>
            {pattern.explanation[selectedLanguage === "ko" ? "kr" : "jp"]}
          </p>
        </div>

        {pattern.examples && pattern.examples.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {selectedLanguage === "ko" ? "예시" : "例"}
            </h2>
            {pattern.examples.map((example, index) => (
              <div key={index} className={styles.example}>
                <pre className={styles.exampleCode}>{example}</pre>
              </div>
            ))}
          </div>
        )}

        {loadingGemini ? (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {selectedLanguage === "ko"
                ? "퀴즈 생성 중..."
                : "クイズを生成中..."}
            </h2>
            <div className={styles.loading}>
              {selectedLanguage === "ko"
                ? "잠시만 기다려주세요..."
                : "少々お待ちください..."}
            </div>
          </div>
        ) : (
          quiz && (
            <div className={styles.quizSection}>
              <h2 className={styles.quizTitle}>
                {selectedLanguage === "ko" ? "퀴즈" : "クイズ"}
              </h2>
              <p className={styles.quizQuestion}>
                {quiz[selectedLanguage].question}
              </p>
              <div className={styles.quizOptions}>
                {quiz[selectedLanguage].options.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.quizOption} ${
                      selectedAnswer === index ? styles.selected : ""
                    } ${
                      showFeedback && index === quiz.correctAnswer
                        ? styles.correct
                        : ""
                    } ${
                      showFeedback &&
                      selectedAnswer === index &&
                      index !== quiz.correctAnswer
                        ? styles.incorrect
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
                    isCorrect ? styles.correct : styles.incorrect
                  }`}
                >
                  {isCorrect
                    ? selectedLanguage === "ko"
                      ? "정답입니다! 👏"
                      : "正解です！👏"
                    : selectedLanguage === "ko"
                    ? "틀렸습니다. 다시 한번 생각해보세요! 🤔"
                    : "不正解です。もう一度考えてみましょう！🤔"}
                </div>
              )}
            </div>
          )
        )}

        <div className={styles.chatSection}>
          <h2 className={styles.sectionTitle}>
            {selectedLanguage === "ko" ? "AI 채팅" : "AI チャット"}
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
            {chatLoading && (
              <div className={`${styles.chatMessage} ${styles.aiMessage}`}>
                {selectedLanguage === "ko"
                  ? "답변 생성 중..."
                  : "回答を生成中..."}
              </div>
            )}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder={
                selectedLanguage === "ko"
                  ? "질문을 입력하세요..."
                  : "質問を入力してください..."
              }
              disabled={chatLoading}
            />
            <button
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
              className={styles.sendButton}
            >
              {selectedLanguage === "ko" ? "전송" : "送信"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
