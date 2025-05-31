import { useState, useEffect, useCallback, useMemo } from 'react';
import './Typing.css';
import { getJyutpingText } from "to-jyutping";

// Import sound files (you'll need to provide these files in your public folder)
const typingSound = new Audio('/sounds/type.wav');
const correctSound = new Audio('/sounds/correct.wav');
const wrongSound = new Audio('/sounds/wrong.wav');

// Preload sounds
[typingSound, correctSound, wrongSound].forEach(sound => {
  sound.preload = 'auto';
});

const Typing = ({ dataUrl }) => {
  // State management
  const [vocabulary, setVocabulary] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Play sound helper function
  const playSound = useCallback((sound) => {
    if (isMuted) return;
    sound.currentTime = 0; // Rewind to start
    sound.play().catch(e => console.log("Audio play failed:", e));
  }, [isMuted]);

  // Fetch vocabulary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setVocabulary(data);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('数据加载失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataUrl]);

  // Memoized current item with jyutping
  const currentItem = useMemo(() => {
    if (!vocabulary.length || !vocabulary[currentIndex]) return {};
    const item = { ...vocabulary[currentIndex] };
    item.jyutping = getJyutpingText(item.word);
    return item;
  }, [vocabulary, currentIndex]);

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % vocabulary.length);
    resetInputState();
  }, [vocabulary.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? vocabulary.length - 1 : prevIndex - 1
    );
    resetInputState();
  }, [vocabulary.length]);

  const resetInputState = useCallback(() => {
    setInputValue('');
    setIsCorrect(null);
    setHasError(false);
  }, []);

  // Answer checking logic
  const checkAnswer = useCallback(() => {
    if (!currentItem.jyutping) return;
    
    const expected = currentItem.jyutping.replace(/\s/g, '').toLowerCase();
    const typed = inputValue.toLowerCase();
    
    if (typed === expected) {
      setIsCorrect(true);
      playSound(correctSound);
      setTimeout(goToNext, 800);
    } else {
      setIsCorrect(false);
      setHasError(true);
      playSound(wrongSound);
      setTimeout(resetInputState, 800);
    }
  }, [inputValue, currentItem.jyutping, goToNext, resetInputState, playSound]);

  // Real-time input validation
  useEffect(() => {
    if (!inputValue.length || !currentItem.jyutping || hasError) return;
    
    const expected = currentItem.jyutping.replace(/\s/g, '').toLowerCase();
    const typed = inputValue.toLowerCase();
    
    if (!expected.startsWith(typed)) {
      setHasError(true);
      playSound(wrongSound);
      setTimeout(resetInputState, 800);
    }
  }, [inputValue, currentItem.jyutping, hasError, resetInputState]);

  // Check if input length matches Jyutping length (excluding spaces)
  useEffect(() => {
    if (!currentItem.jyutping) return;
    
    const expectedLength = currentItem.jyutping.replace(/\s/g, '').length;
    if (inputValue.length === expectedLength) {
      checkAnswer();
    }
  }, [inputValue, currentItem.jyutping, checkAnswer]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        checkAnswer();
      } else if (e.key === ' ' && e.ctrlKey) {
        goToNext();
      } else if (e.key === 'h' && e.ctrlKey) {
        setShowHint(prev => !prev);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (hasError) return;
        setInputValue(prev => {
          const newValue = prev + e.key.toLowerCase();
          // Play typing sound only when actually adding a character
          if (newValue.length > prev.length) {
            playSound(typingSound);
          }
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkAnswer, goToNext, hasError, playSound]);

  const getTypedIndex = useCallback((originalIndex) => {
    if (!currentItem.jyutping) return null;
    
    let typedIndex = 0;
    let originalPos = 0;
    
    // 遍历直到找到对应的原始位置
    while (originalPos < originalIndex && typedIndex < inputValue.length) {
      if (currentItem.jyutping[originalPos] !== ' ') {
        typedIndex++;
      }
      originalPos++;
    }
    
    // 如果当前位置是空格或者已经超出输入长度，返回null
    if (currentItem.jyutping[originalIndex] === ' ' || typedIndex >= inputValue.length) {
      return null;
    }
    
    return typedIndex;
  }, [currentItem.jyutping, inputValue]);

  const getHighlightedHint = useCallback(() => {
    if (!currentItem.jyutping) return null;

    return (
      <div className="letter-slots"> 
        {currentItem.jyutping.split('').map((char, index) => {
          const isSpace = char === ' ';
          const typedIndex = getTypedIndex(index);
          const isTyped = typedIndex !== null;
          const isCorrectChar = isTyped && 
            inputValue[typedIndex]?.toLowerCase() === char.toLowerCase();

          return isSpace ? (
            <div key={index} className="letter-slot space"> 
              <span className="space-char">␣</span>
            </div>
          ) : (
            <div 
              key={index} 
              className={`letter-slot ${hasError ? 'error' : ''}`} 
            >
              <span className={
                isCorrectChar 
                  ? 'correct'
                  : hasError
                    ? 'error-part' 
                    : isTyped
                      ? 'typed-part' 
                      : 'untyped-part'
              }>
                {char}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [currentItem.jyutping, inputValue, hasError, getTypedIndex]);


  const renderLetterSlots = useCallback(() => {
    if (!currentItem.jyutping) return null;
    
    return (
      <div className="letter-slots">
        {currentItem.jyutping.split('').map((char, index) => {
          const isSpace = char === ' ';
          const typedIndex = getTypedIndex(index);
          const isTyped = typedIndex !== null;
          const isCorrectChar = isTyped && 
            inputValue[typedIndex]?.toLowerCase() === char.toLowerCase();

          return isSpace ? (
            <div key={index} className="letter-slot space">
              <span className="space-char">␣</span>
            </div>
          ) : (
            <div key={index} className={`letter-slot ${hasError ? 'error' : ''}`}>
              {isTyped && isCorrectChar && (
                <span className="typed-letter">{char}</span>
              )}
              <span className="underline">_</span>
            </div>
          );
        })}
      </div>
    );
  }, [currentItem.jyutping, inputValue, hasError, getTypedIndex]);

  // Loading and error states
  if (isLoading) return <div className="status-message">加载中...</div>;
  if (errorMessage) return <div className="status-message error">{errorMessage}</div>;
  if (vocabulary.length === 0) return <div className="status-message">没有可用的词汇数据</div>;
  if (!currentItem.word) return <div className="status-message">当前词汇数据异常</div>;

  return (
    <div className="cantonese-practice">
      <h1>粤语拼音练习</h1>
      <div className="progress">
        进度: {currentIndex + 1}/{vocabulary.length}
      </div>
      
      <div className="character-container">
        <div className="character">{currentItem.word}</div>
        {showHint ? (
          <div className={`hint ${isCorrect ? 'correct' : ''}`}>
            {getHighlightedHint()}
          </div>
        ) : (
          renderLetterSlots()
        )}
      </div>
      
      <div className="controls">
        <button onClick={() => setShowHint(!showHint)}>
          {showHint ? '隐藏提示' : '显示提示'} (h)
        </button>
        <button onClick={goToPrev}>上一个</button>
        <button onClick={goToNext}>下一个 (空格)</button>
      </div>
    </div>
  );
};

export default Typing;