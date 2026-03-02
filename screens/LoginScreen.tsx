import React from 'react';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { ScreenName, UserProfile } from '../types';
import { Button } from '../components/Button';
import { t } from '../translations';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  userProfile: UserProfile;
}

export default function LoginScreen({ onNavigate, updateProfile, userProfile }: Props) {
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [step, setStep] = React.useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = React.useState(false);

  const lang = userProfile.language;

  const handleSendOTP = () => {
    if (mobile.length !== 10) return;
    setLoading(true);
    // Simulate a brief delay for realism
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 800);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) return;
    setLoading(true);
    // Simulate verification delay
    setTimeout(() => {
      setLoading(false);
      updateProfile({ mobile });
      onNavigate(ScreenName.PROFILE_METHOD);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full px-6 pb-6 bg-surface safe-top">
      <div className="py-4">
        <button
          onClick={() => step === 'OTP' ? setStep('PHONE') : onNavigate(ScreenName.WELCOME)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-2 animate-fadeSlideUp">
        <img src="/logo.png" alt="JanSaarthi" className="w-20 h-20 object-contain mb-3" />
        <h1 className="text-2xl font-bold text-primary mb-6">JanSaarthi</h1>

        <div key={step} className="w-full space-y-6 animate-fadeIn">
          {step === 'PHONE' ? (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{t('loginTitle', lang)}</h2>
                <p className="text-slate-500 text-sm">{t('loginSubtitle', lang)}</p>
              </div>

              <div className="relative group">
                <div className="flex w-full bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
                  <div className="bg-slate-50 px-4 py-4 border-r border-slate-200 flex items-center gap-2 shrink-0">
                    <img src="https://flagcdn.com/w40/in.png" alt="India" className="w-6 h-4 rounded-sm object-cover shrink-0" />
                    <span className="font-semibold text-slate-700 shrink-0">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="00000 00000"
                    className="flex-1 min-w-0 px-4 py-4 bg-transparent outline-none text-lg font-medium text-slate-900 placeholder:text-slate-300 tracking-wide"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                className={mobile.length !== 10 || loading ? 'opacity-50 cursor-not-allowed' : ''}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('sendOtp', lang)}
              </Button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{t('verifyOtp', lang)}</h2>
                <p className="text-slate-500 text-sm">{t('otpSentTo', lang)} +91 {mobile}</p>
              </div>

              <div className="relative group">
                <div className="flex w-full bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
                  <input
                    type="tel"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="flex-1 min-w-0 px-4 py-4 bg-transparent outline-none text-center text-2xl font-bold tracking-[12px] text-slate-900 placeholder:text-slate-300"
                    style={{ textIndent: '12px' }}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={handleVerifyOTP}
                className={otp.length !== 6 || loading ? 'opacity-50 cursor-not-allowed' : ''}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('verify', lang)}
              </Button>

              <button
                onClick={() => { setStep('PHONE'); setOtp(''); }}
                className="w-full text-center text-primary font-semibold text-sm hover:underline"
              >
                {t('resendOtp', lang)}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-4 bg-green-50 rounded-full border border-green-100 mt-6">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-800 text-center">{t('secureData', lang)}</span>
      </div>
    </div>
  );
}