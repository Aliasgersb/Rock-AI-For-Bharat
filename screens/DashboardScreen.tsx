import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScreenName, UserProfile, Scheme } from '../types';
import { Search, ArrowRight, Home, Bookmark, User, Lightbulb, Loader2, CheckCircle, MapPin, Briefcase, IndianRupee, Users, LogOut, Edit3, X, Camera, Globe, Phone, GraduationCap, Info, School, HeartHandshake, Building2, Store, ShieldCheck } from 'lucide-react';
import CompareIcon from '../components/icons/CompareIcon';
import RecentlyViewedIcon from '../components/icons/RecentlyViewedIcon';
import { generateSchemes } from '../services/ai';
import { computeDriftAlerts, DriftAlert } from '../services/driftRadar';
import { generateInsight } from '../services/insightsEngine';
import { t } from '../translations';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  userProfile: UserProfile;
  schemes: Scheme[];
  setSchemes: (schemes: Scheme[]) => void;
  setSelectedScheme: (scheme: Scheme) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  savedSchemeIds: Set<string>;
  toggleSaveScheme: (id: string) => void;
}

type Tab = 'home' | 'browse' | 'saved' | 'profile';

export default function DashboardScreen({ onNavigate, userProfile, schemes, setSchemes, setSelectedScheme, updateProfile, savedSchemeIds, toggleSaveScheme }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<{ schemeId: string; timestamp: number }[]>(() => {
    try {
      const saved = localStorage.getItem('janSaarthi_recentlyViewed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const lang = userProfile.language;

  const driftAlerts = useMemo(() => computeDriftAlerts(userProfile), [userProfile]);

  useEffect(() => {
    if (schemes.length === 0) {
      const fetchSchemes = async () => {
        setIsLoading(true);
        try {
          const results = await generateSchemes(userProfile);
          setSchemes(results);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSchemes();
    }
  }, []);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleSaveScheme(id);
  };

  const handleSchemeClick = (scheme: Scheme) => {
    // Track recently viewed
    const entry = { schemeId: scheme.id, timestamp: Date.now() };
    const updated = [entry, ...recentlyViewed.filter(r => r.schemeId !== scheme.id)].slice(0, 15);
    setRecentlyViewed(updated);
    try { localStorage.setItem('janSaarthi_recentlyViewed', JSON.stringify(updated)); } catch { }
    setSelectedScheme(scheme);
    onNavigate(ScreenName.SCHEME_DETAILS);
  };



  // --- Helpers for Formatting ---
  const formatIncome = (value?: string) => {
    if (!value) return 'Not provided';
    switch (value) {
      case 'low': return t('incomeBelow25', lang);
      case 'mid_low': return t('income25to50', lang);
      case 'mid_high': return t('income50to80', lang);
      case 'high': return t('incomeAbove80', lang);
      default: return value;
    }
  };

  const formatAge = (dob?: string) => {
    if (!dob) return t('ageNotProvided', lang);
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return t('ageNotProvided', lang);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} ${t('yearsLabel', lang)}`;
  };

  const formatEducation = (value?: string) => {
    if (!value) return t('ageNotProvided', lang);
    switch (value) {
      case 'none': return t('eduNone', lang);
      case 'below_10': return t('eduBelow10', lang);
      case '10th': return t('edu10th', lang);
      case '12th': return t('edu12th', lang);
      case 'graduate': return t('eduDiploma', lang);
      case 'post_graduate': return t('eduPG', lang);
      default: return value;
    }
  };

  // --- Sub-components for tabs ---

  const SchemeCard: React.FC<{ scheme: Scheme }> = ({ scheme }) => {
    const isSaved = savedSchemeIds.has(scheme.id);
    return (
      <div
        onClick={() => handleSchemeClick(scheme)}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group active:scale-[0.99] transition-transform cursor-pointer"
      >
        <div className="h-1 w-full bg-gradient-to-r from-secondary to-orange-500"></div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-green-200">
              <CheckCircle className="w-3 h-3" /> {t('eligible', lang)}
            </span>
            <button
              onClick={(e) => toggleSave(e, scheme.id)}
              className={`p-1.5 rounded-full transition-colors ${isSaved ? 'text-primary bg-primary/5' : 'text-slate-300 hover:text-primary hover:bg-slate-50'}`}
            >
              <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 leading-snug">{scheme.title}</h3>
          <p className="text-slate-500 text-xs mb-3 line-clamp-2">{scheme.description}</p>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded">{t('benefitType', lang)}: {scheme.benefitType}</span>
            <span className="text-primary text-xs font-bold flex items-center gap-1">
              {t('viewDetails', lang)} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  const RenderHome = () => {
    const featuredScheme = schemes.length > 0 ? schemes[0] : null;
    return (
      <div className="px-6 pt-6 pb-24 tab-enter">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t('namaste', lang)}, {userProfile.name.split(' ')[0]}</h2>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#1a5a8a] shadow-xl shadow-primary/20 mb-8 p-6 text-white">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                {isLoading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Search className="w-6 h-6 text-white" />}
              </div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">{t('verifiedCitizen', lang)}</span>
            </div>

            <h3 className="text-2xl font-bold mb-2">
              {isLoading ? t('analyzingTitle', lang) : t('unlockBenefits', lang)}
            </h3>

            <p className="text-blue-100 text-sm mb-6 max-w-[85%]">
              {isLoading ? t('analyzingDesc', lang) : t('schemesFound', lang, { count: schemes.length })}
            </p>

            <button
              onClick={() => setActiveTab('browse')}
              disabled={isLoading}
              className={`w-full bg-white text-primary font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>Analyzing <Loader2 className="w-4 h-4 animate-spin ml-1" /></>
              ) : (
                <>{t('viewSchemes', lang, { count: schemes.length })} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Drift Radar Alerts */}
        {driftAlerts.length > 0 && !isLoading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900">{t('driftRadarTitle', lang)}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 ml-4">{t('driftRadarDesc', lang)}</p>
            <div className="space-y-3">
              {driftAlerts.slice(0, 4).map((alert, idx) => (
                <div
                  key={`${alert.scheme.id}-${alert.type}-${idx}`}
                  onClick={() => handleSchemeClick(alert.scheme)}
                  className={`p-4 rounded-xl border shadow-sm cursor-pointer active:scale-[0.99] transition-transform ${alert.type === 'lastChance'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${alert.type === 'lastChance' ? 'bg-orange-100' : 'bg-emerald-100'
                      }`}>
                      {alert.type === 'lastChance' ? '⚠️' : '🔓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{alert.scheme.title}</h4>
                      <p className={`text-xs font-semibold mt-0.5 ${alert.type === 'lastChance' ? 'text-orange-700' : 'text-emerald-700'
                        }`}>
                        {alert.type === 'lastChance'
                          ? t('driftLastChance', lang, { days: alert.daysRemaining })
                          : t('driftUnlock', lang, { days: alert.daysRemaining })}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {alert.type === 'lastChance'
                          ? t('driftLastChanceDesc', lang, { age: alert.boundaryAge })
                          : t('driftUnlockDesc', lang, { age: alert.boundaryAge })}
                      </p>
                    </div>
                    <ArrowRight className={`w-4 h-4 mt-1 flex-shrink-0 ${alert.type === 'lastChance' ? 'text-orange-400' : 'text-emerald-400'
                      }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => onNavigate(ScreenName.COMPARE_SCHEMES)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 active:bg-slate-50 cursor-pointer hover:border-blue-200 transition-colors">
            <div className="bg-blue-50 p-2 rounded-lg">
              <CompareIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{t('compareSchemes', lang)}</span>
          </button>
          <button onClick={() => onNavigate(ScreenName.HISTORY)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 active:bg-slate-50 cursor-pointer hover:border-green-200 transition-colors">
            <div className="bg-green-50 p-2 rounded-lg">
              <RecentlyViewedIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{t('history', lang)}</span>
          </button>
        </div>

        {/* Featured Scheme */}
        {featuredScheme && !isLoading && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{t('topRec', lang)}</h3>
              <button onClick={() => setActiveTab('browse')} className="text-sm font-semibold text-primary">{t('viewAll', lang)}</button>
            </div>
            <div
              onClick={() => handleSchemeClick(featuredScheme)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Home className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{featuredScheme.title}</h4>
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('eligible', lang)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{featuredScheme.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Insight Card */}
        {(() => {
          const insight = generateInsight(userProfile, schemes, savedSchemeIds.size);
          const insightText = t(insight.key, lang, insight.params);
          return (
            <div
              onClick={() => {
                if (insight.action === 'browse') setActiveTab('browse');
                else if (insight.action === 'saved') setActiveTab('saved');
                else if (insight.action === 'profile') setActiveTab('profile');
              }}
              className={`bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-6 ${insight.action ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
            >
              <Lightbulb className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-slate-900">{t('didYouKnow', lang)}</h5>
                <p className="text-xs text-slate-600 mt-1">{insightText}</p>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const RenderBrowse = () => {
    const filteredSchemes = schemes.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full tab-enter">
        <div className="px-6 py-4 sticky top-0 bg-surface z-10 space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-slate-900">{t('browse', lang)}</h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{schemes.length} {t('found', lang)}</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchSchemesPlaceholder', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 no-scrollbar">
          {filteredSchemes.length > 0 ? (
            filteredSchemes.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">{t('noSchemesDashboard', lang)}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const RenderSaved = () => {
    const savedSchemes = schemes.filter(s => savedSchemeIds.has(s.id));

    return (
      <div className="flex flex-col h-full tab-enter">
        <div className="px-6 py-4 sticky top-0 bg-surface z-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('saved', lang)}</h2>
          <p className="text-sm text-slate-500">{t('savedSchemesTab', lang, { count: savedSchemes.length })}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 no-scrollbar">
          {savedSchemes.length > 0 ? (
            savedSchemes.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)
          ) : (
            <div className="flex flex-col items-center justify-center h-[60%] text-center px-8">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Bookmark className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('noSavedSchemes', lang)}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('bookmarkSchemes', lang)}</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
              >
                {t('browseSchemesBtn', lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const STATE_DISTRICTS: { [key: string]: string[] } = {
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
    "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "Tinsukia", "Udalguri"],
    "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
    "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
    "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
    "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
    "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
    "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
    "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
    "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
    "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
    "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
    "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Tarn Taran"],
    "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
    "Tamil Nadu": ["Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
    "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
    "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
    "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
    "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
    "Ladakh": ["Kargil", "Leh"],
    "Lakshadweep": ["Lakshadweep"],
    "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
    "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
    "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Senapati", "Tamenglong", "Thoubal", "Ukhrul"],
    "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
    "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
    "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
    "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"]
  };

  const CATEGORIES = [
    { label: "General", value: "General" },
    { label: "OBC (Other Backward Class)", value: "OBC" },
    { label: "SC (Scheduled Caste)", value: "SC" },
    { label: "ST (Scheduled Tribe)", value: "ST" },
    { label: "EWS (Economically Weaker Section)", value: "EWS" },
    { label: "PVTG (Particularly Vulnerable Tribal Groups)", value: "PVTG" },
    { label: "DNT (Denotified Tribes)", value: "DNT" },
    { label: "NT (Nomadic Tribes)", value: "NT" },
    { label: "SBC (Special Backward Classes)", value: "SBC" },
    { label: "VJ (Vimukta Jati)", value: "VJ" },
    { label: "MBC (Most Backward Class)", value: "MBC" }
  ];

  const OCCUPATIONS = [
    { label: "Farmer / Agriculturist", value: "Farmer", icon: Store },
    { label: "Student", value: "Student", icon: School },
    { label: "Daily Wage Worker", value: "Worker", icon: Briefcase },
    { label: "Small Business Owner", value: "Business", icon: Store },
    { label: "Unemployed", value: "Unemployed", icon: User },
    { label: "Homemaker", value: "Homemaker", icon: HeartHandshake },
    { label: "Government Employee", value: "GovtEmployee", icon: Building2 },
    { label: "Private Sector Employee", value: "PrivateEmployee", icon: Building2 },
    { label: "Gig Worker / Delivery", value: "GigWorker", icon: MapPin },
    { label: "Construction Worker", value: "Construction", icon: Briefcase },
    { label: "Street Vendor", value: "Vendor", icon: Store },
    { label: "Teacher / Educator", value: "Teacher", icon: School },
    { label: "Healthcare Worker", value: "Healthcare", icon: HeartHandshake },
    { label: "Artisan / Craftsman", value: "Artisan", icon: User },
    { label: "Retired / Pensioner", value: "Retired", icon: User },
    { label: "Driver", value: "Driver", icon: Briefcase },
    { label: "Armed Forces / Defence", value: "Defence", icon: ShieldCheck },
    { label: "Other", value: "Other", icon: User }
  ];

  const RenderProfile = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingField, setEditingField] = useState<keyof UserProfile | 'location' | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateProfile({ profileImage: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    };

    const ProfileItem = ({ icon: Icon, label, value, field, readOnly }: any) => (
      <div
        onClick={() => !readOnly && setEditingField(field)}
        className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 ${readOnly ? '' : 'cursor-pointer hover:border-primary/20 active:scale-[0.99] transition-all'}`}
      >
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">{label}</p>
          <p className="text-slate-900 font-semibold text-sm truncate">{value || t('ageNotProvided', lang)}</p>
        </div>
        {!readOnly && (
          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center ml-2 border border-slate-100">
            <Edit3 className="w-3 h-3 text-slate-400" />
          </div>
        )}
      </div>
    );

    const EditProfileModal = () => {
      const [isExiting, setIsExiting] = useState(false);
      if (!editingField) return null;

      const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
          setEditingField(null);
          setIsExiting(false);
        }, 250);
      };

      const [tempValue, setTempValue] = useState<any>(
        editingField === 'location'
          ? { state: userProfile.state || '', district: userProfile.district || '' }
          : (userProfile as any)[editingField] || ''
      );
      const [stateSearch, setStateSearch] = useState('');
      const [districtSearch, setDistrictSearch] = useState('');
      const [categorySearch, setCategorySearch] = useState('');
      const [occupationSearch, setOccupationSearch] = useState('');

      const handleSave = async () => {
        if (editingField === 'location') {
          updateProfile({ state: tempValue.state, district: tempValue.district });
        } else {
          updateProfile({ [editingField!]: tempValue });
        }
        setEditingField(null);

        // Only re-generate schemes if editing field affects eligibility
        if (editingField && !['name', 'language', 'profileImage'].includes(editingField)) {
          setIsLoading(true);
          try {
            const results = await generateSchemes(
              editingField === 'location'
                ? { ...userProfile, state: tempValue.state, district: tempValue.district }
                : { ...userProfile, [editingField]: tempValue }
            );
            setSchemes(results);
          } catch (e) {
            console.error(e);
          } finally {
            setIsLoading(false);
          }
        }
      };

      const renderInput = () => {
        switch (editingField) {
          case 'language':
            return (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-4 pr-1">
                {[
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
                ].map((l) => (
                  <label key={l.id} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-xl cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-700">{l.label}</span>
                      {l.sub && <span className="text-sm text-slate-400 ml-2">{l.sub}</span>}
                    </div>
                    <input type="radio" name="lang" value={l.id} checked={tempValue === l.id} onChange={() => setTempValue(l.id)} className="w-5 h-5 text-primary focus:ring-primary" />
                  </label>
                ))}
              </div>
            );
          case 'name':
            return (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                autoFocus
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-800 font-medium"
                placeholder={`Enter your full name`}
              />
            );
          case 'education':
            return (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-4 pr-1">
                {[
                  { label: t('eduNone', lang), value: "none" },
                  { label: t('eduBelow10', lang), value: "below_10" },
                  { label: t('edu10th', lang), value: "10th" },
                  { label: t('edu12th', lang), value: "12th" },
                  { label: t('eduDiploma', lang), value: "graduate" },
                  { label: t('eduPG', lang), value: "post_graduate" }
                ].map((edu) => (
                  <label key={edu.value} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-xl cursor-pointer">
                    <span className="font-semibold text-slate-700">{edu.label}</span>
                    <input type="radio" name="education" value={edu.value} checked={tempValue === edu.value} onChange={() => setTempValue(edu.value)} className="w-5 h-5 text-primary focus:ring-primary" />
                  </label>
                ))}
              </div>
            );
          case 'occupation':
            return (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={occupationSearch}
                    onChange={(e) => setOccupationSearch(e.target.value)}
                    placeholder={t('searchState', lang).replace('state', 'occupation')}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary placeholder:text-slate-400 text-sm font-medium"
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2 no-scrollbar pb-1">
                  {OCCUPATIONS.filter(o => o.label.toLowerCase().includes(occupationSearch.toLowerCase())).map((occ) => (
                    <button
                      key={occ.value}
                      onClick={() => setTempValue(occ.value)}
                      className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-4 ${tempValue === occ.value
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
                        }`}
                    >
                      <occ.icon className={`w-5 h-5 flex-shrink-0 ${tempValue === occ.value ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="text-base">{occ.label}</span>
                    </button>
                  ))}
                  {OCCUPATIONS.filter(o => o.label.toLowerCase().includes(occupationSearch.toLowerCase())).length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      {t('noOccupationMatch', lang)} "{occupationSearch}"
                    </div>
                  )}
                </div>
              </div>
            );
          case 'category':
            return (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder={t('searchState', lang).replace('state', 'category')}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary placeholder:text-slate-400 text-sm font-medium"
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2 no-scrollbar pb-1">
                  {CATEGORIES.filter(c => c.label.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setTempValue(cat.value)}
                      className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-4 ${tempValue === cat.value
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
                        }`}
                    >
                      <Users className={`w-5 h-5 flex-shrink-0 ${tempValue === cat.value ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="text-base">{cat.label}</span>
                    </button>
                  ))}
                  {CATEGORIES.filter(c => c.label.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      {t('noCategoryMatch', lang)} "{categorySearch}"
                    </div>
                  )}
                </div>
              </div>
            );
          case 'location':
            return (
              <div className="space-y-6">
                {/* State Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('state', lang) || 'State'}</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      placeholder="Search state..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white outline-none text-slate-800 text-sm transition-colors"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 no-scrollbar border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setTempValue({ state: s, district: '' });
                          setStateSearch('');
                          setDistrictSearch('');
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${tempValue.state === s
                          ? 'bg-primary text-white shadow-md'
                          : 'hover:bg-slate-100 text-slate-600'
                          }`}
                      >
                        {s}
                        {tempValue.state === s && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* District Selector (only if state is selected) */}
                {tempValue.state && STATE_DISTRICTS[tempValue.state] && (
                  <div className="animate-fadeSlideUp">
                    <div className="h-px w-full bg-slate-100 my-4"></div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('district', lang) || 'District'}</label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        placeholder="Search district..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white outline-none text-slate-800 text-sm transition-colors"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 no-scrollbar border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                      {STATE_DISTRICTS[tempValue.state].filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map((d) => (
                        <button
                          key={d}
                          onClick={() => setTempValue({ ...tempValue, district: d })}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${tempValue.district === d
                            ? 'bg-primary text-white shadow-md'
                            : 'hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                          {d}
                          {tempValue.district === d && <CheckCircle className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tempValue.state && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-800 font-medium">Selected: <span className="font-bold">{tempValue.district ? `${tempValue.district}, ${tempValue.state}` : tempValue.state}</span></p>
                  </div>
                )}
              </div>
            );
          case 'gender':
            return (
              <div className="space-y-3">
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-xl cursor-pointer">
                    <span className="font-semibold text-slate-700">{g}</span>
                    <input type="radio" name="gender" value={g} checked={tempValue === g} onChange={() => setTempValue(g)} className="w-5 h-5 text-primary focus:ring-primary" />
                  </label>
                ))}
              </div>
            );
          case 'dateOfBirth':
            return (
              <input
                type="date"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-800 font-medium"
              />
            );
          case 'income':
            return (
              <div className="space-y-3">
                {[
                  { label: "Below ₹2.5 Lakh", value: "low" },
                  { label: "₹2.5L - ₹5L", value: "mid_low" },
                  { label: "₹5L - ₹8L", value: "mid_high" },
                  { label: "Above ₹8L", value: "high" }
                ].map((inc) => (
                  <label key={inc.value} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-xl cursor-pointer">
                    <span className="font-semibold text-slate-700">{inc.label}</span>
                    <input type="radio" name="income" value={inc.value} checked={tempValue === inc.value} onChange={() => setTempValue(inc.value)} className="w-5 h-5 text-primary focus:ring-primary" />
                  </label>
                ))}
              </div>
            );
          default:
            return null;
        }
      };

      const getTitle = () => {
        const titles: Record<string, string> = {
          name: "Full Name", language: "App Language", location: "Location",
          occupation: "Occupation", gender: "Gender", category: "Category",
          dateOfBirth: "Date of Birth", income: "Annual Income", education: "Education Level"
        };
        return titles[editingField] || editingField;
      };

      return (
        <div className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-900/50 backdrop-blur-sm ${isExiting ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
          <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isExiting ? 'animate-fadeSlideDown' : 'animate-fadeSlideUp'}`}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 capitalize">{t('editPrefix', lang)} {getTitle()}</h3>
              <button onClick={handleClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {renderInput()}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3.5 px-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {t('actionCancel', lang)}
                </button>
                <button
                  onClick={async () => {
                    await handleSave();
                    handleClose();
                  }}
                  className="flex-1 py-3.5 px-4 font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-colors"
                >
                  {t('actionSaveChanges', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const SignOutConfirmationModal = () => {
      const [isExiting, setIsExiting] = useState(false);
      if (!showSignOutModal) return null;

      const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
          setShowSignOutModal(false);
          setIsExiting(false);
        }, 250);
      };

      const handleConfirmSignOut = () => {
        localStorage.removeItem('janSaarthi_profile');
        localStorage.removeItem('janSaarthi_schemes');
        localStorage.removeItem('janSaarthi_saved_schemes');
        localStorage.removeItem('janSaarthi_recentlyViewed');
        window.location.reload();
      };

      return (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 ${isExiting ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
          <div className={`relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden ${isExiting ? 'animate-fadeSlideDown' : 'animate-fadeSlideUp'}`}>
            <div className="p-6 pt-8 pb-4 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('signOutConfirmTitle', lang)}</h3>
              <p className="text-slate-500 leading-relaxed">
                {t('signOutConfirmMessage', lang)}
              </p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={handleConfirmSignOut}
                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
              >
                {t('signOutConfirmAction', lang)}
              </button>
              <button
                onClick={handleClose}
                className="w-full py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-[0.98]"
              >
                {t('signOutCancel', lang)}
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="flex flex-col h-full bg-white tab-enter">
          <div className="px-6 py-8 pb-24 overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {userProfile.profileImage ? (
                  <>
                    <img src={userProfile.profileImage} alt="Profile" className="w-28 h-28 rounded-full border-4 border-slate-50 shadow-xl object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateProfile({ profileImage: undefined });
                      }}
                      className="absolute top-0 right-0 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full border-2 border-slate-100 shadow-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-50 shadow-xl text-slate-300">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-4 border-white shadow-md transition-transform group-hover:scale-110">
                  <Camera className="w-4 h-4" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-3 py-1 -mx-3 rounded-lg transition-colors group"
                onClick={() => setEditingField('name')}
              >
                <h2 className="text-2xl font-bold text-slate-900">{userProfile.name}</h2>
                <Edit3 className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-1 mt-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{t('verifiedCitizen', lang)}</span>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {t('profileUpdateReminder', lang)}
              </p>
            </div>

            <div className="w-full mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">{t('personalDetails', lang)}</h3>
              <div className="flex flex-col gap-3">
                <ProfileItem
                  icon={Globe}
                  label="App Language"
                  value={userProfile.language}
                  field="language"
                />
                <ProfileItem
                  icon={Phone}
                  label="Mobile Number"
                  value={userProfile.mobile}
                  field="mobile"
                  readOnly
                />
                <ProfileItem
                  icon={MapPin}
                  label="Location"
                  value={`${userProfile.district || ''}${userProfile.district && userProfile.state ? ', ' : ''}${userProfile.state || ''}`}
                  field="location"
                />

                <ProfileItem
                  icon={User}
                  label="Gender"
                  value={userProfile.gender}
                  field="gender"
                />
                <ProfileItem
                  icon={User}
                  label="Age (DOB)"
                  value={userProfile.dateOfBirth ? `${formatAge(userProfile.dateOfBirth)} (${userProfile.dateOfBirth})` : formatAge(userProfile.dateOfBirth)}
                  field="dateOfBirth"
                />
                <ProfileItem
                  icon={GraduationCap}
                  label="Education"
                  value={formatEducation(userProfile.education)}
                  field="education"
                />
                <ProfileItem
                  icon={Briefcase}
                  label="Occupation"
                  value={userProfile.occupation}
                  field="occupation"
                />
                <ProfileItem
                  icon={Users}
                  label="Category"
                  value={userProfile.category}
                  field="category"
                />
                <ProfileItem
                  icon={IndianRupee}
                  label="Income Group"
                  value={formatIncome(userProfile.income)}
                  field="income"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSignOutModal(true)}
              className="w-full p-4 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors mt-4 border border-red-100"
            >
              <LogOut className="w-5 h-5" /> {t('actionSignOut', lang)}
            </button>
          </div>
        </div>

        {/* Render modals OUTSIDE the tab-enter animated div to escape its stacking context */}
        <EditProfileModal />
        <SignOutConfirmationModal />
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface relative safe-top">
      {/* Header - Only for Home. Browse/Saved/Profile have their own headers or layout */}
      {activeTab === 'home' && (
        <header className="px-6 py-4 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="JanSaarthi" className="w-11 h-11 object-contain" />
            <h1 className="text-lg font-bold text-primary">JanSaarthi</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="relative transition-transform active:scale-95 group"
            >
              {userProfile.profileImage ? (
                <img src={userProfile.profileImage} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm object-cover group-hover:border-primary/20 transition-colors" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-50 shadow-sm flex items-center justify-center text-slate-400 group-hover:border-primary/20 transition-colors">
                  <User className="w-6 h-6" />
                </div>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main key={activeTab} className="flex-1 overflow-y-auto no-scrollbar relative">
        {activeTab === 'home' && <RenderHome />}
        {activeTab === 'browse' && <RenderBrowse />}
        {activeTab === 'saved' && <RenderSaved />}
        {activeTab === 'profile' && <RenderProfile />}
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-end pb-6 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${activeTab === 'home' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'home' ? 2 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('home', lang)}</span>
        </button>

        <button
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${activeTab === 'browse' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Search className="w-6 h-6" strokeWidth={activeTab === 'browse' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('browse', lang)}</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${activeTab === 'saved' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Bookmark className={`w-6 h-6 ${activeTab === 'saved' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'saved' ? 2 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('saved', lang)}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'profile' ? 2 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('profile', lang)}</span>
        </button>
      </nav>

    </div>
  );
}