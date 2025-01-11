import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Pattern.module.css";

export default function Pattern() {
  const router = useRouter();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    async function fetchPatterns() {
      try {
        const response = await fetch("/api/getPatterns");
        if (!response.ok) {
          throw new Error("패턴을 가져오는데 실패했습니다.");
        }
        const data = await response.json();
        setPatterns(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatterns();
  }, []);

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "ko" ? "jp" : "ko";
    setSelectedLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
  };

  const handlePatternClick = (patternId) => {
    router.push(`/pattern/${patternId}`);
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
        <h1 className={styles.title}>
          {selectedLanguage === "ko" ? "영어 패턴" : "英語パターン"}
        </h1>
        <div className={styles.headerBtn}>
          <button
            onClick={() => router.push("/")}
            className={styles.backButton}
          >
            {selectedLanguage === "ko" ? "뒤로 가기" : "戻る"}
          </button>
          <button onClick={toggleLanguage} className={styles.localeButton}>
            {selectedLanguage === "ko" ? "한국어" : "日本語"}
          </button>
        </div>
      </div>

      <div className={styles.patternGrid}>
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            className={styles.patternButton}
            onClick={() => handlePatternClick(pattern.id)}
          >
            <span className={styles.patternText}>
              {pattern[selectedLanguage === "ko" ? "name_ko" : "name_jp"]}
            </span>
            <span className={styles.explanationText}>
              {pattern.explanation[selectedLanguage === "ko" ? "kr" : "jp"]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
