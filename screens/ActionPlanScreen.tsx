import React, { useState, useEffect } from 'react';
import { ScreenName, Scheme, UserProfile } from '../types';
import { ArrowLeft, MapPin, FileText, Building, Smartphone, ClipboardCheck, Briefcase, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import { t } from '../translations';
import { generateStepByStepPlan, getCachedActionPlan, ActionPlanStep } from '../services/ai';

const iconMap: Record<string, any> = {
    FileText, Building, Smartphone, MapPin, ClipboardCheck, Briefcase, CheckCircle,
};

interface Props {
    onNavigate: (screen: ScreenName) => void;
    scheme: Scheme | null;
    userProfile: UserProfile;
}

export default function ActionPlanScreen({ onNavigate, scheme, userProfile }: Props) {
    if (!scheme) return null;
    const lang = userProfile.language;

    const [actionPlan, setActionPlan] = useState<ActionPlanStep[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Use location from profile if available
    const locationName = (userProfile.district && userProfile.state)
        ? `${userProfile.district}, ${userProfile.state}`
        : userProfile.state
            ? userProfile.state
            : null;

    useEffect(() => {
        // Check cache first
        const cached = getCachedActionPlan(scheme.id, lang);
        if (cached) {
            setActionPlan(cached);
            setIsLoading(false);
            setProgress(100);
            return;
        }

        // Otherwise generate the plan
        generatePlan();
    }, [scheme.id, lang]);

    const generatePlan = async () => {
        setProgress(10);
        setProgress(30);

        // Generate the plan
        try {
            // Simulate progress ticks while AI works
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 8, 90));
            }, 400);

            // Fetch the plan
            const plan = await generateStepByStepPlan(scheme, lang, userProfile);
            clearInterval(progressInterval);
            setProgress(100);
            setActionPlan(plan);
        } catch (err) {
            setError('Unable to generate the guide right now. Please try again.');
            console.error(err);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-surface safe-top">
            {/* Header */}
            <header className="bg-white sticky top-0 z-50 px-4 pt-4 pb-4 flex items-center gap-3 border-b border-slate-100 shadow-sm">
                <button onClick={() => onNavigate(ScreenName.SCHEME_DETAILS)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-800" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-slate-900 truncate">{t('actionPlanTitle', lang) || 'Action Plan'}</h1>
                    <p className="text-xs text-slate-500 truncate">{scheme.title}</p>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-6">
                {/* Loading State: Skeleton Loader */}
                {isLoading && (
                    <div className="flex flex-col h-full px-5 pt-8 gap-8 animate-fadeSlideIn">
                        {/* Header Section */}
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-1.5 flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                {t('aiCreatingGuide', lang) || 'Preparing custom guide...'}
                            </h3>
                            <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                                {t('aiCreatingGuideDesc', lang) || 'Organizing scheme requirements and finding nearby offices...'}
                            </p>
                            {locationName && (
                                <p className="text-xs text-indigo-600 font-medium mt-2 bg-indigo-50 px-3 py-1 rounded-full w-fit mx-auto border border-indigo-100">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    {locationName}
                                </p>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Skeleton Cards */}
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm animate-pulse flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-4 bg-slate-100 rounded w-2/3" />
                                        <div className="space-y-2">
                                            <div className="h-2.5 bg-slate-50 rounded w-full" />
                                            <div className="h-2.5 bg-slate-50 rounded w-5/6" />
                                            {i === 1 && <div className="h-8 bg-blue-50 rounded w-1/3 mt-3" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <p className="text-sm text-slate-600">{error}</p>
                        <button
                            onClick={() => { setIsLoading(true); setError(null); setProgress(10); generatePlan(); }}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            {t('tryAgain', lang) || 'Try Again'}
                        </button>
                    </div>
                )}

                {/* Success: Timeline */}
                {!isLoading && !error && actionPlan && (
                    <div className="px-4 pt-5 pb-4 animate-fadeSlideUp">
                        {/* Location badge */}
                        {locationName && (
                            <div className="flex items-center gap-1.5 mb-5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg w-fit shadow-sm">
                                <MapPin className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs font-medium text-green-800">
                                    {locationName} {t('locationUsed', lang) ? `• ${t('locationUsed', lang)}` : '• Using location'}
                                </span>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="relative border-l-2 border-indigo-100 ml-5 space-y-7 py-1">
                            {actionPlan.map((step, idx) => {
                                const Icon = iconMap[step.icon] || ClipboardCheck;
                                return (
                                    <div key={idx} className="relative pl-7 animate-fadeSlideUp" style={{ animationDelay: `${idx * 0.12}s` }}>
                                        {/* Step Circle */}
                                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 text-xs font-bold">
                                            {step.stepNumber || idx + 1}
                                        </div>

                                        {/* Card */}
                                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{step.title}</h4>
                                            </div>
                                            <p className="text-[13px] text-slate-600 leading-relaxed">{step.description}</p>

                                            {step.mapQuery && (
                                                <button
                                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(step.mapQuery as string)}`, '_blank')}
                                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                                                >
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {t('findNearestOffice', lang) || 'Find Nearest Office'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
