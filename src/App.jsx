import { useEffect, useState, useMemo, useCallback } from "react";
import Typing from "./components/Typing.jsx"
import "./App.css"
import ChooseBook from "./components/ChooseBook.jsx";
import StudyRecord from "./components/StudyRecord.jsx";
import Toolbar from "./components/Toolbar.jsx";
import ErrorDisplay from "./components/ErrorDisplay.jsx";

function App(){
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // store application state in sessionStroage
  const [appState, setAppState] = useState(() => {
  const saved = localStorage.getItem('cantoneseAppState');
    return saved ? JSON.parse(saved) : {
      currentComponent: 'Typing',
      selectedBookPath: '/books/cantonese_phrases.json',
      bookProgressIndex: {'/books/cantonese_phrases.json': 0},
      bookPracticeTime: {'/books/cantonese_phrases.json': 0},
      };
  });

  const [learningRecords, setLearningRecords] = useState(() => {
    const saved = localStorage.getItem('cantoneseLearningRecords');
    return saved ? JSON.parse(saved) : {};
  });

  const [round, setRound] = useState(1);
  const [tmpVocabulary, setTmpVocabulary] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(0); // words batch index
  const [batchSize, setBatchSize] = useState(10); // The word number in each batch

  // Get word list
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(appState.selectedBookPath);
        if (!response.ok) throw new Error('Network response was not ok');
        const fullData = await response.json();
        
        if (!isMounted) return;

        const currentIndex = appState.bookProgressIndex?.[appState.selectedBookPath] ?? 0;
        let nextBatch = [];

        if (round === 0) {
          updateIndex(appState.selectedBookPath, currentIndex + batchSize);
          const nextBatchStart = currentBatch * batchSize;
          nextBatch = fullData.slice(nextBatchStart, nextBatchStart + batchSize);
          
          if (nextBatch.length > 0) {
            setCurrentBatch(prev => prev + 1);
          }
        } else {
          nextBatch = fullData.slice(currentIndex, currentIndex + batchSize);
        }

        if (nextBatch.length > 0) {
          setTmpVocabulary([...nextBatch]);
          setRound(prev => round === 0 ? 1 : prev);
          setErrorMessage('');
        } else {
          setErrorMessage(round === 0 ? '已加载所有单词' : '已学习此单词本的所有单词');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) setErrorMessage('数据加载失败，请稍后重试');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [appState.selectedBookPath, round, appState.bookProgressIndex, currentBatch, batchSize]);

  // use useEffect to save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cantoneseAppState', JSON.stringify(appState));
  }, [appState]);

  // the function of updating the state
  const updateState = (newState) => {
    setAppState(prev => ({
      ...prev,
      ...newState,
      bookProgressIndex: {
        ...prev.bookProgressIndex,
        ...(newState.bookProgressIndex || {})
      }
    }));
  };

  // handle book selection
  const handleBookSelect = (path) => {
    setTmpVocabulary([]); 
    setCurrentBatch(0);   
    setRound(1);
    setErrorMessage(''); // reset error message when a new book is selected         
    updateState({
      selectedBookPath: path,
      bookProgressIndex: {
        // keep the original record
        ...appState.bookProgressIndex,
        // if the path was used, use the recording index. If not, use 0.
        [path]: appState.bookProgressIndex[path] || 0
      },
      bookPracticeTime: {
        ...appState.bookPracticeTime,
        [path]: appState.bookPracticeTime[path] || 0
      },
      currentComponent: 'Typing'
    });
  };

  const updateIndex = useCallback((path, index) => {
    setAppState(prev => ({
      ...prev,
      bookProgressIndex: {
        ...prev.bookProgressIndex,
        [path]: index
      }
    }));
  }, []);

  const updatePracticeTime = useCallback((path) => {
    setAppState(prev => ({
      ...prev,
      bookPracticeTime: {
        ...prev.bookPracticeTime,
        [path]: (prev.bookPracticeTime[path] || 0) + 1
      }
    }));
  }, []);


  const resetVocabulary = useCallback(() => {
    console.log('Resetting vocabulary and index');
    updateIndex(appState.selectedBookPath, 0);
    updatePracticeTime(appState.selectedBookPath);
    setTmpVocabulary([]);
    setCurrentBatch(0);
    setRound(1);
  }
  , [appState.selectedBookPath ,updateIndex, setTmpVocabulary, setCurrentBatch, setRound]);

  // update the learning record, when a word is practiced
  const updateLearningRecord = (word, isCorrect) => {
    const now = new Date().toISOString();
    
    setLearningRecords(prevRecords => {
      const updatedRecords = {
        ...prevRecords,
        [word]: {
          word,
          firstLearned: prevRecords[word]?.firstLearned || now,
          lastPracticed: now,
          correctCount: (prevRecords[word]?.correctCount || 0) + (isCorrect ? 1 : 0),
          wrongCount: (prevRecords[word]?.wrongCount || 0) + (isCorrect ? 0 : 1),
          // history: [
          //   ...(prevRecords[word]?.history || []),
          //   { timestamp: now, isCorrect }
          // ]
        }
      };
      
      localStorage.setItem('cantoneseLearningRecords', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  };

  // memoize the Typing component to avoid unnecessary re-renders
  const typingComponent = useMemo(() => (
    <Typing 
      vocabulary={tmpVocabulary}
      onAnswer={updateLearningRecord}
      round={round}
      updateRound={setRound}
    />
  ), [
    appState.selectedBookPath, 
    appState.bookProgressIndex, 
    updateLearningRecord,
    updateIndex,
    round
  ]);

  useEffect(() => {
    // If there is an error message, switch to the Error component
    if (errorMessage) {
      updateState({ currentComponent: 'Error' });
    } else {
      // If no error, switch to Typing component
      updateState({ currentComponent: 'Typing' });
    }
  }, [errorMessage])

  // render the component based on the current state
  const renderComponent = useCallback(() => {
    switch (appState.currentComponent) {
      case 'A': return <ChooseBook onBookSelect={handleBookSelect} appRecord={appState}/>;
      case 'B': return <StudyRecord records={learningRecords} />;
      case 'C': return <Toolbar />;
      case 'Error': return <ErrorDisplay error={errorMessage} onRetry={resetVocabulary} onUpdateState={updateState}/>;
      default: return typingComponent;
    }
  }, [appState.currentComponent, learningRecords, tmpVocabulary, handleBookSelect, typingComponent]);
  

    // loading state
  if (isLoading) return (
    <div className="status-message loading">
      <div className="spinner"></div>
      加载中...
    </div>
  );
  
  return (
    <div className="App-container">
      <div className="button-group">
        <button className="switch-button" onClick={() => updateState({ currentComponent: 'Typing' })}>
          练习粤拼
        </button>
        <button className="switch-button" onClick={() => updateState({ currentComponent: 'A' })}>
          单词书
        </button>
        <button className="switch-button" onClick={() => updateState({ currentComponent: 'B' })}>
          学习记录
        </button>
        <button className="switch-button" onClick={() => updateState({ currentComponent: 'C' })}>
          工具栏
        </button>
      </div>
      
      <div className="component-container">
        {renderComponent()}
      </div>
    </div>
  );
}

export default App;