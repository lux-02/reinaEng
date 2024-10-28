import { useEffect, useState } from 'react';

export default function Results() {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  useEffect(() => {
    // localStorage에서 데이터 로드
    setScore(parseInt(localStorage.getItem("score"), 10));
    setResults(JSON.parse(localStorage.getItem("results")) || []);
  }, []);

  return (
    <div>
      <h1>결과</h1>
      <p>점수: {score} / 5</p>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            {result.word} - {result.meaning} : {result.isCorrect ? '정답' : '오답'}
          </li>
        ))}
      </ul>
    </div>
  );
}
