import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ErrorDisplay({ error = '', onRetry = () => window.location.reload() }) {
  const [buttonDisplay, setButtonDisplay] = useState('重试');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    setErrorMessage(message);

    if (message.trim() === '已学习此单词本的所有单词') {
      setButtonDisplay('重置单词本');
    } else {
      setButtonDisplay('重试');
    }
  }, [error]);

  return (
    <div className="status-message error" role="alert">
      {errorMessage}
      <button 
        onClick={onRetry}
        className="retry-button"
        onKeyDown={(e) => e.key === 'Enter' && onRetry()}
      >
        {buttonDisplay}
      </button>
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
};

export default ErrorDisplay;