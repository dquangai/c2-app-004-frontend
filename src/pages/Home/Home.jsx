import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Search, MapPin, ChevronRight, ChevronLeft, ShieldCheck, Star, Users, Heart, Package, ZoomIn, ZoomOut, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../../components/booking/BookingModal/BookingModal';
import ProfileDrawer from '../../components/profile/ProfileDrawer/ProfileDrawer';
import HomeMapBackground from '../../components/map/HomeMapBackground';
import { getHonorTopOneResidents } from '../../services/residentService';
import { fetchPosts, fetchGroups } from '../../services/catalogService';
import { memberToProfile, onAvatarError } from '../../utils/memberMapper';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { localizeGroup, localizePost } from '../../i18n/catalogContent';
import { useLocalizedDirectoryNeeds } from '../../hooks/useLocalizedDirectory';
import { needSectionId } from '../../config/directoryNeedCategories';
import mainLogo from '../../assets/main-logo.svg';
import banner1 from '../../assets/banner-1.webp';
import banner2 from '../../assets/banner-2.webp';
import banner3 from '../../assets/banner-3.webp';
import './Home.css';

const BANNER_PATHS = ['/directory', '/ai-assistant', '/groups'];
const BANNER_IMAGES = [banner1, banner2, banner3];
const BANNER_REVERSES = [false, true, false];

const communityGroups = [
  { id: 1, name: 'Cư dân Vinhomes Smart City', icon: Users, desc: 'Nơi kết nối, chia sẻ thông tin và hỗ trợ lẫn nhau của toàn thể cư dân.' },
  { id: 2, name: 'Phụ huynh VSC', icon: Users, desc: 'Cộng đồng chia sẻ kinh nghiệm nuôi dạy con và các hoạt động vui chơi.' },
  { id: 3, name: 'Chia sẻ đồ dùng VSC', icon: Package, desc: 'Góc thanh lý, trao đổi đồ dùng còn tốt giữa các gia đình trong khu.' },
  { id: 4, name: 'Thể thao & Sức khỏe', icon: Heart, desc: 'Giao lưu các môn thể thao như chạy bộ, tennis, bơi lội và yoga.' },
];

const trendingPosts = [
  { id: 1, type: 'THÔNG BÁO BQL', title: 'Lịch bảo trì hệ thống nước sạch định kỳ toàn khu', date: '2 giờ trước', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250' },
  { id: 2, type: 'KHUYẾN MÃI', title: 'Giảm 20% phí giặt sofa, thảm, rèm cửa tuần này', date: '5 giờ trước', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250' },
  { id: 3, type: 'SỰ KIỆN', title: 'Workshop: Hướng dẫn an toàn PCCC cho cư dân', date: 'Hôm qua', image: 'https://images.unsplash.com/photo-1542314831-c6a42f40e696?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 4, type: 'MẸO HAY', title: '5 cách bảo vệ sức khỏe hô hấp khi giao mùa', date: '2 ngày trước', image: 'https://images.unsplash.com/photo-1664448007567-9d7a2f4fc911?auto=format&fit=crop&q=80&w=400&h=250' },
];

const userAvatars = [
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=9"
];
const userNames = ["Hải Yến", "Tuấn Anh", "Minh Tú", "Hoàng Nam"];

const Home = () => {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const directoryNeeds = useLocalizedDirectoryNeeds();

  const honorGroupLabels = useMemo(
    () => Object.fromEntries(
      directoryNeeds.map((need) => [need.id, need.rankGroupLabel || need.label]),
    ),
    [directoryNeeds],
  );

  const introBanners = useMemo(() => {
    const items = t('home.banners');
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => ({
      id: index + 1,
      title: item.title,
      desc: item.desc,
      cta: item.cta,
      path: BANNER_PATHS[index],
      image: BANNER_IMAGES[index],
      reverse: BANNER_REVERSES[index],
    }));
  }, [t]);

  const aiDemoSlides = useMemo(() => {
    const slides = t('home.aiDemo.slides');
    return Array.isArray(slides) ? slides : [];
  }, [t]);

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [apiPosts, setApiPosts] = useState(trendingPosts);
  const [apiGroups, setApiGroups] = useState(communityGroups);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const [mapZoom, setMapZoom] = useState(1);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!introBanners.length) return undefined;
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % introBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [introBanners.length]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getHonorTopOneResidents(4).catch(() => ({ members: [], period: null })),
      fetchPosts().catch(() => []),
      fetchGroups().catch(() => [])
    ]).then(([honorData, postsData, groupsData]) => {
      setFeaturedMembers(honorData?.members || []);
      
      if (postsData && Array.isArray(postsData) && postsData.length > 0) {
        setApiPosts(postsData.slice(0, 4).map((p, i) => {
          const localized = localizePost(p, locale);
          return {
            id: localized.id,
            type: t('home.news.postType'),
            title: localized.title || localized.summary || t('home.news.recent'),
            date: t('home.news.recent'),
            image: trendingPosts[i % trendingPosts.length].image,
          };
        }));
      }
      
      if (groupsData && Array.isArray(groupsData) && groupsData.length > 0) {
        setApiGroups(groupsData.slice(0, 4).map((g, i) => {
          const localized = localizeGroup(g, locale);
          return {
            id: localized.id,
            name: localized.name,
            icon: communityGroups[i % communityGroups.length].icon,
            desc: localized.description || localized.summary || t('home.groups.fallback'),
          };
        }));
      }
    }).finally(() => setIsLoading(false));
  }, [t, locale]);

  useEffect(() => {
    if (!aiDemoSlides.length) return undefined;
    const timer = setInterval(() => {
      setVisibleIndex(prev => (prev + 1) % aiDemoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [aiDemoSlides.length]);

  const handleZoomIn = () => setMapZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setMapZoom((prev) => Math.max(prev - 0.3, 1));

  const mapPinsData = [
    { id: 1, type: 'center', label: 'Vinhomes Smart City', isMain: true },
    { id: 2, type: 'left', label: 'Vinhomes Ocean Park 1', isMain: false },
    { id: 3, type: 'right', label: 'Vinhomes Ocean Park 2', isMain: false },
    { id: 4, type: 'top-left', label: 'The Sapphire 1', isMain: false },
    { id: 5, type: 'top-right', label: 'The Sakura', isMain: false },
    { id: 6, type: 'bottom-center', label: 'The Miami', isMain: false },
  ];

  const handleAskAI = () => {
    navigate('/ai-assistant', { state: { query: searchQuery } });
  };

  const handleBooking = (member) => {
    setSelectedProvider({
      name: member.name,
      title: member.title,
      rating: member.rating,
      reviews: member.reviews,
      area: member.area,
      avatar: member.avatar,
      responseTime: member.availableNow ? member.responseTime : '~2 hrs',
    });
    setIsBookingModalOpen(true);
  };

  const handleViewProfile = (member) => {
    setSelectedProfileId(member.id || 1);
  };

  const activeSlide = aiDemoSlides[visibleIndex % aiDemoSlides.length] || { user: '', ai: '' };

  return (
    <div className="home-container">
      <section className="home-hero" aria-label={t('home.hero.brand')}>
        <p className="home-hero-watermark" aria-hidden="true">
          {t('home.hero.watermark')}
        </p>
        <div className="home-hero-panel">
          <div className="home-hero-brand">
            <img src="/main-logo.svg" alt="" className="home-hero-mark" aria-hidden="true" />
            <h1 className="home-hero-title">{t('home.hero.brand')}</h1>
          </div>
          <div className="home-hero-divider" aria-hidden="true" />
          <p className="home-hero-desc">{t('home.hero.description')}</p>
        </div>
      </section>

      <div className="home-split-section">
        <div className="home-split-left">
          <div className="home-search-wrapper">
            <input
              type="text"
              className="home-search-input"
              placeholder={t('home.hero.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            />
            <button 
              onClick={handleAskAI}
              className="home-search-btn"
            >
              <Search size={18} />
            </button>
          </div>

          <div className="home-category-tags">
            {directoryNeeds.map((need) => {
              const Icon = need.icon;
              const target = need.href || `/directory#${needSectionId(need.id)}`;
              return (
                <button
                  key={need.id}
                  type="button"
                  className="home-tag-btn"
                  onClick={() => navigate(target)}
                >
                  <Icon size={16} className="home-tag-icon" /> {need.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h3 className="home-section-title" style={{ textAlign: 'center' }}>{t('home.aiDemo.title')}</h3>
            <p className="home-section-subtitle">{t('home.aiDemo.subtitle')}</p>
            <div className="home-ai-box">
              <div className="home-ai-feed" style={{ position: 'relative' }}>
                <div key={visibleIndex} className="home-live-group">
                  <div className="home-live-comment user-msg">
                    <img src={userAvatars[visibleIndex % userAvatars.length]} alt="avatar" className="home-live-avatar" />
                    <div className="home-live-content">
                      <span 
                        className="home-live-name" 
                        onClick={() => setSelectedProfileId((visibleIndex % userNames.length) + 1)}
                        style={{ cursor: 'pointer' }}
                      >
                        {userNames[visibleIndex % userNames.length]}:
                      </span>
                      <span className="home-live-text"> {activeSlide.user}</span>
                    </div>
                  </div>
                  
                  <div className="home-live-comment ai-msg">
                    <div className="home-live-avatar ai-avatar">
                      <img src={mainLogo} alt="AI" style={{ width: '80%', height: '80%', objectFit: 'contain', display: 'block', margin: 'auto' }} />
                    </div>
                    <div className="home-live-content">
                      <span className="home-live-name ai">
                        {t('home.aiDemo.aiName')}:
                      </span>
                      <span className="home-live-text"> {activeSlide.ai}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="home-ai-btn-wrapper">
                <button 
                  onClick={handleAskAI}
                  className="home-ai-action-btn"
                >
                  <Sparkles size={16} /> {t('home.aiDemo.chatNow')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="home-split-right">
          <h3 className="home-section-title">{t('home.map.title')}</h3>
          <p className="home-section-subtitle">{t('home.map.subtitle')}</p>

          <div className="home-map-container">
            <div className="home-map-zoomable" style={{ transform: `scale(${mapZoom})` }}>
              <HomeMapBackground className="home-map-tiles" />

              {mapPinsData.map((pin) => (
                <div key={pin.id} className={`home-map-pin ${pin.type}`}>
                  <div className={`home-map-pin-label ${!pin.isMain ? 'small' : ''}`}>{pin.label}</div>
                  <div className={pin.isMain ? 'home-map-pin-icon-main' : 'home-map-pin-icon-small'}>
                    <MapPin
                      size={pin.isMain ? 20 : 16}
                      fill={pin.isMain ? '#3d5f8f' : 'white'}
                      stroke={pin.isMain ? 'white' : 'currentColor'}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="home-map-zoom-controls">
              <button type="button" className="home-map-zoom-btn" onClick={handleZoomIn} aria-label={t('home.map.zoomIn')}>
                <ZoomIn size={16} />
              </button>
              <button type="button" className="home-map-zoom-btn" onClick={handleZoomOut} aria-label={t('home.map.zoomOut')}>
                <ZoomOut size={16} />
              </button>
            </div>

            <button type="button" className="home-map-view-all-btn">
              {t('home.map.viewAll')} <MapPin size={12} color="#3d5f8f" />
            </button>
          </div>
        </div>
      </div>

      {introBanners.length > 0 && (
        <div className="home-section px-4 lg:px-0">
          <div className="relative w-full overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-gray-100 group">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {introBanners.map((banner) => (
                <div 
                  key={banner.id} 
                  className={`w-full flex-shrink-0 flex flex-col ${banner.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12 p-6 md:p-10`}
                >
                  <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-sm h-64 md:h-[360px] flex-shrink-0 relative">
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col gap-4 text-left">
                    <h3 className="text-2xl md:text-[28px] leading-tight font-bold bg-gradient-to-br from-[#3d5f8f] to-[#d4a827] bg-clip-text text-transparent uppercase tracking-wide">
                      {banner.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg font-medium">
                      {banner.desc}
                    </p>
                    <div className="mt-4">
                      <button onClick={() => navigate(banner.path)} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#3d5f8f] to-[#5a7fb5] text-white px-7 py-3.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        {banner.cta} <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setCurrentBannerIndex(prev => (prev - 1 + introBanners.length) % introBanners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentBannerIndex(prev => (prev + 1) % introBanners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {introBanners.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'w-8 bg-[#d4a827]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="home-section">
        <div className="home-section-header">
          <div>
            <h2>{t('home.members.title')}</h2>
            <p>{t('home.members.subtitle')}</p>
          </div>
          <button
            onClick={() => navigate('/directory')}
            className="home-view-all-link"
          >
            {t('home.members.viewAll')} <ChevronRight size={16} />
          </button>
        </div>

        <div className="home-slider-wrapper">
          <button className="home-slider-nav-btn left">
            <ChevronLeft size={16} />
          </button>
          
          <div className="home-grid-4">
            {isLoading ? (
              [1, 2, 3, 4].map(idx => (
                <div key={idx} className="home-member-card skeleton-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-text skeleton-title"></div>
                  <div className="skeleton-text skeleton-subtitle"></div>
                  <div className="skeleton-text skeleton-small"></div>
                  <div className="skeleton-actions">
                    <div className="skeleton-btn"></div>
                    <div className="skeleton-btn"></div>
                  </div>
                </div>
              ))
            ) : featuredMembers.length === 0 ? (
              <div className="home-members-empty">{t('home.members.empty')}</div>
            ) : (
              featuredMembers.map(member => (
                <div key={member.id} className="home-member-card">
                  {member.honorNeedId && (
                    <div className="home-member-honor-badge">
                      <Trophy size={12} />
                      <span>{t('home.members.topBadge')}</span>
                      <span className="home-member-honor-group">
                        {honorGroupLabels[member.honorNeedId]}
                      </span>
                    </div>
                  )}
                  <div className="home-member-avatar-wrapper">
                    <div className="home-member-avatar-inner">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="home-member-avatar"
                        onError={(e) => onAvatarError(e, member.name, member.id)}
                      />
                      <div 
                        className="home-member-status-dot"
                        style={{ backgroundColor: member.availableNow ? '#22c55e' : '#f97316' }}
                      ></div>
                    </div>
                  </div>
                  
                  <h3 className="home-member-name">
                    {member.name} {member.verified && <ShieldCheck size={14} color="#b8890f" />}
                  </h3>
                  <p className="home-member-title">{member.title}</p>
                  
                  <div className="home-member-rating">
                    <Star size={12} fill="#ffffff" color="#ffffff" />
                    <span>{member.rating}</span>
                    <span className="home-member-reviews">({member.reviews} {t('home.members.reviews')})</span>
                    {member.honorScore != null && (
                      <span className="home-member-honor-score">
                        {Math.round(member.honorScore)} {t('home.members.honorPoints')}
                      </span>
                    )}
                  </div>
                  
                  <div className="home-member-area">
                    {member.area} <span style={{ margin: '0 4px' }}>•</span> 
                    <span className="home-member-status-text" style={{ color: member.availableNow ? '#22c55e' : '#f97316' }}>
                      {member.availableNow ? t('home.members.available') : t('home.members.book')}
                    </span>
                  </div>
                  
                  <div className="home-member-actions">
                    <button 
                      onClick={() => handleViewProfile(member)}
                      className="home-btn-outline"
                    >
                      {t('home.members.viewProfile')}
                    </button>
                    <button 
                      onClick={() => handleBooking(member)}
                      className="home-btn-primary"
                    >
                      {t('home.members.contact')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="home-slider-nav-btn right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="home-section home-features-section">
        <div className="home-section-header">
          <h2>{t('home.groups.title')}</h2>
          <p>{t('home.groups.subtitle')}</p>
        </div>

        <div className="home-grid-4">
          {apiGroups.map(group => (
            <div key={group.id} className="home-feature-card">
              <div className="home-feature-icon-wrapper">
                <group.icon size={24} />
              </div>
              <h3 className="home-feature-name">{group.name}</h3>
              <p className="home-feature-desc">{group.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-header">
          <h2>{t('home.news.title')}</h2>
          <p>{t('home.news.subtitle')}</p>
          <button className="home-view-all-link" onClick={() => navigate('/social')}>
            {t('home.news.toSocial')} <ChevronRight size={16} />
          </button>
        </div>

        <div className="home-grid-4">
          {apiPosts.map(news => (
            <div 
              key={news.id} 
              className="home-news-card hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigate('/social')}
            >
              <div className="home-news-img-wrapper">
                <img src={news.image} alt={news.title} className="home-news-img" />
              </div>
              <div className="home-news-content">
                <div className="home-news-badge">
                  {news.type}
                </div>
                <h3 className="home-news-title">{news.title}</h3>
                <p className="home-news-date">{news.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        provider={selectedProvider} 
      />

      <ProfileDrawer 
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        profileId={selectedProfileId}
      />
    </div>
  );
};

export default Home;
