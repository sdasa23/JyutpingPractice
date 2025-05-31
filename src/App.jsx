import { useState } from "react";
import Typing from "./components/Typing.jsx"
import "./App.css"
import ChooseBook from "./components/ChooseBook.jsx";
import StudyRecord from "./components/StudyRecord.jsx";
import Toolbar from "./components/Toolbar.jsx";

function App(){
  const [currentComponent, setCurrentComponent] = useState('Typing');
  const [selectedBookPath, setSelectedBookPath] = useState('/books/cantonese_phrases.json');

  const handleBookSelect = (path) => {
    setSelectedBookPath(path);
  };

  const renderComponent = () => {
    switch (currentComponent) {
      case 'A': return <ChooseBook onBookSelect={handleBookSelect} />;
      case 'B': return <StudyRecord />;
      case 'C': return <Toolbar />;
      default: return <Typing dataUrl= {selectedBookPath}/>;
    }
  };
  
  return (
    <div className="switch-page-container"> {/* 添加容器类名 */}
      <div className="button-group"> {/* 按钮组容器 */}
        <button 
          className={`switch-button ${currentComponent === 'Typing' ? 'active' : ''}`}
          onClick={() => setCurrentComponent('Typing')}
        >
          练习粤拼
        </button>
        <button 
          className={`switch-button ${currentComponent === 'A' ? 'active' : ''}`}
          onClick={() => setCurrentComponent('A')}
        >
          单词书
        </button>
        <button 
          className={`switch-button ${currentComponent === 'B' ? 'active' : ''}`}
          onClick={() => setCurrentComponent('B')}
        >
          学习记录
        </button>
        <button 
          className={`switch-button ${currentComponent === 'C' ? 'active' : ''}`}
          onClick={() => setCurrentComponent('C')}
        >
          工具栏
        </button>
      </div>
      
      <div className="component-container">
        {renderComponent()}
      </div>
    </div>
  )
}

export default App;