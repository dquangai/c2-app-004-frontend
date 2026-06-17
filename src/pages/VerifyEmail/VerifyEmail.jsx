import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { resendVerification, verifyEmail } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { t } = useLanguage();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [resendMessage, setResendMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    if (otp.length !== 5) {
      setError('Mã OTP phải có 5 chữ số.');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      await verifyEmail({ email, otp });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    setIsResending(true);
    setError(null);
    setResendMessage(null);
    try {
      const result = await resendVerification(email);
      setResendMessage(result.message || 'Đã gửi mã OTP mới.');
      setOtp('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
    setOtp(digits);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576013551627-11971f3f8f36?q=80&w=2000&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-center">
          <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-6">{t('auth.verify.success')}</h2>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold"
          >
            {t('auth.verify.continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576013551627-11971f3f8f36?q=80&w=2000&auto=format&fit=crop')" }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

      <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t('auth.verify.title')}</h2>
          <p className="text-slate-300 mt-2 text-sm">
            {t('auth.verify.subtitle')}
          </p>
          {email && <p className="text-indigo-300 font-semibold mt-2">{email}</p>}
        </div>

        {error && <p className="text-red-300 text-sm mb-4 text-center">{error}</p>}
        {resendMessage && <p className="text-emerald-300 text-sm mb-4 text-center">{resendMessage}</p>}

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t('auth.verify.otpPlaceholder')}
            value={otp}
            onChange={handleOtpChange}
            className="w-full py-4 text-center text-2xl tracking-[0.5em] font-bold bg-slate-900/50 border border-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            maxLength={5}
          />

          <button
            type="submit"
            disabled={isVerifying || otp.length !== 5}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold disabled:opacity-70"
          >
            {isVerifying ? t('auth.verify.submitting') : t('auth.verify.submit')}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || !email}
          className="w-full py-3 mt-4 bg-slate-800/80 border border-slate-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={18} className={isResending ? 'animate-spin' : ''} />
          {isResending ? t('auth.forgot.submitting') : t('auth.verify.resend')}
        </button>

        <p className="text-center text-slate-400 text-sm mt-6">
          <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300">
            {t('auth.forgot.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
