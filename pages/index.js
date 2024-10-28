import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Home.module.css';

export default function Home() {
  const [wordList, setWordList] = useState([]); // 전체 데이터를 저장
  const [selectedQuestions, setSelectedQuestions] = useState([]); // 랜덤으로 선택된 20개의 문제
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [questionType, setQuestionType] = useState("wordToMeaning");
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
        const data = await response.json();
        setWordList(data);

        // 랜덤으로 20개의 문제 선택
        const randomQuestions = data.sort(() => 0.5 - Math.random()).slice(0, 20);
        setSelectedQuestions(randomQuestions);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedQuestions.length > 0) {
      generateQuestionType();
      generateOptions();
      setProgress(((questionIndex + 1) / selectedQuestions.length) * 100);
    }
  }, [questionIndex, selectedQuestions]);

  const generateQuestionType = () => {
    setQuestionType(Math.random() > 0.5 ? "wordToMeaning" : "meaningToWord");
  };

  const generateOptions = () => {
    const currentWord = selectedQuestions[questionIndex];
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
    const currentWord = selectedQuestions[questionIndex];
    const isCorrect =
      (questionType === "wordToMeaning" && selectedOption.meaning === currentWord.meaning) ||
      (questionType === "meaningToWord" && selectedOption.word === currentWord.word);

    if (isCorrect) setScore(score + 1);
    setResults([...results, { ...currentWord, isCorrect }]);

    if (questionIndex < selectedQuestions.length - 1) {
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
        {selectedQuestions.length > 0 ? (
          <>
            <div className={styles.question}>
              {questionType === "wordToMeaning"
                ? `${selectedQuestions[questionIndex].word}`.toUpperCase()
                : `${selectedQuestions[questionIndex].meaning}`}
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
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
