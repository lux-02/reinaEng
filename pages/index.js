import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Home.module.css';

const wordList = [
  { word: "apple", meaning: "사과" },
  { word: "car", meaning: "자동차" },
  { word: "school", meaning: "학교" },
  { word: "banana", meaning: "바나나" },
  { word: "pencil", meaning: "연필" },
];

export default function Home() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [questionType, setQuestionType] = useState("wordToMeaning"); // 초기 유형 설정
  const router = useRouter();

  useEffect(() => {
    generateQuestionType();
    generateOptions();
  }, [questionIndex]);

  const generateQuestionType = () => {
    // 문제 유형을 랜덤으로 선택
    setQuestionType(Math.random() > 0.5 ? "wordToMeaning" : "meaningToWord");
  };

  const generateOptions = () => {
    const currentWord = wordList[questionIndex];
    const choices = [currentWord];
    while (choices.length < 4) {
      const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
      if (!choices.find((choice) => choice.word === randomWord.word)) {
        choices.push(randomWord);
      }
    }
    setOptions(choices.sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (selectedOption) => {
    const currentWord = wordList[questionIndex];
    const isCorrect =
      (questionType === "wordToMeaning" && selectedOption.meaning === currentWord.meaning) ||
      (questionType === "meaningToWord" && selectedOption.word === currentWord.word);
  
    // 정답일 때만 점수 증가
    if (isCorrect) setScore(score + 1);
  
    // 결과 업데이트
    setResults([...results, { ...currentWord, isCorrect }]);
  
    if (questionIndex < 4) {
      // 다음 문제로 이동
      setQuestionIndex(questionIndex + 1);
    } else {
      // 마지막 문제 이후 점수를 최신 상태로 저장
      const finalScore = isCorrect ? score + 1 : score;
      localStorage.setItem("score", finalScore);
      localStorage.setItem("results", JSON.stringify([...results, { ...currentWord, isCorrect }]));
      router.push('/results');
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.quizContainer}>
        <div className={styles.question}>
          {questionType === "wordToMeaning"
            ? `${wordList[questionIndex].word}`.toUpperCase()
            : `${wordList[questionIndex].meaning}`}
        </div>
        <div className={styles.options}>
          {options.map((option, index) => (
            <button
              key={index}
              className={styles.optionButton}
              onClick={() => handleAnswer(option)}
            >
              {questionType === "wordToMeaning" ? option.meaning : option.word}
            </button>
          ))}
        </div>
        <div className={styles.score}>현재 점수: {score}</div>
      </div>
    </div>
  );
}
