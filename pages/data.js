import { useEffect, useState } from "react";
import styles from "@/styles/Data.module.css";
import { useRouter } from "next/router";

export default function Data() {
  const [wordList, setWordList] = useState([]);
  const router = useRouter();
  const [lastUpdateDate, setLastUpdateDate] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleQuizletUpdate = async () => {
    try {
      const response = await fetch("/api/updateQuizletData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://quizlet.com/ph/960787628/english-flash-cards/?i=61ajga&x=1jqt",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("문제 데이터가 갱신되었습니다!");
        setWordList(result.data.terms);

        // 업데이트 날짜 설정
        const today = result.data.updatedAt.split("T")[0];
        setLastUpdateDate(today);
        localStorage.setItem("lastUpdateDate", today);
      } else {
        alert("데이터 갱신에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("Error updating quizlet data:", error);
      alert("오류가 발생했습니다. 콘솔을 확인하세요.");
    }
  };

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

  useEffect(() => {
    const scrollAndClickMore = () => {
      if (isLoadingMore) return; // Prevent multiple clicks if still waiting
      setIsLoadingMore(true);

      const moreButton = document.querySelector(
        'button[aria-label="See more"]'
      );
      if (moreButton) {
        moreButton.click();

        // Wait 3 seconds before continuing to allow content to load
        setTimeout(() => {
          setIsLoadingMore(false); // Allow next scroll and click
        }, 3000);
      } else {
        window.scrollBy(0, window.innerHeight); // Scroll down to load more content
        setIsLoadingMore(false);
      }
    };

    const observer = new MutationObserver(scrollAndClickMore);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [isLoadingMore]);

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
      <button onClick={handleQuizletUpdate} className={styles.updateButton}>
        Data Update {lastUpdateDate && `(${lastUpdateDate})`}
      </button>
      <button onClick={() => router.push("/")} className={styles.backButton}>
        메인 페이지로 돌아가기
      </button>
    </div>
  );
}
