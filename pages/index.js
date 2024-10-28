import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const wordList = [
  { word: "apple", meaning: "사과" },
  { word: "car", meaning: "자동차" },
  { word: "school", meaning: "학교" },
  { word: "banana", meaning: "바나나" },
  { word: "pencil", meaning: "연필" },
  // 추가 단어
];

export default function Home() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    generateOptions();
  }, [questionIndex]);

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
    const isCorrect = selectedOption.meaning === currentWord.meaning;

    setResults([...results, { ...currentWord, isCorrect }]);
    if (isCorrect) setScore(score + 1);

    if (questionIndex < 4) {
      setQuestionIndex(questionIndex + 1);
    } else {
      // 결과를 localStorage에 저장하고 결과 페이지로 이동
      localStorage.setItem("score", score);
      localStorage.setItem("results", JSON.stringify([...results, { ...currentWord, isCorrect }]));
      router.push('/results');
    }
  };

  return (
    <div>
      <h1>영어 테스트</h1>
      <div>
        <h2>문제: {wordList[questionIndex].word}</h2>
      </div>
      <div>
        {options.map((option, index) => (
          <button key={index} onClick={() => handleAnswer(option)}>
            {option.meaning}
          </button>
        ))}
      </div>
    </div>
  );
}
