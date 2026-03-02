import React, { useMemo } from 'react';
import { ScreenName, UserProfile, Scheme } from '../types';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { t } from '../translations';

interface Props {
    onNavigate: (screen: ScreenName) => void;
    schemes: Scheme[];
    userProfile: UserProfile;
    setSelectedScheme: (scheme: Scheme) => void;
}

export default function HistoryScreen({ onNavigate, schemes, userProfile, setSelectedScheme }: Props) {
    const lang = userProfile.language;

    const recentlyViewed = useMemo(() => {
        try {
            const saved = localStorage.getItem('janSaarthi_recentlyViewed');
            return saved ? JSON.parse(saved) as { schemeId: string; timestamp: number }[] : [];
        } catch { return []; }
    }, []);

    const getTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return t('viewedJustNow', lang);
        if (mins < 60) return t('viewedMinsAgo', lang, { count: mins });
        if (hrs < 24) return t('viewedHrsAgo', lang, { count: hrs });
        if (days === 1) return t('viewedYesterday', lang);
        return t('viewedDaysAgo', lang, { count: days });
    };

    const handleSchemeClick = (scheme: Scheme) => {
        // Track the view
        const entry = { schemeId: scheme.id, timestamp: Date.now() };
        const existing = recentlyViewed.filter(r => r.schemeId !== scheme.id);
        const updated = [entry, ...existing].slice(0, 15);
        try { localStorage.setItem('janSaarthi_recentlyViewed', JSON.stringify(updated)); } catch { }
        setSelectedScheme(scheme);
        onNavigate(ScreenName.SCHEME_DETAILS);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 safe-top">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={() => onNavigate(ScreenName.DASHBOARD)}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900">{t('recentlyViewedTitle', lang)}</h1>
                    {recentlyViewed.length > 0 && (
                        <p className="text-xs text-slate-500">{recentlyViewed.length} {recentlyViewed.length === 1 ? t('schemeSingular', lang) : t('schemePlural', lang)}</p>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 animate-fadeIn">
                {recentlyViewed.length > 0 ? (
                    <div className="space-y-3">
                        {recentlyViewed.map((entry) => {
                            const scheme = schemes.find(s => s.id === entry.schemeId);
                            if (!scheme) return null;
                            const timeAgo = getTimeAgo(entry.timestamp);
                            return (
                                <button
                                    key={`${entry.schemeId}-${entry.timestamp}`}
                                    onClick={() => handleSchemeClick(scheme)}
                                    className="w-full text-left p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 active:scale-[0.99] transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{scheme.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{scheme.description}</p>
                                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{timeAgo}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="font-bold text-slate-700 mb-1">{t('noHistoryTitle', lang)}</h4>
                        <p className="text-sm text-slate-500 max-w-xs">{t('noHistoryDesc', lang)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
