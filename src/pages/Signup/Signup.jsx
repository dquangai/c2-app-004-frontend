import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { Mail, Lock, UserPlus, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (password.length < 8) {
        throw new Error(t('auth.signup.passwordShort'));
      }
      if (!name.trim()) {
        throw new Error('Vui lòng nhập họ và tên.');
      }
      await register(email, password, name.trim());
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('đăng ký') || msg.includes('registered')) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1576013551627-11971f3f8f36?q=80&w=2000&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl mt-12 mb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <UserPlus size={28} className="text-white ml-1" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t('auth.signup.title')}</h2>
          <p className="text-slate-300 mt-2 text-sm font-medium">{t('auth.signup.subtitle')}</p>
        </div>

        {error && <p className="text-red-300 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t('auth.signup.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-400" />
            </div>
            <input
              type="email"
              placeholder={t('auth.signup.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" />
            </div>
            <input
              type="password"
              placeholder={t('auth.signup.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            {t('auth.signup.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
