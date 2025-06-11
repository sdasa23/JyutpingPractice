import { useState, useEffect } from "react";
import "./ChooseBook.css";

function ChooseBook({ onBookSelect }) {
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

  if (isLoading) return <div>加载单词书列表中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (books.length === 0) return <div>没有可用的单词书</div>;

  return (
    <div className="book-selector">
      <h2>选择单词书</h2>
      <div className="book-buttons-container">
        {books.map((book) => (
          <button
            key={book.path}
            className={`book-button ${selectedBook === book.path ? "selected" : ""}`}
            onClick={() => handleSelect(book.path)}
          >
            <span className="book-name">{book.name}</span>
            <span className="word-count">({book.words}词)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChooseBook;