import React, { useState, useMemo } from 'react';
import { ScreenName, UserProfile, Scheme } from '../types';
import { ArrowLeft, Check, Scale, ExternalLink } from 'lucide-react';
import { t } from '../translations';

interface Props {
    onNavigate: (screen: ScreenName) => void;
    schemes: Scheme[];
    userProfile: UserProfile;
}

export default function CompareScreen({ onNavigate, schemes, userProfile }: Props) {
    const lang = userProfile.language;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showComparison, setShowComparison] = useState(false);

    const eligibleSchemes = useMemo(() => schemes.filter(s => s.eligible), [schemes]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) return prev;
            return [...prev, id];
        });
    };

    const selectedSchemes = useMemo(
        () => selectedIds.map(id => eligibleSchemes.find(s => s.id === id)).filter(Boolean) as Scheme[],
        [selectedIds, eligibleSchemes]
    );

    const recommendation = useMemo(() => {
        if (selectedSchemes.length !== 2) return null;
        const [a, b] = selectedSchemes;

        let scoreA = 0;
        let scoreB = 0;
        const reasons: string[] = [];

        // Compare benefit amount
        const amountA = parseFloat((a.amount || '0').replace(/[^\d.]/g, '')) || 0;
        const amountB = parseFloat((b.amount || '0').replace(/[^\d.]/g, '')) || 0;
        if (amountA > amountB) { scoreA += 2; reasons.push(t('higherBenefit', lang)); }
        else if (amountB > amountA) { scoreB += 2; reasons.push(t('higherBenefit', lang)); }

        // Compare document count (fewer = better)
        const docsA = a.documents?.length || 0;
        const docsB = b.documents?.length || 0;
        if (docsA < docsB) { scoreA += 1; reasons.push(t('fewerDocuments', lang)); }
        else if (docsB < docsA) { scoreB += 1; reasons.push(t('fewerDocuments', lang)); }

        // Compare number of benefits listed
        const benefitsA = a.benefits?.length || 0;
        const benefitsB = b.benefits?.length || 0;
        if (benefitsA > benefitsB) { scoreA += 1; }
        else if (benefitsB > benefitsA) { scoreB += 1; }

        if (scoreA > scoreB) return { scheme: a, reasons };
        if (scoreB > scoreA) return { scheme: b, reasons };
        return null;
    }, [selectedSchemes, lang]);

    // ——— Selection Phase ———
    if (!showComparison) {
        return (
            <div className="h-full flex flex-col bg-slate-50 safe-top">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate(ScreenName.DASHBOARD)}
                            className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-base font-bold text-slate-900 flex-1">{t('compareTitle', lang)}</h1>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                            {t('schemesSelected', lang, { count: selectedIds.length })}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-8">{t('selectTwoSchemes', lang)}</p>
                </header>

                {/* Scheme List */}
                <div className="flex-1 overflow-y-auto p-4 animate-fadeIn">
                    <div className="space-y-3">
                        {eligibleSchemes.map(scheme => {
                            const isSelected = selectedIds.includes(scheme.id);
                            const isDisabled = selectedIds.length >= 2 && !isSelected;
                            return (
                                <button
                                    key={scheme.id}
                                    onClick={() => !isDisabled && toggleSelect(scheme.id)}
                                    disabled={isDisabled}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : isDisabled
                                            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                                            : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-slate-300 bg-white'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">{scheme.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scheme.description}</p>
                                            {scheme.amount && (
                                                <p className="text-xs font-medium text-blue-600 mt-1.5">{scheme.amount}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {eligibleSchemes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Scale className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="font-semibold text-slate-700 mb-1">{t('noSchemesDashboard', lang)}</h3>
                        </div>
                    )}
                </div>

                {/* Compare Button */}
                <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                    <button
                        onClick={() => setShowComparison(true)}
                        disabled={selectedIds.length !== 2}
                        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${selectedIds.length === 2
                            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-md shadow-blue-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {t('compareNow', lang)}
                    </button>
                </div>
            </div>
        );
    }

    // ——— Comparison Phase ———
    const [schemeA, schemeB] = selectedSchemes;

    const comparisonRows = [
        {
            label: t('benefitAmount', lang),
            a: schemeA.amount || '—',
            b: schemeB.amount || '—',
        },
        {
            label: t('benefitType', lang),
            a: schemeA.benefitType || '—',
            b: schemeB.benefitType || '—',
        },
        {
            label: t('issuingBody', lang),
            a: schemeA.ministry || '—',
            b: schemeB.ministry || '—',
        },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-50 safe-top">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={() => setShowComparison(false)}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h1 className="text-lg font-bold text-slate-900">{t('comparisonResult', lang)}</h1>
            </header>

            <div className="flex-1 overflow-y-auto animate-fadeSlideUp">
                {/* Scheme Headers */}
                <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-xs font-bold text-blue-600">A</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{schemeA.title}</h3>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-xs font-bold text-slate-600">B</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{schemeB.title}</h3>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="px-4 space-y-0">
                    {comparisonRows.map((row, i) => (
                        <div key={i} className={`bg-white border border-slate-200 p-4 ${i === 0 ? 'rounded-t-xl' : ''} ${i === comparisonRows.length - 1 && !schemeA.eligibilityCriteria && !schemeA.documents ? 'rounded-b-xl' : ''} ${i > 0 ? '-mt-px' : ''}`}>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{row.label}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <p className="text-sm font-medium text-slate-800">{row.a}</p>
                                <p className="text-sm font-medium text-slate-800">{row.b}</p>
                            </div>
                        </div>
                    ))}

                    {/* Eligibility Criteria */}
                    {(schemeA.eligibilityCriteria || schemeB.eligibilityCriteria) && (
                        <div className="bg-white border border-slate-200 p-4 -mt-px">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('eligibility', lang)}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    {(schemeA.eligibilityCriteria || []).map((c, i) => (
                                        <p key={i} className="text-xs text-slate-600 leading-relaxed">{c}</p>
                                    ))}
                                    {(!schemeA.eligibilityCriteria || schemeA.eligibilityCriteria.length === 0) && <p className="text-xs text-slate-400">—</p>}
                                </div>
                                <div className="space-y-1">
                                    {(schemeB.eligibilityCriteria || []).map((c, i) => (
                                        <p key={i} className="text-xs text-slate-600 leading-relaxed">{c}</p>
                                    ))}
                                    {(!schemeB.eligibilityCriteria || schemeB.eligibilityCriteria.length === 0) && <p className="text-xs text-slate-400">—</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Required Documents */}
                    {(schemeA.documents || schemeB.documents) && (
                        <div className="bg-white border border-slate-200 p-4 -mt-px">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('requiredDocs', lang)}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    {(schemeA.documents || []).map((d, i) => (
                                        <p key={i} className="text-xs text-slate-600">{d.name}</p>
                                    ))}
                                    {(!schemeA.documents || schemeA.documents.length === 0) && <p className="text-xs text-slate-400">—</p>}
                                </div>
                                <div className="space-y-1">
                                    {(schemeB.documents || []).map((d, i) => (
                                        <p key={i} className="text-xs text-slate-600">{d.name}</p>
                                    ))}
                                    {(!schemeB.documents || schemeB.documents.length === 0) && <p className="text-xs text-slate-400">—</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Official Website */}
                    {(schemeA.officialWebsite || schemeB.officialWebsite) && (
                        <div className="bg-white border border-slate-200 p-4 -mt-px rounded-b-xl">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('officialSite', lang)}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    {schemeA.officialWebsite ? (
                                        <a href={schemeA.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                                            {t('visitSite', lang)} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : <p className="text-xs text-slate-400">—</p>}
                                </div>
                                <div>
                                    {schemeB.officialWebsite ? (
                                        <a href={schemeB.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                                            {t('visitSite', lang)} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : <p className="text-xs text-slate-400">—</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recommendation */}
                {recommendation && (
                    <div className="p-4 mt-2">
                        <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-5">
                            <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-2">{t('recommendation', lang)}</p>
                            <h3 className="text-base font-bold text-slate-900 mb-2">{recommendation.scheme.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t('recommendedBecause', lang, { reason: recommendation.reasons.join(', ') })}
                            </p>
                        </div>
                    </div>
                )}

                {!recommendation && (
                    <div className="p-4 mt-2">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                            <p className="text-sm text-slate-500">{t('bothSchemesEqual', lang)}</p>
                        </div>
                    </div>
                )}

                {/* Spacer for bottom button */}
                <div className="h-20" />
            </div>

            {/* Back to Selection */}
            <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                <button
                    onClick={() => { setShowComparison(false); setSelectedIds([]); }}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.99] transition-all"
                >
                    {t('backToSelection', lang)}
                </button>
            </div>
        </div>
    );
}
