import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [wordList, setWordList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [questionType, setQuestionType] = useState("wordToMeaning");
  const [progress, setProgress] = useState(0);
  const [numQuestions, setNumQuestions] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data.json");
        const data = await response.json();

        if (Array.isArray(data.terms)) {
          setWordList(data.terms);
          selectRandomQuestions(data.terms, numQuestions);
          setLastUpdateDate(data.updatedAt ? data.updatedAt.split("T")[0] : "");
        } else {
          console.error("Data format is incorrect", data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const selectRandomQuestions = (data, num) => {
    const randomQuestions = data.sort(() => 0.5 - Math.random()).slice(0, num);
    setSelectedQuestions(randomQuestions);
    setQuestionIndex(0);
    setScore(0);
    setResults([]);
    setProgress(0);
    setSelectedOptionIndex(null);
  };

  useEffect(() => {
    if (selectedQuestions.length > 0) {
      generateQuestionType();
      generateOptions();
      setProgress(((questionIndex + 1) / selectedQuestions.length) * 100);
      setSelectedOptionIndex(null);
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

  const handleAnswer = (selectedOption, index) => {
    setSelectedOptionIndex(index);

    const currentWord = selectedQuestions[questionIndex];
    const isCorrect =
      (questionType === "wordToMeaning" &&
        selectedOption.meaning === currentWord.meaning) ||
      (questionType === "meaningToWord" &&
        selectedOption.word === currentWord.word);

    if (isCorrect) setScore(score + 1);
    setResults([...results, { ...currentWord, isCorrect }]);

    if (questionIndex < selectedQuestions.length - 1) {
      setTimeout(() => setQuestionIndex(questionIndex + 1), 300);
    } else {
      const finalScore = isCorrect ? score + 1 : score;
      localStorage.setItem("score", finalScore);
      localStorage.setItem(
        "results",
        JSON.stringify([...results, { ...currentWord, isCorrect }])
      );
      router.push("/results");
    }
  };

  const handleQuestionCountChange = () => {
    const validNum = Math.max(1, Math.min(numQuestions, wordList.length));
    selectRandomQuestions(wordList, validNum);
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleQuestionCountChange();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.quizContainer}>
        <div className={styles.numQuestionsWrap}>
          <div
            className={styles.numQuestions}
            onClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                onBlur={handleQuestionCountChange}
                onKeyDown={handleKeyDown}
                min="1"
                max={wordList.length}
                className={styles.numInput}
              />
            ) : (
              <span>{numQuestions} 문제</span>
            )}
          </div>
        </div>

        {selectedQuestions.length > 0 ? (
          <>
            <div className={styles.question}>
              {questionType === "wordToMeaning"
                ? `${selectedQuestions[questionIndex].word}`.toUpperCase()
                : `${selectedQuestions[questionIndex].meaning}`}
            </div>
            <div className={styles.progressBarWrap}>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div className={styles.optionsWrap}>
              <div className={styles.options}>
                {options.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.optionButton} ${
                      selectedOptionIndex === index ? styles.selected : ""
                    }`}
                    onClick={() => handleAnswer(option, index)}
                  >
                    {questionType === "wordToMeaning"
                      ? option.meaning
                      : option.word}
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
      <div className={styles.btnWrap}>
        <button
          onClick={() => router.push("/data")}
          className={styles.viewAllButton}
        >
          전체 단어 보기
        </button>
      </div>
    </div>
  );
}
