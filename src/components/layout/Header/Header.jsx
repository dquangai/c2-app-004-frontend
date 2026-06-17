import { Bell, Settings, LogOut, Clock, Calendar as CalendarIcon, MessageSquare, Check, X, Search, Menu, ShieldCheck, BadgeCheck, ExternalLink, Briefcase } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth/useAuth';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import logo from '../../../assets/v-logo.svg';
import './Header.css';

import { fetchPendingBookingRequests, acceptBooking, rejectBooking, formatRelativeTime, ensureDemoConversations, fetchBookedThreads } from '../../../services/messageService';
import { getSampleNotificationSets } from '../../../data/sampleNotifications';
import { getResidentById } from '../../../services/residentService';
import { avatarFor, memberToProfile, onAvatarError } from '../../../utils/memberMapper';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { getDisplayName } from '../../../utils/userDisplay';
import ProfileDrawer from '../../profile/ProfileDrawer/ProfileDrawer';
import { translate } from '../../../i18n/translate';

const Header = () => {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [memberProfile, setMemberProfile] = useState(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const [bookedNotifications, setBookedNotifications] = useState([]);
  const [bookedMeNotifications, setBookedMeNotifications] = useState([]);
  const [notifTab, setNotifTab] = useState('booked');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  const searchPlaceholders = useMemo(() => {
    const list = translate(locale, 'header.searchPlaceholders');
    return Array.isArray(list) ? list : [];
  }, [locale]);

  const totalNotifCount = bookedNotifications.length + bookedMeNotifications.length;
  const visibleNotifications = notifTab === 'booked' ? bookedNotifications : bookedMeNotifications;

  const isMember = user?.role === 'member' && Boolean(user?.member_id);
  const displayName = isMember && memberProfile?.name ? memberProfile.name : getDisplayName(user);
  const accountAvatar = resolveMediaUrl(user?.avatar_url);
  const publicAvatar = accountAvatar || memberProfile?.avatar || null;
  const avatarSrc = publicAvatar || avatarFor(displayName, user?.id);

  useEffect(() => {
    if (!user?.member_id) {
      setMemberProfile(null);
      return undefined;
    }
    let cancelled = false;
    getResidentById(user.member_id)
      .then((profile) => {
        if (!cancelled) setMemberProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setMemberProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.member_id, user?.avatar_url]);

  useEffect(() => {
    if (!user) {
      setBookedNotifications([]);
      setBookedMeNotifications([]);
      return;
    }

    const mapBookingRequest = (req, idx) => ({
      id: req.thread_id,
      type: 'booking',
      name: req.requester_name || translate(locale, 'header.notifications.resident'),
      time: formatRelativeTime(req.updated_at, locale),
      text: req.booking_note
        ? translate(locale, 'header.notifications.bookingRequested', { note: req.booking_note })
        : translate(locale, 'header.notifications.bookingRequest'),
      avatar: `https://i.pravatar.cc/150?img=${(idx % 70) + 1}`,
    });

    const mapBookedThread = (thread, idx) => {
      const name = thread.member_name || translate(locale, 'header.notifications.member');
      const note = thread.booking_note ? `: "${thread.booking_note}"` : '';
      let text = translate(locale, 'header.notifications.statusUpdated');
      if (thread.booking_status === 'accepted') {
        text = translate(locale, 'header.notifications.acceptedBooking', { note });
      } else if (thread.booking_status === 'cancelled') {
        text = translate(locale, 'header.notifications.declinedBooking', { note });
      } else if (thread.booking_status === 'pending') {
        text = translate(locale, 'header.notifications.awaitingBooking', { note });
      }
      return {
        id: thread.id,
        type: thread.booking_status === 'pending' ? 'pending' : 'status',
        name,
        time: formatRelativeTime(thread.updated_at, locale),
        text,
        avatar: `https://i.pravatar.cc/150?img=${(idx % 70) + 5}`,
      };
    };

    const loadNotifs = async () => {
      try {
        await ensureDemoConversations(user.id);

        let booked = [];
        const threads = await fetchBookedThreads({ force: true }).catch(() => []);
        booked = (threads || [])
          .filter((t) => t.booking_status)
          .map(mapBookedThread);

        let bookedMe = [];
        if (user.role === 'member' || user.role === 'admin') {
          let pending = await fetchPendingBookingRequests({ force: true }).catch(() => []);
          if (!pending?.length) {
            pending = await fetchPendingBookingRequests({ demo: true, force: true }).catch(() => []);
          }
          bookedMe = Array.isArray(pending) ? pending.map(mapBookingRequest) : [];
        }

        if (!booked.length && !bookedMe.length) {
          const samples = getSampleNotificationSets(user.role);
          booked = samples.booked;
          bookedMe = samples.bookedMe;
        } else {
          if (!booked.length) {
            booked = getSampleNotificationSets(user.role).booked;
          }
          if (!bookedMe.length && (user.role === 'member' || user.role === 'admin')) {
            bookedMe = getSampleNotificationSets(user.role).bookedMe;
          }
        }

        setBookedNotifications(booked);
        setBookedMeNotifications(bookedMe);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        const samples = getSampleNotificationSets(user.role);
        setBookedNotifications(samples.booked);
        setBookedMeNotifications(samples.bookedMe);
      }
    };

    loadNotifs();
  }, [user, isNotifOpen, locale]);

  const handleAcceptBooking = async (threadId) => {
    const notif = bookedMeNotifications.find((n) => n.id === threadId);
    if (notif?.sample) return;
    try {
      await acceptBooking(threadId);
      setBookedMeNotifications((prev) => prev.filter((n) => n.id !== threadId));
    } catch (err) {
      console.error('Accept booking failed:', err);
    }
  };

  const handleRejectBooking = async (threadId) => {
    const notif = bookedMeNotifications.find((n) => n.id === threadId);
    if (notif?.sample) return;
    try {
      await rejectBooking(threadId);
      setBookedMeNotifications((prev) => prev.filter((n) => n.id !== threadId));
    } catch (err) {
      console.error('Reject booking failed:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  const handleSelectLocale = (nextLocale) => {
    setLocale(nextLocale);
    setIsLangOpen(false);
  };

  const greetingName = displayName.split(' ').pop() || t('header.guestFallback');
  const activeFlag = locale === 'en' ? '/eng-active.svg' : '/vie-active.svg';
  const activeLangLabel = locale === 'en' ? t('header.lang.en') : t('header.lang.vi');

  const handleDropdownItemClick = (path) => {
    setIsDropdownOpen(false);
    if (path === 'logout') {
      logout();
    } else {
      navigate(path);
    }
  };

  const openMemberProfile = () => {
    setIsDropdownOpen(false);
    setIsProfileDrawerOpen(true);
  };

  return (
    <header className={`header-container ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-left">
        <button 
          className="header-mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="header-brand" aria-label={t('header.brandHome')}>
          <img src={logo} alt="V-Connect" className="header-brand-logo" />
        </Link>
      </div>

      <div className="header-center">
        <nav className="header-nav">
          <NavLink to="/" end className={({isActive}) => `header-nav-link ${isActive ? 'active' : ''}`}>
            {t('header.nav.home')}
          </NavLink>
          <NavLink to="/ai-assistant" className={({isActive}) => `header-nav-link header-nav-ai ${isActive ? 'active' : ''}`}>
            {t('header.nav.aiAssistant')}
          </NavLink>
          <NavLink to="/directory" className={({isActive}) => `header-nav-link ${isActive ? 'active' : ''}`}>
            {t('header.nav.neighbors')}
          </NavLink>
          <NavLink to="/groups" className={({isActive}) => `header-nav-link ${isActive ? 'active' : ''}`}>
            {t('header.nav.groups')}
          </NavLink>
          <NavLink to="/social" className={({isActive}) => `header-nav-link ${isActive ? 'active' : ''}`}>
            {t('header.nav.social')}
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        <div className="header-actions">
          {user ? (
            <>
              <button 
                className={`header-icon-btn ${location.pathname === '/chat' ? 'header-icon-btn--active' : ''}`}
                onClick={() => navigate('/chat')}
              >
                <MessageSquare size={26} />
              </button>
              <div className="header-notif-menu" ref={notifRef}>
                <button 
                  className="header-icon-btn"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Bell size={26} />
                  {totalNotifCount > 0 && <span className="header-icon-badge">{totalNotifCount}</span>}
                </button>
                
                {isNotifOpen && (
                  <div className="header-notif-dropdown">
                    <div className="header-notif-header">
                      <p className="header-notif-title">{t('header.notifications.title')}</p>
                      <p className="header-notif-subtitle">
                        {t(
                          totalNotifCount === 1
                            ? 'header.notifications.subtitleOne'
                            : 'header.notifications.subtitle',
                          { count: totalNotifCount }
                        )}
                      </p>
                    </div>
                    <div className="header-notif-tabs" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={notifTab === 'booked'}
                        className={`header-notif-tab${notifTab === 'booked' ? ' header-notif-tab--active' : ''}`}
                        onClick={() => setNotifTab('booked')}
                      >
                        {t('header.notifications.tabBooked')}
                        {bookedNotifications.length > 0 && (
                          <span className="header-notif-tab__count">{bookedNotifications.length}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={notifTab === 'booked_me'}
                        className={`header-notif-tab${notifTab === 'booked_me' ? ' header-notif-tab--active' : ''}`}
                        onClick={() => setNotifTab('booked_me')}
                      >
                        {t('header.notifications.tabBookedMe')}
                        {bookedMeNotifications.length > 0 && (
                          <span className="header-notif-tab__count">{bookedMeNotifications.length}</span>
                        )}
                      </button>
                    </div>
                    <div className="header-notif-body" key={notifTab}>
                      {visibleNotifications.length === 0 ? (
                        <p className="header-notif-empty">
                          {notifTab === 'booked'
                            ? t('header.notifications.emptyBooked')
                            : t('header.notifications.emptyBookedMe')}
                        </p>
                      ) : (
                        visibleNotifications.map((notif) => (
                        <div key={notif.id} className="header-notif-item">
                          <img src={notif.avatar} alt={notif.name} className="header-notif-avatar" />
                          <div className="header-notif-content">
                            <div className="header-notif-item-header">
                              <span className="header-notif-name">{notif.name}</span>
                              <span className="header-notif-time">{notif.time}</span>
                            </div>
                            <p className="header-notif-text">{notif.text}</p>
                            {notifTab === 'booked_me' && notif.type === 'booking' && !notif.sample && (
                              <div className="header-notif-actions">
                                <button 
                                  className="header-notif-btn header-notif-btn-accept"
                                  onClick={() => handleAcceptBooking(notif.id)}
                                >
                                  <Check size={14} /> {t('header.notifications.accept')}
                                </button>
                                <button 
                                  className="header-notif-btn header-notif-btn-cancel"
                                  onClick={() => handleRejectBooking(notif.id)}
                                >
                                  <X size={14} /> {t('header.notifications.decline')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )))}
                    </div>
                    <div className="header-notif-footer">
                      <button
                        type="button"
                        className="header-notif-see-all"
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/chat', { state: { tab: notifTab } });
                        }}
                      >
                        {t('header.notifications.viewAll')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="header-user-menu" ref={dropdownRef}>
                <button 
                  className="header-user-btn"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setIsNotifOpen(false);
                  }}
                >
                  <img 
                    src={avatarSrc}
                    alt="Avatar" 
                    className={`header-user-avatar${isMember ? ' header-user-avatar--member' : ''}`}
                    onError={(e) => onAvatarError(e, displayName, user?.id)}
                  />
                  <span className="header-user-name">{t('header.greeting', { name: greetingName })}</span>
                </button>
                
                {isDropdownOpen && (
                  <div className={`header-dropdown-menu${isMember ? ' header-dropdown-menu--member' : ''}`}>
                    {isMember && memberProfile ? (
                      <button type="button" className="header-dropdown-member" onClick={openMemberProfile}>
                        <img
                          src={publicAvatar || memberProfile.avatar}
                          alt={memberProfile.name}
                          className="header-dropdown-member-avatar"
                          onError={(e) => onAvatarError(e, memberProfile.name, memberProfile.id)}
                        />
                        <div className="header-dropdown-member-info">
                          <p className="header-dropdown-name">{memberProfile.name}</p>
                          <p className="header-dropdown-subtitle">{memberProfile.title}</p>
                          {memberProfile.area && (
                            <p className="header-dropdown-meta">{memberProfile.area}</p>
                          )}
                          {memberProfile.verified && (
                            <span className="header-dropdown-badge">
                              <BadgeCheck size={12} /> {t('header.userMenu.verified')}
                            </span>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="header-dropdown-header">
                        <p className="header-dropdown-name">{displayName || t('header.guestFallback')}</p>
                        <p className="header-dropdown-subtitle">{t('header.userMenu.community')}</p>
                      </div>
                    )}
              <div className="header-dropdown-body">
                {user?.role === 'admin' && (
                  <button onClick={() => handleDropdownItemClick('/admin/overview')} className="header-dropdown-item" style={{ color: '#ef4444' }}>
                    <ShieldCheck size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.adminDashboard')}
                  </button>
                )}
                {isMember && (
                  <button onClick={openMemberProfile} className="header-dropdown-item">
                    <ExternalLink size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.publicProfile')}
                  </button>
                )}
                {user?.role === 'user' && (
                  <button onClick={() => handleDropdownItemClick('/become-provider')} className="header-dropdown-item">
                    <Briefcase size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.becomeProvider')}
                  </button>
                )}
                <button onClick={() => handleDropdownItemClick('/settings')} className="header-dropdown-item">
                  <Settings size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.settings')}
                </button>
                <button onClick={() => handleDropdownItemClick('/history')} className="header-dropdown-item">
                  <Clock size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.history')}
                </button>
                <button onClick={() => handleDropdownItemClick('/calendar')} className="header-dropdown-item">
                  <CalendarIcon size={16} className="header-dropdown-item-icon" /> {t('header.userMenu.calendar')}
                </button>
              </div>
              <div className="header-dropdown-footer">
                <button onClick={() => handleDropdownItemClick('logout')} className="header-dropdown-logout">
                  <LogOut size={16} /> {t('header.userMenu.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    ) : (
      <div className="header-guest-actions">
        <button 
          className="header-btn-login"
          onClick={() => navigate('/login')}
        >
          {t('header.login')}
        </button>
        <button 
          className="header-btn-register"
          onClick={() => navigate('/signup')}
        >
          {t('header.register')}
        </button>
      </div>
    )}
      </div>
</div>

      <div className="header-lang" ref={langRef}>
        <button
          type="button"
          className="header-lang-btn"
          aria-label={t('header.lang.choose')}
          title={activeLangLabel}
          aria-expanded={isLangOpen}
          onClick={() => {
            setIsLangOpen((open) => !open);
            setIsDropdownOpen(false);
            setIsNotifOpen(false);
          }}
        >
          <img src={activeFlag} alt="" className="header-lang-flag" aria-hidden="true" />
        </button>
        {isLangOpen && (
          <div className="header-lang-dropdown" role="menu">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={locale === 'vi'}
              className={`header-lang-option${locale === 'vi' ? ' header-lang-option--active' : ''}`}
              onClick={() => handleSelectLocale('vi')}
            >
              <img src="/vie-active.svg" alt="" className="header-lang-option__flag" aria-hidden="true" />
              <span>{t('header.lang.vi')}</span>
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={locale === 'en'}
              className={`header-lang-option${locale === 'en' ? ' header-lang-option--active' : ''}`}
              onClick={() => handleSelectLocale('en')}
            >
              <img src="/eng-active.svg" alt="" className="header-lang-option__flag" aria-hidden="true" />
              <span>{t('header.lang.en')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="header-mobile-menu">
          <div className="header-mobile-search">
            <Search className="header-mobile-search-icon" size={16} />
            <input 
              type="text" 
              placeholder={t('header.searchMobile')}
              className="header-mobile-search-input"
            />
          </div>
          <nav className="header-mobile-nav">
            <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `header-mobile-nav-link ${isActive ? 'active' : ''}`}>
              {t('header.mobileNav.home')}
            </NavLink>
            <NavLink to="/ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `header-mobile-nav-link ${isActive ? 'active' : ''}`}>
              {t('header.mobileNav.aiAssistant')}
            </NavLink>
            <NavLink to="/directory" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `header-mobile-nav-link ${isActive ? 'active' : ''}`}>
              {t('header.mobileNav.neighbors')}
            </NavLink>
            <NavLink to="/groups" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `header-mobile-nav-link ${isActive ? 'active' : ''}`}>
              {t('header.mobileNav.groups')}
            </NavLink>
            <NavLink to="/social" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `header-mobile-nav-link ${isActive ? 'active' : ''}`}>
              {t('header.mobileNav.social')}
            </NavLink>
          </nav>
        </div>
      )}

      {isMember && user?.member_id && (
        <ProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          profileId={user.member_id}
          profile={memberProfile ? memberToProfile(memberProfile) : undefined}
        />
      )}
    </header>
  );
};

export default Header;
