import './RightPanel.css';
import { ShieldCheck, X } from 'lucide-react';

const RightPanel = ({ onClose }) => {
  return (
    <div className="right-panel">
      {/* Dashboard Uy Tín */}
      <div className="right-panel__card">
        
        <div className="right-panel__card-header">
          <h2 className="right-panel__card-title">BẢNG ĐIỀU KHIỂN UY TÍN</h2>
          <div className="right-panel__card-actions">
            <span className="right-panel__badge">Cư dân Ưu tú</span>
            <button 
              onClick={onClose}
              className="right-panel__close-btn"
              title="Đóng bảng điều khiển"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="right-panel__score-section">
          <div className="right-panel__score-large">
            95<span className="right-panel__score-denominator">/100</span>
          </div>
          <p className="right-panel__score-subtitle">Điểm uy tín tổng thể 95/100</p>
          <p className="right-panel__score-desc">Nằm trong top 5% cư dân có chỉ số tin cậy và trách nhiệm cao nhất tại Vinhomes.</p>
        </div>

        <div className="right-panel__stats-list">
          <div className="right-panel__stat-item">
            <div className="right-panel__stat-header">
              <span className="right-panel__stat-label">Xác minh danh tính</span>
              <span className="right-panel__stat-value">100%</span>
            </div>
            <div className="right-panel__progress-bg"><div className="right-panel__progress-bar w-full"></div></div>
          </div>
          
          <div className="right-panel__stat-item">
            <div className="right-panel__stat-header">
              <span className="right-panel__stat-label">Danh tiếng cộng đồng</span>
              <span className="right-panel__stat-value">98%</span>
            </div>
            <div className="right-panel__progress-bg"><div className="right-panel__progress-bar w-[98%]"></div></div>
          </div>

          <div className="right-panel__stat-item">
            <div className="right-panel__stat-header">
              <span className="right-panel__stat-label">Xác minh chuyên môn</span>
              <span className="right-panel__stat-value">100%</span>
            </div>
            <div className="right-panel__progress-bg"><div className="right-panel__progress-bar w-full"></div></div>
          </div>
          
          <div className="right-panel__stat-item">
            <div className="right-panel__stat-header">
              <span className="right-panel__stat-label">Độ tin cậy phản hồi</span>
              <span className="right-panel__stat-value">92%</span>
            </div>
            <div className="right-panel__progress-bg"><div className="right-panel__progress-bar w-[92%]"></div></div>
          </div>
        </div>
      </div>

      {/* Tại sao phù hợp */}
      <div className="right-panel__card">
        <h3 className="right-panel__why-title">
          <ShieldCheck size={18} /> Tại sao phù hợp?
        </h3>
        <ul className="right-panel__why-list">
          <li className="right-panel__why-item"><div className="right-panel__why-icon">✓</div> Cùng khu vực cư dân (Central Park)</li>
          <li className="right-panel__why-item"><div className="right-panel__why-icon">✓</div> Chứng chỉ bơi lội đã xác minh</li>
          <li className="right-panel__why-item"><div className="right-panel__why-icon">✓</div> 124 đánh giá tích cực từ cộng đồng</li>
          <li className="right-panel__why-item"><div className="right-panel__why-icon">✓</div> Phản hồi nhanh (trung bình 15 phút)</li>
          <li className="right-panel__why-item"><div className="right-panel__why-icon">✓</div> Có lịch trống vào cuối tuần này</li>
        </ul>
      </div>

    </div>
  );
};
export default RightPanel;
