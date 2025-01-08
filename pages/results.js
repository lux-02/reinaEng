import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Results.module.css";

export default function Results() {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const router = useRouter();

  useEffect(() => {
    const savedScore = localStorage.getItem("score");
    const savedResults = localStorage.getItem("results");
    const savedLanguage = localStorage.getItem("selectedLanguage");

    if (savedScore) setScore(parseInt(savedScore));
    if (savedResults) setResults(JSON.parse(savedResults));
    if (savedLanguage) setSelectedLanguage(savedLanguage);
  }, []);

  const handleRetry = () => {
    router.push("/");
  };

  const toggleLanguage = () => {
    setSelectedLanguage((prev) => (prev === "ko" ? "jp" : "ko"));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={toggleLanguage} className={styles.localeButton}>
          {selectedLanguage === "ko" ? "한국어" : "日本語"}
        </button>
      </div>
      <h1 className={styles.title}>
        {selectedLanguage === "ko" ? "퀴즈 결과" : "クイズ結果"}
      </h1>
      <div className={styles.score}>
        {selectedLanguage === "ko" ? "점수" : "スコア"}: {score} /{" "}
        {results.length}
      </div>
      <div className={styles.resultList}>
        {results.map((result, index) => (
          <div
            key={index}
            className={`${styles.resultItem} ${
              result.isCorrect ? styles.correct : styles.incorrect
            }`}
          >
            <div className={styles.word}>{result.word}</div>
            <div className={styles.meaning}>
              {selectedLanguage === "ko" ? result.ko_mean : result.jp_mean}
            </div>
            <div className={styles.status}>{result.isCorrect ? "✓" : "✗"}</div>
          </div>
        ))}
      </div>
      <button onClick={handleRetry} className={styles.retryButton}>
        {selectedLanguage === "ko" ? "다시 시작" : "もう一度"}
      </button>
    </div>
  );
}
