import React, { useEffect } from 'react';
import { ScreenName, UserProfile, Scheme } from '../types';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { generateSchemes } from '../services/ai';
import { Button } from '../components/Button';
import { t } from '../translations';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  userProfile: UserProfile;
  setSchemes: (schemes: Scheme[]) => void;
}

export default function AnalyzingScreen({ onNavigate, userProfile, setSchemes }: Props) {
  const [error, setError] = React.useState(false);
  const lang = userProfile.language;

  useEffect(() => {
    const fetch = async () => {
      try {
        // Add a brief delay for UX — matching is now instant but the animation should play
        await new Promise(resolve => setTimeout(resolve, 2000));
        const results = await generateSchemes(userProfile);
        setSchemes(results);
        // Always navigate to Dashboard — it has its own empty-state UI
        onNavigate(ScreenName.DASHBOARD);
      } catch (e) {
        setError(true);
      }
    };

    fetch();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface p-6 text-center safe-top">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('somethingWentWrong', lang)}</h3>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">{t('noSchemes', lang)}</p>
        <Button onClick={() => onNavigate(ScreenName.PROFILE_WIZARD)}>{t('goBack', lang)}</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden safe-top">
      {/* Background Pattern - Subtle dots */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0b3b5b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Top Section - Logo */}
      <div className="pt-12 pb-4 flex justify-center z-10 shrink-0">
        <div className="w-16 h-16 bg-white backdrop-blur-sm rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
          <img src="/logo.png" alt="JanSaarthi Logo" className="w-10 h-10 object-contain" />
        </div>
      </div>

      {/* Center Section - Spinner & Text */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 min-h-0 animate-fadeSlideUp">
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          {/* Background Circle (Light) */}
          <svg className="w-full h-full absolute inset-0 rotate-[-90deg]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          </svg>

          {/* Animated Spinner (Dark Blue) */}
          <svg className="w-full h-full absolute inset-0 animate-spin-slow" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#0b3b5b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="180"
              strokeDashoffset="0"
              className="origin-center"
            />
          </svg>

          {/* Center Search Icon */}
          <div className="relative bg-white rounded-full p-4 shadow-md border border-slate-100 z-10">
            <Search className="w-8 h-8 text-[#0b3b5b] animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-4 px-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('analyzingTitle', lang)}</h2>
          <div className="inline-flex items-center gap-2.5 text-slate-500 text-sm font-medium bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-[#0b3b5b]" />
            <span>{t('analyzingDesc', lang)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section - Info Card */}
      <div className="p-6 pb-8 z-10 shrink-0">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-start gap-4">
          <img src="/logo.png" alt="JanSaarthi" className="w-14 h-14 object-contain flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('aiSearch', lang)}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('aiSearchDesc', lang)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}