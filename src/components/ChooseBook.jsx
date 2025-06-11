import { useState, useEffect } from "react";
import "./ChooseBook.css";

function ChooseBook({ onBookSelect, appRecord }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/book_list.json") 
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch book list");
        }
        return response.json();
      })
      .then((data) => {
        setBooks(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const handleSelect = (bookPath) => {
    setSelectedBook(bookPath);
    if (onBookSelect) {
      onBookSelect(bookPath);
    }
  };

  // 获取书籍进度
  const getBookProgress = (bookPath) => {
    return appRecord?.bookProgressIndex?.[bookPath] || 0;
  };

  // 获取练习次数
  const getPracticeCount = (bookPath) => {
    return appRecord?.bookPracticeTime?.[bookPath] || 0;
  };

  // 计算进度百分比
  const getProgressPercentage = (book) => {
    const progress = getBookProgress(book.path);
    return book.words > 0 ? Math.min(Math.round((progress / book.words) * 100), 100) : 0;
  };

  if (isLoading) return <div className="loading-message">加载单词书列表中...</div>;
  if (error) return <div className="error-message">错误: {error}</div>;
  if (books.length === 0) return <div className="empty-message">没有可用的单词书</div>;

  return (
    <div className="book-selector">
      <h2 className="book-selector-title">选择单词书</h2>
      <div className="book-buttons-container">
        {books.map((book) => {
          const progress = getBookProgress(book.path);
          const practiceCount = getPracticeCount(book.path);
          const progressPercent = getProgressPercentage(book);
          const progressText = `${progress}/${book.words}`;
          
          return (
            <button
              key={book.path}
              className={`book-button ${selectedBook === book.path ? "selected" : ""}`}
              onClick={() => handleSelect(book.path)}
            >
              <div className="book-header">
                <span className="book-name">{book.name}</span>
                <span className="word-count">{book.words}词</span>
              </div>
              
              <div className="progress-display">
                <div className="progress-percent">{progressPercent}%</div>
                <div className="progress-details">
                  <span>进度: {progressText}</span>
                  <span>练习: {practiceCount}次</span>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChooseBook;