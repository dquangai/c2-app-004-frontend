import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { localizePost } from '../../i18n/catalogContent';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Send, ShieldCheck, Briefcase } from 'lucide-react';
import './SocialNetwork.css';

import { fetchPosts } from '../../services/catalogService';

const sayAsVini = (message, options = {}) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vini:say', {
    detail: {
      message,
      ...options,
    },
  }));
};

const SocialNetwork = () => {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [searchParams] = useSearchParams();
  const highlightPostId = searchParams.get('post');
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const highlightRef = useRef(null);

  React.useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        if (data && Array.isArray(data)) {
          const postNum = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;
          const mapped = data
            .map((post, idx) => {
              const localized = localizePost(post, locale);
              return {
              id: localized.id,
              author: {
                name: localized.author,
                avatar: `https://i.pravatar.cc/150?img=${(idx % 70) + 1}`,
                zone: localized.residential_zone,
                role: 'user',
              },
              content: `${localized.title}\n\n${localized.summary}`,
              image: null,
              time: t('social.feed.recent'),
              likes: Math.floor(Math.random() * 50) + 5,
              comments: [],
              isLiked: false,
            };
            })
            .sort((a, b) => postNum(b.id) - postNum(a.id));
          setPosts(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, [t, locale]);

  useEffect(() => {
    if (!highlightPostId || !posts.length) return;
    const timer = window.setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [highlightPostId, posts]);

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost = {
      id: Date.now(),
      author: {
        name: user?.name || t('social.fallbackAuthor'),
        avatar: user?.avatar || 'https://i.pravatar.cc/150?img=12',
        zone: t('social.feed.resident'),
        role: 'user'
      },
      content: newPostContent,
      image: null,
      time: t('social.feed.justNow'),
      likes: 0,
      comments: [],
      isLiked: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    sayAsVini(t('social.vini.postPublished'));
  };

  const toggleLike = (postId) => {
    const targetPost = posts.find((post) => post.id === postId);
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
    if (targetPost && !targetPost.isLiked) {
      sayAsVini(t('social.vini.liked'));
    }
  };

  const handleShare = () => {
    alert(t('social.shareAlert'));
    sayAsVini(t('social.vini.shared'));
  };

  const handleAddComment = (postId, e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const text = e.target.value;
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, {
              id: Date.now(),
              author: user?.name || t('social.fallbackAuthor'),
              avatar: user?.avatar || 'https://i.pravatar.cc/150?img=12',
              content: text,
              time: t('social.feed.justNow')
            }]
          };
        }
        return post;
      }));
      e.target.value = '';
      sayAsVini(t('social.vini.commented'));
    }
  };

  return (
    <div className="social-container">
      <header className="social-page-header">
        <h1>{t('social.page.title')}</h1>
        <p>{t('social.page.subtitle')}</p>
      </header>
      <div className="social-feed">
        <div className="social-create-post card">
          <div className="create-post-header">
            <img src={user?.avatar || 'https://i.pravatar.cc/150?img=12'} alt="User" className="create-post-avatar" />
            <textarea
              className="create-post-input"
              placeholder={t('social.compose.placeholder')}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={2}
            ></textarea>
          </div>
          <div className="create-post-actions">
            <button className="create-post-btn-img">
              <ImageIcon size={20} />
              <span>{t('social.compose.media')}</span>
            </button>
            <button 
              className="create-post-btn-submit" 
              onClick={handlePostSubmit}
              disabled={!newPostContent.trim()}
            >
              <span>{t('social.compose.post')}</span>
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="social-posts-list">
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>{t('social.feed.loading')}</p>
          ) : posts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>{t('social.feed.empty')}</p>
          ) : (
            posts.map((post) => (
            <div
              key={post.id}
              id={`post-${post.id}`}
              ref={String(post.id) === highlightPostId ? highlightRef : null}
              className={`social-post card${String(post.id) === highlightPostId ? ' social-post--highlight' : ''}`}
            >
              <div className="post-header">
                <div className="post-author-info">
                  <img src={post.author.avatar} alt={post.author.name} className="post-avatar" />
                  <div>
                    <h4 className="post-author-name">
                      {post.author.name}
                      {post.author.role === 'admin' && <ShieldCheck size={16} className="post-role-icon admin-icon" />}
                      {post.author.role === 'service' && <Briefcase size={16} className="post-role-icon service-icon" />}
                    </h4>
                    <p className="post-time">{post.time} • {post.author.zone}</p>
                  </div>
                </div>
                <button className="post-more-btn"><MoreHorizontal size={20} /></button>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.image && (
                  <img src={post.image} alt="Post content" className="post-image" />
                )}
              </div>

              <div className="post-stats">
                <span className="post-stat-item">{post.likes} {t('social.actions.likes')}</span>
                <span className="post-stat-item">{post.comments.length} {t('social.actions.comments')}</span>
              </div>

              <div className="post-actions">
                <button 
                  className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <ThumbsUp size={20} className={post.isLiked ? 'fill-current' : ''} />
                  <span>{t('social.actions.like')}</span>
                </button>
                <button className="post-action-btn">
                  <MessageCircle size={20} />
                  <span>{t('social.actions.comment')}</span>
                </button>
                <button className="post-action-btn" onClick={handleShare}>
                  <Share2 size={20} />
                  <span>{t('social.actions.share')}</span>
                </button>
              </div>

              {post.comments.length > 0 && (
                <div className="post-comments-section">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="post-comment">
                      <img src={comment.avatar} alt={comment.author} className="comment-avatar" />
                      <div className="comment-content-wrapper">
                        <div className="comment-bubble">
                          <span className="comment-author">{comment.author}</span>
                          <p className="comment-text">{comment.content}</p>
                        </div>
                        <span className="comment-time">{comment.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="add-comment-wrapper">
                <img src={user?.avatar || 'https://i.pravatar.cc/150?img=12'} alt="User" className="add-comment-avatar" />
                <div className="add-comment-input-container">
                  <input 
                    type="text" 
                    placeholder={t('social.comments.placeholder')} 
                    className="add-comment-input" 
                    onKeyDown={(e) => handleAddComment(post.id, e)}
                  />
                  <button className="add-comment-send-btn"><Send size={16} /></button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      <div className="social-sidebar">
        <div className="card sidebar-widget">
          <h3 className="widget-title">{t('social.sidebar.trending')}</h3>
          <ul className="trending-list">
            {(t('social.sidebar.tags') || []).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocialNetwork;
