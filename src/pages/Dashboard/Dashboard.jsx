import './Dashboard.css';
import { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import RightPanel from '../../components/layout/RightPanel';
import Footer from '../../components/layout/Footer';
import ChatSearch from '../../components/chat/ChatSearch';
import ChatMessage from '../../components/chat/ChatMessage';
import ProfileList from '../../components/profile/ProfileList';

const Dashboard = () => {
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'user',
      content: 'Tôi cần huấn luyện viên bơi gần S2.03 cho người mới bắt đầu.'
    },
    {
      id: 2,
      type: 'ai',
      content: (
        <div className="text-gray-700">
          <h4 className="font-bold mb-2 text-gray-900">Công cụ kết nối V-Connect</h4>
          <p className="leading-relaxed">Tôi đã tìm thấy 3 huấn luyện viên bơi đã được xác minh gần bạn (khu vực S2.03) có lịch trống vào cuối tuần này. Tất cả các ứng viên đều đã qua kiểm tra danh tính và bằng cấp chuyên môn.</p>
        </div>
      ),
      showProfiles: true
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const mainScrollRef = useRef(null);
  const isInitialRender = useRef(true);

  // Determine if search has been completed
  const hasSearched = chatHistory.some(msg => msg.showProfiles);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
      return;
    }
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const handleSearch = (text) => {
    if (!text.trim()) return;
    
    // Add User message
    const newUserMsg = { id: Date.now(), type: 'user', content: text };
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const newAiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Đang tìm kiếm thông tin cho yêu cầu: "${text}"... Hiện tại tôi đang chạy ở chế độ Demo nên sẽ chỉ hiển thị lại danh sách chuyên gia mẫu.`,
        showProfiles: true
      };
      setChatHistory(prev => [...prev, newAiMsg]);
    }, 1500);
  };

  const handleSelectProfile = (id) => {
    setSelectedProfileId(id);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="dashboard__main">
        <Header />
        
        <div className="dashboard__content">
          {/* Center Main Content: Chat */}
          <div className="dashboard__chat-area">
            <main 
              ref={mainScrollRef} 
              className="dashboard__chat-scroll"
            >
              <div className={`dashboard__chat-container ${hasSearched ? 'dashboard__chat-container--with-sidebar' : 'dashboard__chat-container--centered'}`}>
                <div className="dashboard__message-list">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className="dashboard__message-group">
                      <ChatMessage type={msg.type} content={msg.content} />
                      {/* ProfileList has been moved to the right column */}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="dashboard__typing-indicator">
                      <div className="dashboard__typing-avatar"></div>
                      <div className="dashboard__typing-bubble">
                        AI đang gõ...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </main>
            
            {/* Chat Input Container at the bottom */}
            <div className="dashboard__input-area">
              <div className={`dashboard__input-container ${hasSearched ? 'dashboard__input-container--with-sidebar' : 'dashboard__input-container--centered'}`}>
                <ChatSearch onSearch={handleSearch} />
              </div>
            </div>
          </div>
          
          {/* Recommendations Column */}
          {hasSearched && (
            <aside className="dashboard__recommendations">
              <ProfileList onSelectProfile={handleSelectProfile} />
            </aside>
          )}

          {/* RightPanel (Uy tín & Danh tiếng) - Chỉ hiện khi có profile được chọn */}
          {selectedProfileId && (
            <div className="dashboard__right-panel-wrapper">
              <RightPanel onClose={() => setSelectedProfileId(null)} />
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
