import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ErrorDisplay.css';

function ErrorDisplay({ error = '', onRetry = () => window.location.reload(), onUpdateState }) {
  const [buttonDisplay, setButtonDisplay] = useState('重试');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFullOptions, setShowFullOptions] = useState(false);

  useEffect(() => {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    setErrorMessage(message);

    if (message.trim() === '已学习此单词本的所有单词') {
      setShowFullOptions(true);
    } else {
      setShowFullOptions(false);
      setButtonDisplay('重试');
    }
  }, [error]);

  const handleResetWordbook = () => {
    onRetry(); // This should reset the wordbook progress
  };

  const handleChangeWordbook = () => {
    onUpdateState({ currentComponent: 'A' }); // Switch to wordbook selection
  };

  return (
    <div className="error-status-message" role="alert">
      {errorMessage}
      
      {showFullOptions ? (
        <div className="error-button-group">
          <button 
            onClick={handleResetWordbook}
            className="error-retry-button"
          >
            重置单词本
          </button>
          <button 
            onClick={handleChangeWordbook}
            className="error-change-button"
          >
            更换单词本
          </button>
        </div>
      ) : (
        <button 
          onClick={onRetry}
          className="error-retry-button"
          onKeyDown={(e) => e.key === 'Enter' && onRetry()}
        >
          {buttonDisplay}
        </button>
      )}
    </div>
  );
}

ErrorDisplay.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(Error),
  ]),
  onRetry: PropTypes.func,
  updateState: PropTypes.func.isRequired,
};

export default ErrorDisplay;