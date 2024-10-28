import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '../styles/result.module.css';

// Chart.js 요소 등록
ChartJS.register(ArcElement, Tooltip, Legend);

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), { ssr: false });

export default function Results() {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // 로컬 저장소에서 데이터 불러오기
    setScore(parseInt(localStorage.getItem("score"), 10));
    setResults(JSON.parse(localStorage.getItem("results")) || []);
  }, []);

  const correctCount = score;
  const incorrectCount = results.length - score;

  // 차트 데이터 구성
  const data = {
    labels: ['정답', '오답'],
    datasets: [
      {
        data: [correctCount, incorrectCount],
        backgroundColor: ['#36A2EB', '#FF6384'], // 정답: 파란색, 오답: 빨간색
      },
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultContainer}>
        <h1 className={styles.title}>결과</h1>
        <p className={styles.score}>점수: {score} / {results.length}</p>

        {/* 원형 그래프 */}
        <div style={{ width: '20%', margin: '0 auto' }}>
          <Pie data={data} />
        </div>

        {/* 정답/오답 리스트 */}
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

        <button onClick={() => router.push('/')} className={styles.retryButton}>
          다시 하기
        </button>
      </div>
    </div>
  );
}
