import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { forgotPassword } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
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

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t('auth.forgot.title')}</h2>
          <p className="text-slate-300 mt-2 text-sm font-medium">
            {t('auth.forgot.subtitle')}
          </p>
        </div>

        {error && <p className="text-red-300 text-sm mb-4 text-center">{error}</p>}

        {sent ? (
          <div className="text-center text-slate-200 text-sm space-y-4">
            <p>{t('auth.forgot.sent')}</p>
            <p className="text-slate-400 text-xs">
              Không có SMTP? Kiểm tra log backend để lấy liên kết (môi trường dev).
            </p>
            <Link to="/login" className="inline-block text-indigo-400 font-bold hover:text-indigo-300">
              {t('auth.forgot.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder={t('auth.forgot.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {isLoading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </button>
          </form>
        )}

        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            {t('auth.forgot.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
