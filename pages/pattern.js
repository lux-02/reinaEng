import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Pattern.module.css";

export default function Pattern() {
  const router = useRouter();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPattern, setNewPattern] = useState({
    name_ko: "",
    name_jp: "",
    explanation: {
      kr: "",
      jp: "",
    },
    examples: ["", "", ""],
  });

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

  const handleAddPattern = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/addPattern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPattern),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setNewPattern({
          name_ko: "",
          name_jp: "",
          explanation: {
            kr: "",
            jp: "",
          },
          examples: ["", "", ""],
        });
        // 패턴 목록 새로고침
        const patternsResponse = await fetch("/api/getPatterns");
        const data = await patternsResponse.json();
        setPatterns(data);
      }
    } catch (error) {
      console.error("Error adding pattern:", error);
    }
  };

  const handleExampleChange = (index, value) => {
    const newExamples = [...newPattern.examples];
    newExamples[index] = value;
    setNewPattern({ ...newPattern, examples: newExamples });
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
            {selectedLanguage === "ko" ? "메인으로" : "メインへ"}
          </button>
          <button onClick={toggleLanguage} className={styles.localeButton}>
            {selectedLanguage === "ko" ? "한국어" : "日本語"}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={styles.addButton}
          >
            {selectedLanguage === "ko" ? "패턴 추가" : "パターン追加"}
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

      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2
                className={selectedLanguage === "ko" ? "ko-text" : "jp-text"}
                lang={selectedLanguage === "ko" ? "ko" : "ja"}
              >
                {selectedLanguage === "ko"
                  ? "새 패턴 추가"
                  : "新しいパターン追加"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPattern}>
              <div className={styles.inputGroup}>
                <label className="ko-text">한국어 패턴 이름</label>
                <input
                  type="text"
                  value={newPattern.name_ko}
                  onChange={(e) =>
                    setNewPattern({ ...newPattern, name_ko: e.target.value })
                  }
                  required
                  className="ko-text"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className="jp-text">日本語パターン名</label>
                <input
                  type="text"
                  value={newPattern.name_jp}
                  onChange={(e) =>
                    setNewPattern({ ...newPattern, name_jp: e.target.value })
                  }
                  required
                  className="jp-text"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className="ko-text">한국어 설명</label>
                <textarea
                  value={newPattern.explanation.kr}
                  onChange={(e) =>
                    setNewPattern({
                      ...newPattern,
                      explanation: {
                        ...newPattern.explanation,
                        kr: e.target.value,
                      },
                    })
                  }
                  required
                  className="ko-text"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className="jp-text">日本語説明</label>
                <textarea
                  value={newPattern.explanation.jp}
                  onChange={(e) =>
                    setNewPattern({
                      ...newPattern,
                      explanation: {
                        ...newPattern.explanation,
                        jp: e.target.value,
                      },
                    })
                  }
                  required
                  className="jp-text"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className="en-text">Examples (3)</label>
                {newPattern.examples.map((example, index) => (
                  <input
                    key={index}
                    type="text"
                    value={example}
                    onChange={(e) => handleExampleChange(index, e.target.value)}
                    placeholder={`Example ${index + 1}`}
                    required
                    className="en-text"
                  />
                ))}
              </div>
              <div className={styles.modalButtons}>
                <button
                  type="submit"
                  className={`${styles.saveButton} ${
                    selectedLanguage === "ko" ? "ko-text" : "jp-text"
                  }`}
                >
                  {selectedLanguage === "ko" ? "추가" : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
