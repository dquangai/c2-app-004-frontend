import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { resendVerification } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';

const VerifyEmailSent = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResend = async () => {
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await resendVerification(email);
      setMessage(result.message || 'Đã gửi lại email xác minh.');
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

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
          <Mail size={28} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">{t('auth.verifySent.title')}</h2>
        <p className="text-slate-300 text-sm mb-2">
          {t('auth.verifySent.subtitle')}
        </p>
        {email && <p className="text-indigo-300 font-semibold mb-4">{email}</p>}
        <p className="text-slate-400 text-xs mb-6">
          Không có SMTP? Xem log backend để copy liên kết xác minh (môi trường dev).
        </p>

        {message && <p className="text-emerald-300 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading || !email}
          className="w-full py-3 mb-4 bg-slate-800/80 border border-slate-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? t('auth.forgot.submitting') : t('auth.verify.resend')}
        </button>

        <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 text-sm">
          {t('auth.verifySent.backToLogin')}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailSent;
