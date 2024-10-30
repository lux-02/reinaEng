import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '@/styles/Result.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), { ssr: false });

export default function Results() {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setScore(parseInt(localStorage.getItem("score"), 10));
    setResults(JSON.parse(localStorage.getItem("results")) || []);
  }, []);

  const correctCount = score;
  const Rlength = results.length
  const incorrectCount = Rlength - score;
  const percent = Math.round((score / Rlength) * 100);
  

  const data = {
    datasets: [
      {
        data: [correctCount, incorrectCount],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultContainer}>
        <div className={styles.scoreWrap}>
            <div className={styles.score}>
              점수: {percent}점
            </div>  
        </div>
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <Pie data={data} />
          </div>
          <div className={styles.legendWrapper}>
            <ul>
              <li><span className={styles.legendColor} style={{ backgroundColor: '#36A2EB' }}></span>정답 {score}</li>
              <li><span className={styles.legendColor} style={{ backgroundColor: '#FF6384' }}></span>오답 {Rlength-score}</li>
            </ul>
          </div>
        </div>

        <div className={styles.resultWrap}>
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
        </div>
       
       <div className={styles.returnWrap}>
          <button onClick={() => router.push('/')} className={styles.retryButton}>
            RETRY
          </button>
       </div>
      </div>
    </div>
  );
}
