import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
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
  const [lastUpdateDate, setLastUpdateDate] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ko"); // 'ko' or 'jp'
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getWords");
        const data = await response.json();
        if (Array.isArray(data.terms) && data.terms.length > 0) {
          setWordList(data.terms);
          if (data.updatedAt) {
            setLastUpdateDate(data.updatedAt.split("T")[0]);
          }
          selectRandomQuestions(data.terms, numQuestions);
        } else {
          console.error("데이터를 불러올 수 없습니다", data);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) setSelectedLanguage(savedLanguage);

    fetchData();
  }, [numQuestions]);

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
        selectedOption[selectedLanguage === "ko" ? "ko_mean" : "jp_mean"] ===
          currentWord[selectedLanguage === "ko" ? "ko_mean" : "jp_mean"]) ||
      (questionType === "meaningToWord" &&
        selectedOption.word === currentWord.word);

    if (isCorrect) setScore(score + 1);
    setResults([...results, { ...currentWord, isCorrect }]);

    if (questionIndex < selectedQuestions.length - 1) {
      setTimeout(() => setQuestionIndex(questionIndex + 1), 300);
    } else {
      const finalScore = isCorrect ? score + 1 : score;
      localStorage.setItem("score", finalScore);
      localStorage.setItem("selectedLanguage", selectedLanguage);
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

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "ko" ? "jp" : "ko";
    setSelectedLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
  };

  return (
    <>
      <Head>
        <title>Voca Quiz - 영어 단어 퀴즈</title>
        <meta
          name="description"
          content="영어 단어를 재미있게 학습하고 퀴즈로 테스트해보세요"
        />
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            onClick={toggleLanguage}
            className={`${styles.localeButton} ${
              selectedLanguage === "ko" ? "ko-text" : "jp-text"
            }`}
            lang={selectedLanguage === "ko" ? "ko" : "ja"}
          >
            {selectedLanguage === "ko" ? "한국어" : "日本語"}
          </button>
        </div>
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
                <span
                  className={`${
                    selectedLanguage === "ko" ? "ko-text" : "jp-text"
                  }`}
                >
                  {numQuestions} {selectedLanguage === "ko" ? "문제" : "問題"}
                </span>
              )}
            </div>
          </div>

          {selectedQuestions.length > 0 ? (
            <>
              <div className={styles.question}>
                <span
                  className={
                    questionType === "wordToMeaning"
                      ? "en-text"
                      : selectedLanguage === "ko"
                      ? "ko-text"
                      : "jp-text"
                  }
                >
                  {questionType === "wordToMeaning"
                    ? `${selectedQuestions[questionIndex].word}`.toUpperCase()
                    : `${
                        selectedQuestions[questionIndex][
                          selectedLanguage === "ko" ? "ko_mean" : "jp_mean"
                        ]
                      }`}
                </span>
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
                      } ${
                        questionType === "wordToMeaning"
                          ? selectedLanguage === "ko"
                            ? "ko-text"
                            : "jp-text"
                          : "en-text"
                      }`}
                      onClick={() => handleAnswer(option, index)}
                    >
                      {questionType === "wordToMeaning"
                        ? option[
                            selectedLanguage === "ko" ? "ko_mean" : "jp_mean"
                          ]
                        : option.word}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`${styles.score} ${
                  selectedLanguage === "ko" ? "ko-text" : "jp-text"
                }`}
              >
                {selectedLanguage === "ko" ? "현재 점수" : "現在のスコア"}:{" "}
                {score}
              </div>
            </>
          ) : (
            <p>{selectedLanguage === "ko" ? "로딩 중..." : "読み込み中..."}</p>
          )}
        </div>
        <div className={styles.btnWrap}>
          <button
            onClick={() => router.push("/data")}
            className={`${styles.viewAllButton} ${
              selectedLanguage === "ko" ? "ko-text" : "jp-text"
            }`}
          >
            {selectedLanguage === "ko" ? "단어 리스트" : "単語リスト"}
          </button>
          <button
            onClick={() => router.push("/conversation")}
            className={`${styles.viewAllButton} ${
              selectedLanguage === "ko" ? "ko-text" : "jp-text"
            }`}
          >
            {selectedLanguage === "ko" ? "프리토킹" : "フリートーキング"}
          </button>
          <button
            onClick={() => router.push("/pattern")}
            className={`${styles.viewAllButton} ${
              selectedLanguage === "ko" ? "ko-text" : "jp-text"
            }`}
          >
            {selectedLanguage === "ko" ? "회화패턴" : "英会話"}
          </button>
        </div>
      </div>
    </>
  );
}
