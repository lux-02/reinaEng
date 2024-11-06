import { useEffect, useState } from "react";
import styles from "@/styles/Data.module.css";
import { useRouter } from "next/router";

export default function Data() {
  const [wordList, setWordList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data.json");
        const data = await response.json();

        if (Array.isArray(data.terms)) {
          setWordList(data.terms);
        } else {
          console.error("Data format is incorrect", data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    fetchData();
  }, []);

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
          {wordList.map((wordItem, index) => (
            <tr key={index}>
              <td>{wordItem.word}</td>
              <td>{wordItem.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => router.push("/")} className={styles.backButton}>
        메인 페이지로 돌아가기
      </button>
    </div>
  );
}
