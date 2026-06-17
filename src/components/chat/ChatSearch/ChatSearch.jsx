import './ChatSearch.css';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const ChatSearch = ({ onSearch }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-search">
      <div className="chat-search__icon-wrapper">
        <Sparkles size={20} />
      </div>
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Mô tả người bạn cần tìm... (Ví dụ: Tôi cần huấn luyện viên bơi gần S2.03...)" 
        className="chat-search__input"
      />
      <button type="submit" className="chat-search__button">
        Tìm kiếm
      </button>
    </form>
  );
};

export default ChatSearch;

