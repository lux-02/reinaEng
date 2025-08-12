import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/Data.module.css";

export default function Data() {
  const [words, setWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editedWord, setEditedWord] = useState({
    word: "",
    jp_mean: "",
    ko_mean: "",
  });
  const [newWord, setNewWord] = useState({
    word: "",
    jp_mean: "",
    ko_mean: "",
  });
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const router = useRouter();

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) setSelectedLanguage(savedLanguage);
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await fetch("/api/getWords");
      const data = await response.json();
      if (data.terms) {
        setWords(data.terms);
      }
    } catch (error) {
      console.error("Error fetching words:", error);
    }
  };

  const handleWordClick = (word) => {
    setSelectedWord(word);
    setEditedWord(word);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/updateWord", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: selectedWord._id,
          word: editedWord.word,
          meaning: editedWord.meaning,
          jp_mean: editedWord.jp_mean,
          ko_mean: editedWord.ko_mean,
        }),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchWords();
      }
    } catch (error) {
      console.error("Error updating word:", error);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/addWord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWord),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setNewWord({ word: "", meaning: "", jp_mean: "", ko_mean: "" });
        fetchWords();
      }
    } catch (error) {
      console.error("Error adding word:", error);
    }
  };

  const handleDeleteWord = async () => {
    if (
      !selectedWord ||
      !window.confirm(
        selectedLanguage === "ko"
          ? "정말로 삭제하시겠습니까?"
          : "本当に削除しますか？"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/deleteWord", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: selectedWord._id }),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchWords();
      }
    } catch (error) {
      console.error("Error deleting word:", error);
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
        <title>Voca Quiz - 단어 리스트</title>
        <meta
          name="description"
          content="영어 단어 목록을 확인하고 관리하세요"
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
          <div className={styles.titleRow}>
            <h1
              className={selectedLanguage === "ko" ? "ko-text" : "jp-text"}
              lang={selectedLanguage === "ko" ? "ko" : "ja"}
            >
              {selectedLanguage === "ko" ? "단어 목록" : "単語リスト"}
            </h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`${styles.addButton} ${
                selectedLanguage === "ko" ? "ko-text" : "jp-text"
              }`}
              lang={selectedLanguage === "ko" ? "ko" : "ja"}
            >
              {selectedLanguage === "ko" ? "단어 추가" : "単語追加"}
            </button>
          </div>

          <div className={styles.wordList}>
            {words.map((word) => (
              <div
                key={word._id}
                className={styles.wordItem}
                onClick={() => handleWordClick(word)}
              >
                <span className={`${styles.wordText} en-text`}>
                  {word.word}
                </span>
                <span
                  className={`${styles.meaningText} ${
                    selectedLanguage === "ko" ? "ko-text" : "jp-text"
                  }`}
                  lang={selectedLanguage === "ko" ? "ko" : "ja"}
                >
                  {selectedLanguage === "ko" ? word.ko_mean : word.jp_mean}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isEditModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2
                  className={selectedLanguage === "ko" ? "ko-text" : "jp-text"}
                  lang={selectedLanguage === "ko" ? "ko" : "ja"}
                >
                  {selectedLanguage === "ko" ? "단어 수정" : "単語編集"}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "단어" : "単語"}
                  </label>
                  <input
                    type="text"
                    value={editedWord.word}
                    onChange={(e) =>
                      setEditedWord({ ...editedWord, word: e.target.value })
                    }
                    required
                    className="en-text"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "일본어 뜻" : "日本語の意味"}
                  </label>
                  <input
                    type="text"
                    value={editedWord.jp_mean}
                    onChange={(e) =>
                      setEditedWord({ ...editedWord, jp_mean: e.target.value })
                    }
                    required
                    className="jp-text"
                    lang="ja"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "한국어 뜻" : "韓国語の意味"}
                  </label>
                  <input
                    type="text"
                    value={editedWord.ko_mean}
                    onChange={(e) =>
                      setEditedWord({ ...editedWord, ko_mean: e.target.value })
                    }
                    required
                    className="ko-text"
                    lang="ko"
                  />
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    onClick={handleDeleteWord}
                    className={`${styles.deleteButton} ${
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }`}
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "삭제" : "削除"}
                  </button>
                  <button
                    type="submit"
                    className={`${styles.saveButton} ${
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }`}
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "저장" : "保存"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2
                  className={selectedLanguage === "ko" ? "ko-text" : "jp-text"}
                  lang={selectedLanguage === "ko" ? "ko" : "ja"}
                >
                  {selectedLanguage === "ko"
                    ? "새 단어 추가"
                    : "新しい単語追加"}
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "단어" : "単語"}
                  </label>
                  <input
                    type="text"
                    value={newWord.word}
                    onChange={(e) =>
                      setNewWord({ ...newWord, word: e.target.value })
                    }
                    required
                    className="en-text"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "일본어 뜻" : "日本語の意味"}
                  </label>
                  <input
                    type="text"
                    value={newWord.jp_mean}
                    onChange={(e) =>
                      setNewWord({ ...newWord, jp_mean: e.target.value })
                    }
                    required
                    className="jp-text"
                    lang="ja"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label
                    className={
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "한국어 뜻" : "韓国語の意味"}
                  </label>
                  <input
                    type="text"
                    value={newWord.ko_mean}
                    onChange={(e) =>
                      setNewWord({ ...newWord, ko_mean: e.target.value })
                    }
                    required
                    className="ko-text"
                    lang="ko"
                  />
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="submit"
                    className={`${styles.saveButton} ${
                      selectedLanguage === "ko" ? "ko-text" : "jp-text"
                    }`}
                    lang={selectedLanguage === "ko" ? "ko" : "ja"}
                  >
                    {selectedLanguage === "ko" ? "추가" : "追加"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
