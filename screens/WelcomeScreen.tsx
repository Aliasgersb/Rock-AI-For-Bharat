import React, { useState, useMemo } from 'react';
import { CheckCircle, Globe, ChevronDown, Search, X } from 'lucide-react';
import { ScreenName, UserProfile } from '../types';
import { Button } from '../components/Button';
import { t } from '../translations';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const languages = [
  { id: 'English', label: 'English', sub: '' },
  { id: 'Hindi', label: 'हिन्दी', sub: '(Hindi)' },
  { id: 'Marathi', label: 'मराठी', sub: '(Marathi)' },
  { id: 'Telugu', label: 'తెలుగు', sub: '(Telugu)' },
  { id: 'Tamil', label: 'தமிழ்', sub: '(Tamil)' },
  { id: 'Bengali', label: 'বাংলা', sub: '(Bengali)' },
  { id: 'Gujarati', label: 'ગુજરાતી', sub: '(Gujarati)' },
  { id: 'Kannada', label: 'ಕನ್ನಡ', sub: '(Kannada)' },
  { id: 'Malayalam', label: 'മലയാളം', sub: '(Malayalam)' },
  { id: 'Punjabi', label: 'ਪੰਜਾਬੀ', sub: '(Punjabi)' },
  { id: 'Odia', label: 'ଓଡ଼ିଆ', sub: '(Odia)' },
  { id: 'Assamese', label: 'অসমীয়া', sub: '(Assamese)' },
  { id: 'Urdu', label: 'اردو', sub: '(Urdu)' },
];

export default function WelcomeScreen({ onNavigate, updateProfile }: Props) {
  const [selectedLang, setSelectedLang] = useState('English');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleContinue = () => {
    updateProfile({ language: selectedLang });
    onNavigate(ScreenName.LOGIN);
  };

  const filteredLanguages = useMemo(() => {
    return languages.filter(lang =>
      lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.sub.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const selectedLangObj = languages.find(l => l.id === selectedLang) || languages[0];

  return (
    <div className="flex flex-col h-full bg-surface relative safe-top">
      <div className="flex-1 flex flex-col items-center pt-12 px-6 overflow-y-auto no-scrollbar animate-fadeSlideUp">
        <img src="/logo.png" alt="JanSaarthi" className="w-28 h-28 object-contain mb-4" />

        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center tracking-tight">{t('welcomeTitle', selectedLang)}</h1>
        <p className="text-slate-500 text-center mb-6 max-w-xs leading-relaxed text-sm">{t('welcomeSubtitle', selectedLang)}</p>

        <div className="w-full space-y-3 mb-8 max-w-sm">
          <h2 className="text-sm font-bold text-slate-900 ml-1">
            {t('selectLang', selectedLang)}
          </h2>

          <button
            onClick={() => setIsDropdownOpen(true)}
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/50 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-slate-900">{selectedLangObj.label}</span>
                {selectedLangObj.sub && <span className="block text-xs text-slate-400 font-medium">{selectedLangObj.sub}</span>}
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="p-6 pb-8 bg-white border-t border-slate-100">
        <Button onClick={handleContinue} icon>{t('continue', selectedLang)}</Button>
      </div>

      {/* Language Selection Sheet */}
      {isDropdownOpen && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder={t('searchLangPlaceholder', selectedLang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLang(lang.id);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all ${selectedLang === lang.id
                    ? 'bg-primary/5 border border-primary/20'
                    : 'hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${selectedLang === lang.id ? 'text-primary' : 'text-slate-700'}`}>
                      {lang.label}
                    </span>
                    {lang.sub && (
                      <span className={`text-sm ${selectedLang === lang.id ? 'text-primary/70' : 'text-slate-400'}`}>
                        {lang.sub}
                      </span>
                    )}
                  </div>
                  {selectedLang === lang.id && (
                    <CheckCircle className="w-5 h-5 text-primary" fill="currentColor" fillOpacity={0.1} />
                  )}
                </button>
              ))}
              {filteredLanguages.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <p>{t('noLanguagesFound', selectedLang)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}