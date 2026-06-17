import './ChatMessage.css';
import { Sparkles } from 'lucide-react';

const ChatMessage = ({ type, content }) => {
  const isUser = type === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--bot'}`}>
      {!isUser && (
        <div className="chat-message__bot-avatar">
          <div className="chat-message__bot-avatar-head"></div>
          <div className="chat-message__bot-avatar-body"></div>
        </div>
      )}
      
      <div className={`chat-message__bubble ${isUser ? 'chat-message__bubble--user' : 'chat-message__bubble--bot'}`}>
        {content}
      </div>

      {isUser && (
        <img 
          src="https://i.pravatar.cc/150?img=11" 
          alt="User" 
          className="chat-message__user-avatar"
        />
      )}
    </div>
  );
};

export default ChatMessage;

