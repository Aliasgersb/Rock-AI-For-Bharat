import React from 'react';
import { ArrowLeft, ScanLine, Keyboard, ChevronRight, ShieldCheck } from 'lucide-react';
import { ScreenName, UserProfile } from '../types';
import { t } from '../translations';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  userProfile: UserProfile;
}

export default function ProfileMethodScreen({ onNavigate, userProfile }: Props) {
  const lang = userProfile.language;

  return (
    <div className="flex flex-col h-full bg-white safe-top">
      {/* Navbar */}
      <div className="px-6 py-6">
        <button
          onClick={() => onNavigate(ScreenName.LOGIN)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors text-slate-900"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-6 flex flex-col animate-fadeSlideUp">
        <div className="mb-8 mt-2">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{t('completeProfile', lang)}</h1>
          <p className="text-slate-500 leading-relaxed text-sm max-w-xs">
            {t('chooseMethod', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Option 1: Scan (Primary) */}
          <button
            onClick={() => onNavigate(ScreenName.SCAN_VERIFY)}
            className="group relative w-full bg-[#0b3b5b] rounded-2xl p-4 text-left transition-transform active:scale-[0.98] shadow-xl shadow-[#0b3b5b]/20 flex items-center gap-3 overflow-hidden"
          >
            {/* Background Blob - Subtle */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-70"></div>

            <div className="relative z-10 p-3 bg-white/10 rounded-xl backdrop-blur-sm shrink-0 border border-white/10">
              <ScanLine className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>

            <div className="relative z-10 flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20 mb-1.5">
                {t('recommended', lang)}
              </span>
              <h3 className="font-bold text-base text-white leading-tight">{t('scanId', lang)}</h3>
              <p className="text-blue-100/90 text-xs leading-relaxed mt-1">
                {t('scanDesc', lang)}
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Option 2: Manual (Secondary) */}
          <button
            onClick={() => onNavigate(ScreenName.PROFILE_WIZARD)}
            className="group w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-left transition-all hover:border-[#0b3b5b]/30 hover:shadow-md active:bg-slate-50 flex items-center gap-3"
          >
            <div className="p-3 bg-slate-50 rounded-xl shrink-0 border border-slate-100 group-hover:bg-[#0b3b5b]/5 transition-colors">
              <Keyboard className="w-6 h-6 text-slate-700 group-hover:text-[#0b3b5b]" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-slate-900 mb-1 leading-tight">{t('enterManually', lang)}</h3>
              <p className="text-slate-500 text-xs leading-relaxed group-hover:text-slate-600">
                {t('manualDesc', lang)}
              </p>
            </div>

            <div className="shrink-0">
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0b3b5b] transition-colors" />
            </div>
          </button>
        </div>

        <div className="mt-auto mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t('govEncryption', lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}