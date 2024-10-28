import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Home.module.css';

const wordList = [
  { word: "Apple", meaning: "사과" },
  { word: "Car", meaning: "자동차" },
  { word: "School", meaning: "학교" },
  { word: "Banana", meaning: "바나나" },
  { word: "Pencil", meaning: "연필" },
];

export default function Home() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [questionType, setQuestionType] = useState("wordToMeaning");
  const [progress, setProgress] = useState(0); // Progress 상태 추가
  const router = useRouter();

  useEffect(() => {
    generateQuestionType();
    generateOptions();
    setProgress(((questionIndex + 1) / wordList.length) * 100); // Progress 업데이트
  }, [questionIndex]);

  const generateQuestionType = () => {
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
  
    if (isCorrect) setScore(score + 1);
    setResults([...results, { ...currentWord, isCorrect }]);

    if (questionIndex < wordList.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
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
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className={styles.optionsWrap}>
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
        </div>
        <div className={styles.score}>현재 점수: {score}</div>
      </div>
    </div>
  );
}
