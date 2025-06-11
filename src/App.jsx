import { useEffect, useState, useMemo, useCallback } from "react";
import Typing from "./components/Typing.jsx"
import "./App.css"
import ChooseBook from "./components/ChooseBook.jsx";
import StudyRecord from "./components/StudyRecord.jsx";
import Toolbar from "./components/Toolbar.jsx";
import SummaryPractice from "./components/SummaryPractice.jsx";
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
      selectedBookPathWithIndex: {'/books/cantonese_phrases.json': 0},
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

        const currentIndex = appState.selectedBookPathWithIndex?.[appState.selectedBookPath] ?? 0;
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
          setRound(prev => round === 0 ? 1 : prev);j
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
  }, [appState.selectedBookPath, round, appState.selectedBookPathWithIndex, currentBatch, batchSize]);

  // use useEffect to save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cantoneseAppState', JSON.stringify(appState));
  }, [appState]);

  // the function of updating the state
  const updateState = (newState) => {
    setAppState(prev => ({
      ...prev,
      ...newState,
      selectedBookPathWithIndex: {
        ...prev.selectedBookPathWithIndex,
        ...(newState.selectedBookPathWithIndex || {})
      }
    }));
  };

  // handle book selection
  const handleBookSelect = (path) => {
    setTmpVocabulary([]); // 清空当前词汇
    setCurrentBatch(0);   // 重置批次
    setRound(1);          // 重置轮次
    updateState({
      selectedBookPath: path,
      selectedBookPathWithIndex: {
        // keep the original record
        ...appState.selectedBookPathWithIndex,
        // if the path was used, use the recording index. If not, use 0.
        [path]: appState.selectedBookPathWithIndex[path] || 0
      },
      currentComponent: 'Typing'
    });
  };

  const updateIndex = useCallback((path, index) => {
    setAppState(prev => ({
      ...prev,
      selectedBookPathWithIndex: {
        ...prev.selectedBookPathWithIndex,
        [path]: index
      }
    }));
  }, [batchSize]);

  const resetVocabulary = useCallback(() => {
    console.log('Resetting vocabulary and index');
    updateIndex(appState.selectedBookPath, 0);
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
          history: [
            ...(prevRecords[word]?.history || []),
            { timestamp: now, isCorrect }
          ]
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
    appState.selectedBookPathWithIndex, 
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
      case 'A': return <ChooseBook onBookSelect={handleBookSelect} />;
      case 'B': return <StudyRecord records={learningRecords} />;
      case 'C': return <Toolbar />;
      case 'Error': return <ErrorDisplay error={errorMessage} onRetry={resetVocabulary}/>;
      case 'Summary': return (
        <SummaryPractice 
          practicedWords={tmpVocabulary}
          onComplete={() => updateState({ currentComponent: 'Typing' })}
        />
      );
      default: return typingComponent;
    }
  }, [appState.currentComponent, learningRecords, tmpVocabulary, handleBookSelect, typingComponent]);
  

    // 加载和错误状态
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