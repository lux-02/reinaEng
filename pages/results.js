import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/result.module.css';

export default function Results() {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // 로컬 저장소에서 데이터 불러오기
    setScore(parseInt(localStorage.getItem("score"), 10));
    setResults(JSON.parse(localStorage.getItem("results")) || []);
  }, []);

  const handleRetry = () => {
    // 로컬 저장소 데이터 초기화
    localStorage.removeItem("score");
    localStorage.removeItem("results");
    // 메인 페이지로 이동
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultContainer}>
        <h1 className={styles.title}>결과</h1>
        <p className={styles.score}>점수: {score} / 5</p>
        <ul className={styles.resultList}>
          {results.map((result, index) => (
            <li
              key={index}
              className={`${styles.resultItem} ${result.isCorrect ? styles.correct : styles.incorrect}`}
            >
              {result.word} - {result.meaning}
              <span>{result.isCorrect ? "정답" : "오답"}</span>
            </li>
          ))}
        </ul>
        <button onClick={handleRetry} className={styles.retryButton}>
          다시 하기
        </button>
      </div>
    </div>
  );
}
