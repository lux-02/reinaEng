import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Home.module.css';

export default function Home() {
  const [wordList, setWordList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [questionType, setQuestionType] = useState("wordToMeaning");
  const [progress, setProgress] = useState(0);
  const [numQuestions, setNumQuestions] = useState(20); // 사용자 정의 문제 수
  const [isEditing, setIsEditing] = useState(false); // 문제 수 수정 모드
  const router = useRouter();

  // 데이터 불러오기
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
        const data = await response.json();
        setWordList(data);
        selectRandomQuestions(data, numQuestions);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  // 선택된 문제 수만큼 무작위로 선택
  const selectRandomQuestions = (data, num) => {
    const randomQuestions = data.sort(() => 0.5 - Math.random()).slice(0, num);
    setSelectedQuestions(randomQuestions);
    setQuestionIndex(0); // 처음으로 초기화
    setScore(0); // 점수 초기화
    setResults([]); // 결과 초기화
    setProgress(0); // 진행 상태 초기화
  };

  // 문제 생성 및 업데이트
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      generateQuestionType();
      generateOptions();
      setProgress(((questionIndex + 1) / selectedQuestions.length) * 100);
    }
  }, [questionIndex, selectedQuestions]);

  // 문제 유형 랜덤 설정
  const generateQuestionType = () => {
    setQuestionType(Math.random() > 0.5 ? "wordToMeaning" : "meaningToWord");
  };

  // 4개의 객관식 보기 생성
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

  // 사용자가 선택한 답안 확인
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

  // 문제 수 수정
  const handleQuestionCountChange = () => {
    const validNum = Math.max(1, Math.min(numQuestions, wordList.length));
    selectRandomQuestions(wordList, validNum);
    setIsEditing(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.quizContainer}>
        {/* 문제 수 설정 영역 */}
        <div className={styles.numQuestionsWrap}>
          <div className={styles.numQuestions} onClick={() => setIsEditing(true)}>
            {isEditing ? (
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                onBlur={handleQuestionCountChange}
                min="1"
                max={wordList.length}
                className={styles.numInput}
              />
            ) : (
              <span>{numQuestions} 문제</span>
            )}
          </div>
        </div>
        
        {/* 문제 */}
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
