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

  const handleSelect = (e) => {
    const selectedPath = e.target.value;
    setSelectedBook(selectedPath);
    if (onBookSelect) {
      onBookSelect(selectedPath);
    }
  };

  if (isLoading) return <div>加载单词书列表中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (books.length === 0) return <div>没有可用的单词书</div>;

  return (
    <div className="book-selector">
      <h2>选择单词书</h2>
      <select value={selectedBook} onChange={handleSelect}>
        <option value="">-- 请选择单词书 --</option>
        {books.map((book) => (
          <option key={book.path} value={book.path}>
            {book.name} ({book.words}词)
          </option>
        ))}
      </select>
    </div>
  );
}

export default ChooseBook;