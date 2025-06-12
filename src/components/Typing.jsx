import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './Typing.css';
import { getJyutpingText } from "to-jyutping";
import JyutpingAudioPlayer from './JyutpingAudioPlayer';
// pre load audio files
const typingSound = new Audio('/JyutpingPractice/sounds/type.wav');
const correctSound = new Audio('/JyutpingPractice/sounds/correct.wav');
const wrongSound = new Audio('/JyutpingPractice/sounds/wrong.wav');

[typingSound, correctSound, wrongSound].forEach(sound => {
  sound.preload = 'auto';
});

// Typing component
const Typing = ({ 
  vocabulary,
  onAnswer,
  round = 1,
  updateRound
}) => {
  // state variables
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // update the showHint state based on the round
  // state must be a boolean
  const showHintDependOnRound = ((state) => {
    if (round === 1) {
      setShowHint(state);
    }else if (round === 2) {
      setShowHint(state);
    }else if (round === 3) {
      setShowHint(false);
    }else {
      setShowHint(false);
    }
  })

  // play sound function
  const playSound = useCallback((sound) => {
    if (isMuted || !sound) return;
    sound.currentTime = 0;
    sound.play()
         .catch(e => console.error("Audio play failed:", e));
  }, [isMuted]);
  
  // current word item
  const currentItem = useMemo(() => {
    if (!vocabulary.length || !vocabulary[currentIndex]) return {};
    const item = { ...vocabulary[currentIndex] };
    item.jyutping = getJyutpingText(item.word);
    return item;
  }, [vocabulary, currentIndex]);

  // reset input state
  const resetInputState = useCallback(() => {
    setInputValue('');
    setHasError(false);
  }, []);

  // negative functions
  const goToNext = useCallback(() => {
    setCurrentIndex(currentIndex + 1);    
    resetInputState();
  }, [currentIndex, vocabulary.length, resetInputState]);

  const goToPrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? 0 : currentIndex - 1;
    setCurrentIndex(newIndex);
    resetInputState();
  }, [currentIndex, vocabulary.length, resetInputState]);

  // In round 1, user can see the hint
  // In round 2, user needs to type the jyutping without hint, but he can see the hint if he press shortcut and listen the audio.
  // In round 3, user shoulds type the jyutping without hint, and he cannot see the hint, but can listen the audio.
  useEffect(() => {
    if (round === 1) {
      showHintDependOnRound(true);
    } else if (round === 2) {
      showHintDependOnRound(false);
    } else if (round === 3) {
      showHintDependOnRound(false);
    }
  }, [round]);

  // check input value
  useEffect(() => {
    if (!inputValue.length || !currentItem.jyutping || hasError) return;
    
    const expected = currentItem.jyutping.replace(/\s/g, '').toLowerCase();
    const typed = inputValue.toLowerCase();
    
    if (!expected.startsWith(typed)) {
      setHasError(true);
      playSound(wrongSound);
      setTimeout(resetInputState, 800);
      onAnswer(currentItem.word, false);
    }
  }, [inputValue, currentItem.jyutping, hasError, resetInputState, playSound]);

  // check answer correctness
  useEffect(() => {
    if (!currentItem.jyutping || !inputValue) return;
    
    const expected = currentItem.jyutping.replace(/\s/g, '').toLowerCase();
    const typed = inputValue.toLowerCase();
    
    if (inputValue.length === expected.length) {
      const isCorrectAnswer = typed === expected;
      
      if (isCorrectAnswer) {
        playSound(correctSound);
        onAnswer(currentItem.word, true);
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          resetInputState();
        }, 800);
      } else {
        setHasError(true);
        playSound(wrongSound);
        onAnswer(currentItem.word, false);
        setTimeout(resetInputState, 800);
      }
    }
  }, [inputValue, currentItem, currentIndex, vocabulary.length, resetInputState, playSound]);

  // handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && e.ctrlKey) {
        goToNext();
      } else if (e.key === 'q' && e.ctrlKey ) { 
        showHintDependOnRound(true);
      } else if (e.key === 'p' && e.ctrlKey) { 
        setIsPlayingAudio(true);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (hasError) return;
        setInputValue(prev => {
          const newValue = prev + e.key.toLowerCase();
          if (newValue.length > prev.length) {
            playSound(typingSound);
          }
          return newValue;
        });
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'q' && e.ctrlKey) {
        showHintDependOnRound(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [goToNext, hasError, playSound]);

  // update round and reset index when reaching the end of vocabulary
  useEffect(() => {
    // add vocabulary.length > 0, to avoid currentIndex = vocabulary.length = 0
    if (currentIndex === vocabulary.length && vocabulary.length > 0) {
      if (round === 1) {
        updateRound(2);
        setCurrentIndex(0);
      }else if (round === 2) {
        updateRound(3);
        setCurrentIndex(0);
      }else if (round === 3) {
        updateRound(0);

        setCurrentIndex(0);
      }
    }
  }, [currentIndex, vocabulary])

  // get the index of typed characters
  const getTypedIndex = useCallback((originalIndex) => {
    if (!currentItem.jyutping) return null;
    
    let typedIndex = 0;
    let originalPos = 0;
    
    while (originalPos < originalIndex && typedIndex < inputValue.length) {
      if (currentItem.jyutping[originalPos] !== ' ') {
        typedIndex++;
      }
      originalPos++;
    }
    
    if (currentItem.jyutping[originalIndex] === ' ' || typedIndex >= inputValue.length) {
      return null;
    }
    
    return typedIndex;
  }, [currentItem.jyutping, inputValue]);

  // render highlighted jyutping hint
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
            <div key={`${index}-space`} className="letter-slot space"> 
              <span className="space-char">␣</span>
            </div>
          ) : (
            <div 
              key={index} 
              className={`letter-slot ${hasError ? 'error' : ''}`} 
            >
              <span className={
                isCorrectChar 
                  ? 'typed-letter'
                  : hasError
                    ? 'error-letter' 
                    : isTyped
                      ? 'typed-letter'
                      : 'untyped-letter'
              }>
                {char}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [currentItem.jyutping, inputValue, hasError, getTypedIndex]);

  // render input slots
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
            <div key={`${index}-space`} className="letter-slot space">
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

  if (vocabulary.length === 0) return (
    <div className="status-message">
      没有可用的词汇数据
    </div>
  );
  
  if (!currentItem.word) return (
    <div className="status-message">
      当前词汇数据异常
    </div>
  );

  return (
    <div className="cantonese-practice">
      <h1>粤语拼音练习</h1>
      <div className="progress">
        进度: {currentIndex + 1}/{vocabulary.length}  ||  Round: {round}
      </div>
      
      <div className="character-container">
        {showHint ? (
          getHighlightedHint()
        ) : (
          renderLetterSlots()
        )}
        <div className="character">
          {currentItem.word}
          <JyutpingAudioPlayer 
            jyutping={currentItem.jyutping}
            isMuted={isMuted}
            onPlayingChange={setIsPlayingAudio}
          />
        </div>
        
        {/* 显示翻译 */}
        {currentItem.translation && (
          <div className="translation">
            <strong>翻译: </strong>{currentItem.translation}
          </div>
        )}
        
        {/* 显示例句 */}
        {currentItem.example_sentence && (
          <div className="example-sentence">
            <strong>例句: </strong>{currentItem.example_sentence}
          </div>
        )}
        
      </div>
      
      <div className="controls">
        <button 
          onClick={() => showHintDependOnRound(!showHint)}
          className={`hint-button ${showHint ? 'active' : ''}`}
        >
          {showHint ? '隐藏粤拼' : '显示粤拼'} (ctrl+q)
        </button>
        <button onClick={goToPrev} className="nav-button">
          上一个
        </button>
        <button onClick={goToNext} className="nav-button">
          下一个 (Ctrl+空格)
        </button>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`sound-button ${isMuted ? 'muted' : ''}`}
        >
          {isMuted ? '开启音效' : '关闭音效'}
        </button>
      </div>
    </div>
  );
};

export default Typing;