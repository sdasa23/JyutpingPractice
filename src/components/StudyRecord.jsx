import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './StudyRecord.css';

const StudyRecord = ({ records }) => {
  const [sortBy, setSortBy] = useState('lastPracticed');
  const [filter, setFilter] = useState('');
  
  // 处理和学习统计
  const { wordList, stats } = useMemo(() => {
    const wordEntries = Object.values(records);
    const totalCorrect = wordEntries.reduce((sum, r) => sum + r.correctCount, 0);
    const totalWrong = wordEntries.reduce((sum, r) => sum + r.wrongCount, 0);
    
    return {
      wordList: wordEntries,
      stats: {
        totalWords: wordEntries.length,
        totalCorrect,
        totalWrong,
        accuracy: totalCorrect + totalWrong > 0 
          ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
          : 0
      }
    };
  }, [records]);

  // 排序和筛选
  const processedWords = useMemo(() => {
    let result = [...wordList];
    
    // 筛选
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(wordObj => 
        wordObj.word.toLowerCase().includes(lowerFilter)
      );
    }
    
    // 排序
    switch (sortBy) {
      case 'word':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'lastPracticed':
        result.sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed));
        break;
      case 'correctCount':
        result.sort((a, b) => b.correctCount - a.correctCount);
        break;
      case 'accuracy':
        result.sort((a, b) => {
          const aAccuracy = a.correctCount / (a.correctCount + a.wrongCount);
          const bAccuracy = b.correctCount / (b.correctCount + b.wrongCount);
          return bAccuracy - aAccuracy;
        });
        break;
      default:
        break;
    }
    
    return result;
  }, [wordList, filter, sortBy]);

  return (
    <div className="study-record-container">
      <h2>粤语学习记录</h2>
      
      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-value">{stats.totalWords}</div>
          <div className="stat-label">已学词汇</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCorrect}</div>
          <div className="stat-label">总正确次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalWrong}</div>
          <div className="stat-label">总错误次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">正确率</div>
        </div>
      </div>
      
      <div className="controls">
        <input
          type="text"
          placeholder="搜索词汇..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="lastPracticed">按最近练习</option>
          <option value="word">按词汇排序</option>
          <option value="correctCount">按正确次数</option>
          <option value="accuracy">按正确率</option>
        </select>
      </div>
      
      {processedWords.length === 0 ? (
        <div className="empty-state">
          {wordList.length === 0 ? (
            <>
              <p>尚未学习任何词汇</p>
              <p>去"练习粤拼"开始学习吧！</p>
            </>
          ) : (
            <p>没有找到匹配的词汇</p>
          )}
        </div>
      ) : (
        <div className="word-table">
          <div className="table-header">
            <div className="header-cell">词汇</div>
            <div className="header-cell">首次学习</div>
            <div className="header-cell">最后练习</div>
            <div className="header-cell">正确</div>
            <div className="header-cell">错误</div>
            <div className="header-cell">正确率</div>
          </div>
          
          {processedWords.map((record) => {
            const accuracy = record.correctCount + record.wrongCount > 0
              ? Math.round((record.correctCount / (record.correctCount + record.wrongCount)) * 100)
              : 0;
              
            return (
              <div key={record.word} className="table-row">
                <div className="table-cell word-cell">{record.word}</div>
                <div className="table-cell">{new Date(record.firstLearned).toLocaleDateString()}</div>
                <div className="table-cell">{new Date(record.lastPracticed).toLocaleString()}</div>
                <div className="table-cell correct-cell">{record.correctCount}</div>
                <div className="table-cell wrong-cell">{record.wrongCount}</div>
                <div className="table-cell">
                  <div className="accuracy-bar" style={{ width: `${accuracy}%` }} />
                  <span>{accuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

StudyRecord.propTypes = {
  records: PropTypes.objectOf(
    PropTypes.shape({
      word: PropTypes.string.isRequired,
      firstLearned: PropTypes.string.isRequired,
      lastPracticed: PropTypes.string.isRequired,
      correctCount: PropTypes.number.isRequired,
      wrongCount: PropTypes.number.isRequired,
      history: PropTypes.arrayOf(
        PropTypes.shape({
          timestamp: PropTypes.string.isRequired,
          isCorrect: PropTypes.bool.isRequired
        })
      ).isRequired
    })
  ).isRequired
};

export default StudyRecord;