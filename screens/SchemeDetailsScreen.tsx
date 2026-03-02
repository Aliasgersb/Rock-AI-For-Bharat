import React, { useState, useEffect } from 'react';
import { ScreenName, Scheme, UserProfile } from '../types';
import { ArrowLeft, Share2, CheckCircle, ShieldCheck, IndianRupee, Wallet, Landmark, FileText, Smartphone, Fingerprint, ArrowRight, HeartHandshake, GraduationCap, Briefcase, MapPin, CreditCard, Building, Bookmark } from 'lucide-react';

import { t } from '../translations';
import { simplifySchemeDescription, getCachedSummary } from '../services/ai';

const iconMap: Record<string, any> = {
  IndianRupee, Landmark, HeartHandshake, GraduationCap, Briefcase, Building, Wallet, ShieldCheck, FileText, Smartphone, Fingerprint, MapPin, CreditCard
};

const getIcon = (name: string, fallback: any) => {
  const Icon = iconMap[name] || fallback;
  return <Icon className="w-5 h-5" />;
};

interface Props {
  onNavigate: (screen: ScreenName) => void;
  scheme: Scheme | null;
  userProfile: UserProfile;
  updateProfile?: (data: Partial<UserProfile>) => void;
  savedSchemeIds: Set<string>;
  toggleSaveScheme: (id: string) => void;
}

export default function SchemeDetailsScreen({ onNavigate, scheme, userProfile, updateProfile, savedSchemeIds, toggleSaveScheme }: Props) {
  if (!scheme) return null;
  const lang = userProfile.language;
  const [simplified, setSimplified] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);

  // ── Auto-load cached summary on mount & when language changes ──
  useEffect(() => {
    if (!scheme) return;
    const cached = getCachedSummary(scheme.id, lang);
    setSimplified(cached); // null if not cached → shows the button
  }, [scheme?.id, lang]);

  const handleSimplify = async () => {
    setIsSimplifying(true);
    const result = await simplifySchemeDescription(scheme, lang);
    setSimplified(result);
    setIsSimplifying(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface safe-top">
      <header className="bg-white sticky top-0 z-50 px-4 pt-4 pb-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate(ScreenName.DASHBOARD)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 truncate max-w-[200px]">{t('schemeDetails', lang)}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleSaveScheme(scheme.id)}
            className={`p-2 rounded-full hover:bg-slate-100 ${savedSchemeIds.has(scheme.id) ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}>
            <Bookmark className={`w-5 h-5 ${savedSchemeIds.has(scheme.id) ? 'fill-current' : ''}`} />
          </button>

          <button onClick={async () => {
            if (navigator.share) {
              try {
                const shareData: ShareData = {
                  title: scheme.title,
                  text: `Check out this government scheme: ${scheme.title}\n\n${scheme.description}`,
                };
                if (scheme.officialWebsite && scheme.officialWebsite !== 'Not available') {
                  shareData.url = scheme.officialWebsite;
                }
                await navigator.share(shareData);
              } catch (err) { console.error('Share failed', err); }
            }
          }} className="p-2 rounded-full hover:bg-slate-100 text-primary"><Share2 className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Hero */}
        <div className="bg-white p-6 mb-2 shadow-sm animate-fadeSlideUp">
          <div className="flex items-start gap-4">
            <img src="/logo.png" alt="JanSaarthi" className="w-20 h-20 object-contain flex-shrink-0" />
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold mb-2 border border-green-200">
                <CheckCircle className="w-3 h-3" /> {t('verifiedGov', lang)}
              </div>
              <h2 className="text-xl font-bold text-primary leading-tight mb-1">{scheme.title}</h2>
              <p className="text-xs text-slate-500 font-medium">{scheme.ministry || t('govtOfIndia', lang)}</p>
            </div>
          </div>
        </div>

        {/* About */}
        <section className="px-4 py-4 animate-fadeSlideUp stagger-1">
          <h3 className="text-lg font-bold text-slate-900 mb-3">{t('aboutScheme', lang)}</h3>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-sm leading-relaxed">{scheme.description}</p>

            {/* Simplified explanation */}
            {simplified && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-bold text-amber-700 mb-1">✨ {t('inSimpleWords', lang)}:</p>
                <p className="text-sm text-amber-900 leading-relaxed">{simplified}</p>
              </div>
            )}

            {!simplified && (
              <button
                onClick={handleSimplify}
                disabled={isSimplifying}
                className="mt-4 w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSimplifying ? (
                  <><span className="animate-spin">⏳</span> {t('simplifying', lang)}</>
                ) : (
                  <><span>✨</span> {t('explainInSimpleWords', lang)}</>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Benefits */}
        <section className="px-4 py-2 animate-fadeSlideUp stagger-2">
          <h3 className="text-lg font-bold text-slate-900 mb-3">{t('benefits', lang)}</h3>
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 space-y-4">
            {scheme.benefits && scheme.benefits.length > 0 ? (
              scheme.benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${idx === 0 ? 'bg-primary text-white shadow-primary/20 shadow-lg' : 'bg-white text-primary border border-slate-100'}`}>
                    {getIcon(benefit.icon, IndianRupee)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{benefit.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{benefit.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"><IndianRupee className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{scheme.amount || t('financialSupport', lang)}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t('primaryBenefit', lang)}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Eligibility */}
        <section className="px-4 py-4 animate-fadeSlideUp stagger-3">
          <h3 className="text-lg font-bold text-slate-900 mb-3">{t('eligibility', lang)}</h3>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <ul className="space-y-4">
              {scheme.eligibilityCriteria && scheme.eligibilityCriteria.length > 0 ? (
                scheme.eligibilityCriteria.map((criteria, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 leading-snug">{criteria}</span>
                  </li>
                ))
              ) : (
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-snug">{t('verifiedCitizen', lang)}</span>
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Documents */}
        <section className="px-4 py-2 mb-6 animate-fadeSlideUp stagger-4">
          <h3 className="text-lg font-bold text-slate-900 mb-3">{t('reqDocs', lang)}</h3>
          <div className="grid grid-cols-2 gap-3">
            {scheme.documents && scheme.documents.length > 0 ? (
              scheme.documents.map((doc, idx) => {
                const Icon = iconMap[doc.icon] || FileText;
                return (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 text-center">
                    <Icon className="w-6 h-6 text-primary" />
                    <span className="text-xs font-semibold text-slate-700">{doc.name}</span>
                  </div>
                );
              })
            ) : (
              <>
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 text-center">
                  <Fingerprint className="w-6 h-6 text-primary" />
                  <span className="text-xs font-semibold text-slate-700">{t('docAadhaar', lang)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 text-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <span className="text-xs font-semibold text-slate-700">{t('docMobile', lang)}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-100 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-center">
          <button onClick={() => {
            if (scheme.officialWebsite && scheme.officialWebsite !== 'Not available') window.open(scheme.officialWebsite, '_blank');
          }} className={`px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${!scheme.officialWebsite || scheme.officialWebsite === 'Not available' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {t('applyNow', lang)} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}