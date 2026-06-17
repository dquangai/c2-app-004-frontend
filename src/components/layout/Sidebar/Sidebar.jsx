import { NavLink } from 'react-router-dom';
import { Home, Sparkles, BookOpen, Users, LogOut, Calendar, Clock, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth/useAuth';
import logo from '../../../assets/v-logo.svg';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <img src={logo} alt="V-Connect Logo" className="sidebar-logo-img" />
      </div>

      <div className="sidebar-nav-container">
        <nav className="sidebar-nav-list">
          <NavLink to="/" end className={({isActive}) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/ai-assistant" className={({isActive}) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={18} />
            <span>AI Assistant</span>
          </NavLink>
          <NavLink to="/directory" className={({isActive}) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Community Directory</span>
          </NavLink>
          <NavLink to="/groups" className={({isActive}) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Community Groups</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-premium-card">
          <div className="sidebar-premium-title">Premium member</div>
          <div className="sidebar-premium-desc">Get priority bookings & AI insights.</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
