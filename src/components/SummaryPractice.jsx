import { useState, useEffect, useCallback, useMemo } from 'react';
import { getJyutpingText } from "to-jyutping";
import generatePractice from '../utils/GeneratePractice';
import './SummaryPractice.css';

const SummaryPractice = ({ practicedWords, onComplete }) => {
  const [inputValue, setInputValue] = useState(''); 
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentIndexInWord, setCurrentIndexInWord] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [aiContent, setAiContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 调用AI生成内容
  useEffect(() => {
    const generateContent = async () => {
      try {
        setIsLoading(true);
        setAiContent(await generatePractice(practicedWords));
        console.log(aiContent);
      } catch (error) {
        console.error('AI生成失败:', error);
        setAiContent(null);
      } finally {
        setIsLoading(false);
      }
    };
    generateContent();
  }, [practicedWords]);

  const characters = useMemo(() => {
    if (!aiContent) return [];
    return aiContent.split('').filter(char => char.trim().length > 0);
  }, [aiContent]);

  const characterJyutpings = useMemo(() => {
    return characters.map(char => getJyutpingText(char));
  }, [characters]);

  // Group characters into rows of 10
  const characterRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < characters.length; i += 10) {
      rows.push(characters.slice(i, i + 10));
    }
    return rows;
  }, [characters]);

  const handleCharacterInput = (value) => {
    const newInputValue = inputValue + value.toLowerCase();
    setInputValue(newInputValue);
    
    const expected = characterJyutpings[currentWordIndex].replace(/\s/g, '').toLowerCase();
    const isCorrect = newInputValue === expected;
    
    if (isCorrect) {
      setInputValue('');
      setCurrentIndexInWord(0);
      if (currentWordIndex < characters.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
      } else {
        setTimeout(() => onComplete(), 500);
      }
    } else if (!expected.startsWith(newInputValue)) {
      setInputValue('');
      setCurrentIndexInWord(0);
    } else {
      setCurrentIndexInWord(newInputValue.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (hasError) return;
        handleCharacterInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWordIndex, currentIndexInWord, hasError, inputValue, characterJyutpings]);

  const getHighlightedJyutping = useCallback((charIndex) => {
    const jyutping = characterJyutpings[charIndex];
    
    if (charIndex === currentWordIndex) {
      return jyutping.split('').map((char, index) => {
        const isSpace = char === ' ';
        const isTyped = index < inputValue.length;
        const isCorrectChar = isTyped && inputValue[index] === char.toLowerCase();

        if (isSpace) {
          return (
            <span key={`${charIndex}-${index}-space`} className="space-char">␣</span>
          );
        }

        return (
          <span 
            key={`${charIndex}-${index}`}
            className={
              isCorrectChar 
                ? 'correct-part'
                : hasError && isTyped
                  ? 'error-part' 
                  : isTyped
                    ? 'typed-part' 
                    : 'untyped-part'
            }
          >
            {char}
          </span>
        );
      });
    }
    else if (charIndex < currentWordIndex) {
      return (
        <span className="correct-part">
          {jyutping}
        </span>
      );
    }
    else {
      return (
        <span className="untyped-part">
          {jyutping}
        </span>
      );
    }
  }, [characterJyutpings, currentWordIndex, inputValue, hasError]);

  if (isLoading) {
    return <div className="status-message loading">正在生成练习内容...</div>;
  }

  if (!aiContent) {
    return (
      <div className="status-message error">
        无法生成练习内容
        <button onClick={onComplete} className="retry-button">
          返回常规练习
        </button>
      </div>
    );
  }

  return (
    <div className="cantonese-practice">
      <h1>总结练习</h1>
      <div className="info">
        使用以下词语生成: {practicedWords.join('、')}
      </div>
      <div className="progress">
        进度: {currentWordIndex + 1}/{characters.length}
      </div>
      
      <div className="character-rows-container">
        {characterRows.map((row, rowIndex) => {
          const startIndex = rowIndex * 10;
          return (
            <div key={rowIndex} className="character-row">
              {row.map((char, index) => {
                const charIndex = startIndex + index;
                return (
                  <div 
                    key={`char-${charIndex}`}
                    className={`character-unit ${charIndex === currentWordIndex ? 'active' : ''}`}
                  >
                    <div className="jyutping-hint">
                      {getHighlightedJyutping(charIndex)}
                    </div>
                    <div className="character-box">
                      {char}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      
      <div className="controls">
        <button onClick={onComplete} className="nav-button">
          返回常规练习
        </button>
      </div>
    </div>
  );
};

export default SummaryPractice;