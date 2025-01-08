import { useEffect, useState } from "react";
import styles from "@/styles/Data.module.css";
import { useRouter } from "next/router";

export default function Data() {
  const [wordList, setWordList] = useState([]);
  const router = useRouter();
  const [lastUpdateDate, setLastUpdateDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [editForm, setEditForm] = useState({ word: "", meaning: "" });
  const [addForm, setAddForm] = useState({ word: "", meaning: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/getWords");
      const data = await response.json();

      if (Array.isArray(data.terms)) {
        setWordList(data.terms);
        if (data.updatedAt) {
          setLastUpdateDate(data.updatedAt.split("T")[0]);
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  const handleWordClick = (word) => {
    setSelectedWord({
      ...word,
      _id: word._id.toString(),
    });
    setEditForm({ word: word.word, meaning: word.meaning });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/updateWord", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: selectedWord._id,
          ...editForm,
        }),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchData(); // 데이터 새로고침
      } else {
        alert("단어 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("단어 수정 실패:", error);
      alert("단어 수정에 실패했습니다.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/addWord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setAddForm({ word: "", meaning: "" });
        fetchData(); // 데이터 새로고침
      } else {
        alert("단어 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("단어 추가 실패:", error);
      alert("단어 추가에 실패했습니다.");
    }
  };

  const handleDeleteWord = async () => {
    if (window.confirm("정말로 이 단어를 삭제하시겠습니까?")) {
      try {
        const response = await fetch("/api/deleteWord", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: selectedWord._id,
          }),
        });

        if (response.ok) {
          setIsEditModalOpen(false);
          fetchData(); // 데이터 새로고침
        } else {
          alert("단어 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("단어 삭제 실패:", error);
        alert("단어 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1>전체 단어 리스트 ({wordList.length}개)</h1>
      <table className={styles.wordTable}>
        <thead>
          <tr>
            <th>단어 (Word)</th>
            <th>뜻 (Meaning)</th>
          </tr>
        </thead>
        <tbody>
          {wordList.map((wordItem) => (
            <tr key={wordItem._id} onClick={() => handleWordClick(wordItem)}>
              <td>{wordItem.word}</td>
              <td>{wordItem.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.buttonContainer}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={styles.addButton}
        >
          단어 추가
        </button>
        <button onClick={() => router.push("/")} className={styles.backButton}>
          메인 페이지로 돌아가기
        </button>
      </div>

      {/* 수정 모달 */}
      {isEditModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>단어 수정</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={editForm.word}
                onChange={(e) =>
                  setEditForm({ ...editForm, word: e.target.value })
                }
                placeholder="단어"
                required
              />
              <input
                type="text"
                value={editForm.meaning}
                onChange={(e) =>
                  setEditForm({ ...editForm, meaning: e.target.value })
                }
                placeholder="의미"
                required
              />
              <div className={styles.modalButtons}>
                <button
                  type="button"
                  onClick={handleDeleteWord}
                  className={styles.deleteButton}
                >
                  삭제
                </button>
                <button type="submit" className={styles.editButton}>
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {isAddModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>단어 추가</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <input
                type="text"
                value={addForm.word}
                onChange={(e) =>
                  setAddForm({ ...addForm, word: e.target.value })
                }
                placeholder="단어"
                required
              />
              <input
                type="text"
                value={addForm.meaning}
                onChange={(e) =>
                  setAddForm({ ...addForm, meaning: e.target.value })
                }
                placeholder="의미"
                required
              />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.addSubmitButton}>
                  단어 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
