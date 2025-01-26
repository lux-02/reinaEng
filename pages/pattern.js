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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatterns, setFilteredPatterns] = useState([]);

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

  useEffect(() => {
    const filtered = patterns.filter((pattern) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        pattern.name_ko.toLowerCase().includes(searchLower) ||
        pattern.name_jp.toLowerCase().includes(searchLower)
      );
    });

    // 완료되지 않은 패턴을 상단에, 완료된 패턴을 하단에 정렬
    const sortedPatterns = filtered.sort((a, b) => {
      if (a.completed === b.completed) {
        // 완료된 패턴끼리는 완료일 기준 내림차순
        if (a.completed) {
          return new Date(b.completedAt) - new Date(a.completedAt);
        }
        return 0;
      }
      return a.completed ? 1 : -1;
    });

    setFilteredPatterns(sortedPatterns);
  }, [searchTerm, patterns]);

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
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder={
            selectedLanguage === "ko" ? "패턴 검색..." : "パターン検索..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.patternGrid}>
        {filteredPatterns.map((pattern) => (
          <button
            key={pattern.id}
            className={`${styles.patternButton} ${
              pattern.completed ? styles.completed : ""
            }`}
            onClick={() => handlePatternClick(pattern.id)}
          >
            <span className={styles.patternText}>
              {pattern[selectedLanguage === "ko" ? "name_ko" : "name_jp"]}
            </span>
            <span className={styles.explanationText}>
              {pattern.explanation[selectedLanguage === "ko" ? "kr" : "jp"]}
            </span>
            {pattern.completed && (
              <span className={styles.completedDate}>
                {new Date(pattern.completedAt).toLocaleDateString(
                  selectedLanguage === "ko" ? "ko-KR" : "ja-JP",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </span>
            )}
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
                <label className="ko-text">패턴 이름 / パターン名</label>
                <input
                  type="text"
                  value={newPattern.name_ko}
                  onChange={(e) =>
                    setNewPattern({
                      ...newPattern,
                      name_ko: e.target.value,
                      name_jp: e.target.value,
                    })
                  }
                  required
                  className="ko-text"
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
