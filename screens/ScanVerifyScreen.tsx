import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Camera, Check, AlertCircle, RefreshCw,
  User, Calendar, MapPin, Users, ShieldCheck, CheckCircle2,
  RotateCw, ChevronRight, Pencil, Loader2, Search, X
} from 'lucide-react';
import { ScreenName, UserProfile } from '../types';
import { Button } from '../components/Button';
import { extractProfileFromIdCard } from '../services/ai';
import { t } from '../translations';

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
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Senapati", "Tamenglong", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
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
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"]
};

interface Props {
  onNavigate: (screen: ScreenName) => void;
  userProfile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
}

// ── States for the multi-step flow ───────────────────────────────
type FlowStep = 'tutorial' | 'capture_front' | 'capture_back' | 'analyzing' | 'review' | 'error';

export default function ScanVerifyScreen({ onNavigate, userProfile, updateProfile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<FlowStep>('tutorial');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<Partial<UserProfile> | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showFlip, setShowFlip] = useState(false);

  const lang = userProfile.language;

  // ── Camera helpers ─────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          // @ts-ignore – advanced constraints for autofocus (supported on most mobile browsers)
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' },
        } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;

      // Also try to apply continuous focus via applyConstraints (belt-and-suspenders)
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.() as any;
          const advancedConstraints: any = {};
          if (capabilities?.focusMode?.includes('continuous')) {
            advancedConstraints.focusMode = 'continuous';
          }
          if (capabilities?.exposureMode?.includes('continuous')) {
            advancedConstraints.exposureMode = 'continuous';
          }
          if (capabilities?.whiteBalanceMode?.includes('continuous')) {
            advancedConstraints.whiteBalanceMode = 'continuous';
          }
          if (Object.keys(advancedConstraints).length > 0) {
            await videoTrack.applyConstraints({ advanced: [advancedConstraints] } as any);
          }
        }
      } catch (_) {
        // Silently ignore – autofocus not supported on this device/browser
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err: any) {
      setErrorMessage(t('cameraPermissionDenied', lang));
      setStep('error');
    }
  }, [lang]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);

    // Return base64 without the data:image/jpeg;base64, prefix
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1];
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  // ── Step transitions ───────────────────────────────────────────
  const handleStartCapture = useCallback(async () => {
    setStep('capture_front');
    await startCamera();
  }, [startCamera]);

  const handleCaptureFront = useCallback(() => {
    const base64 = capturePhoto();
    if (!base64) return;
    setFrontImage(base64);
    stopCamera();

    // Show flip animation before back capture
    setShowFlip(true);
  }, [capturePhoto, stopCamera]);

  const handleFlipDone = useCallback(async () => {
    setShowFlip(false);
    setStep('capture_back');
    await startCamera();
  }, [startCamera]);

  const handleCaptureBack = useCallback(async () => {
    const base64 = capturePhoto();
    if (!base64) return;
    setBackImage(base64);
    stopCamera();

    // Start extraction
    setStep('analyzing');

    // Cycle through friendly loading messages
    const messages = [
      t('docScanLoading1', lang),
      t('docScanLoading2', lang),
      t('docScanLoading3', lang),
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 2500);

    try {
      const front64 = frontImage!;
      const result = await extractProfileFromIdCard(front64, base64);

      clearInterval(interval);

      if (result && Object.keys(result).filter(k => (result as any)[k]).length >= 2) {
        setExtractedProfile(result);
        setEditedProfile({ ...result });
        setStep('review');
      } else {
        setErrorMessage(t('docScanNoData', lang));
        setStep('error');
      }
    } catch (err) {
      clearInterval(interval);
      setErrorMessage(t('docScanError', lang));
      setStep('error');
    }
  }, [capturePhoto, stopCamera, frontImage, lang]);

  const handleContinue = () => {
    const finalProfile = { ...extractedProfile, ...editedProfile };
    updateProfile(finalProfile);
    onNavigate(ScreenName.PROFILE_WIZARD);
  };

  const handleFieldEdit = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleRetry = () => {
    setFrontImage(null);
    setBackImage(null);
    setExtractedProfile(null);
    setErrorMessage('');
    setStep('tutorial');
  };

  // ── Field display card ─────────────────────────────────────────
  const EditableFieldCard = ({ icon: Icon, label, value, field }: { icon: any; label: string; value: string; field: string }) => {
    const currentValue = (editedProfile as any)[field] || value;

    return (
      <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-primary/10 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-slate-800 truncate">{currentValue}</p>
        </div>
        <button onClick={() => setEditingField(field)} className="p-1 rounded-full hover:bg-slate-100">
          <Pencil className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    );
  };

  // ── Edit Field Modal (popup with selectable options) ───────────
  const EditFieldModal = () => {
    if (!editingField) return null;

    const currentValue = (editedProfile as any)[editingField] || (extractedProfile as any)?.[editingField] || '';
    const [tempValue, setTempValue] = useState(currentValue);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSave = () => {
      handleFieldEdit(editingField, tempValue);
      setEditingField(null);
    };

    const getTitle = () => {
      const titles: Record<string, string> = {
        name: t('fullName', lang),
        gender: t('gender', lang),
        dateOfBirth: t('dob', lang),
        state: t('state', lang),
        district: t('district', lang),
      };
      return titles[editingField] || editingField;
    };

    const renderInput = () => {
      switch (editingField) {
        case 'gender':
          return (
            <div className="space-y-3">
              {['Male', 'Female', 'Other'].map((g) => (
                <label key={g} className={`flex items-center justify-between p-4 bg-white border-2 rounded-xl cursor-pointer transition-colors ${tempValue === g ? 'border-primary/30 bg-primary/5' : 'border-slate-100'
                  }`}>
                  <span className="font-semibold text-slate-700">{g}</span>
                  <input type="radio" name="gender" value={g} checked={tempValue === g} onChange={() => setTempValue(g)} className="w-5 h-5 text-primary focus:ring-primary" />
                </label>
              ))}
            </div>
          );
        case 'state':
          return (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchState', lang)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary placeholder:text-slate-400 text-sm font-medium"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-1 no-scrollbar pb-1">
                {INDIAN_STATES.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTempValue(s)}
                    className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-colors ${tempValue === s
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        case 'district': {
          const selectedState = (editedProfile as any).state || (extractedProfile as any)?.state || '';
          const districts = STATE_DISTRICTS[selectedState] || [];
          return (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchState', lang).replace('state', 'district')}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary placeholder:text-slate-400 text-sm font-medium"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-1 no-scrollbar pb-1">
                {districts.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase())).map((d) => (
                  <button
                    key={d}
                    onClick={() => setTempValue(d)}
                    className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-colors ${tempValue === d
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    {d}
                  </button>
                ))}
                {districts.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No districts available for "{selectedState}"
                  </div>
                )}
              </div>
            </div>
          );
        }
        case 'name':
          return (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-800 font-medium"
              placeholder={t('fullName', lang)}
            />
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
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeSlideUp">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-900 capitalize">{getTitle()}</h3>
            <button onClick={() => setEditingField(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {renderInput()}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setEditingField(null)}
                className="flex-1 py-3.5 px-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t('actionCancel', lang)}
              </button>
              <button
                onClick={handleSave}
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

  // Hidden canvas for capturing photos
  const hiddenCanvas = <canvas ref={canvasRef} className="hidden" />;

  // ══════════════════════════════════════════════════════════════
  //  STEP 1: TUTORIAL
  // ══════════════════════════════════════════════════════════════
  if (step === 'tutorial') {
    return (
      <div className="flex flex-col h-full bg-white safe-top">
        {hiddenCanvas}
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-4 border-b border-primary/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => onNavigate(ScreenName.PROFILE_METHOD)} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg font-semibold text-primary flex-1 text-center pr-10">{t('docScanTitle', lang)}</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto no-scrollbar animate-fadeSlideUp">


          <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">{t('docScanTutorialTitle', lang)}</h2>
          <p className="text-sm text-slate-500 text-center mb-8 max-w-xs leading-relaxed">{t('docScanTutorialDesc', lang)}</p>

          {/* Steps */}
          <div className="w-full max-w-xs space-y-4 mb-8">
            {/* Step 1 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('docScanStep1Title', lang)}</p>
                <p className="text-xs text-slate-500">{t('docScanStep1Desc', lang)}</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('docScanStep2Title', lang)}</p>
                <p className="text-xs text-slate-500">{t('docScanStep2Desc', lang)}</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('docScanStep3Title', lang)}</p>
                <p className="text-xs text-slate-500">{t('docScanStep3Desc', lang)}</p>
              </div>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t('docScanPrivacy', lang)}</span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={handleStartCapture}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            <Camera className="w-5 h-5" />
            {t('docScanStart', lang)}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  FLIP ANIMATION (between front and back capture)
  // ══════════════════════════════════════════════════════════════
  if (showFlip) {
    return (
      <div className="flex flex-col h-full bg-white safe-top">
        {hiddenCanvas}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8 relative">
            <div className="w-48 h-32 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl border-2 border-primary/20 flex items-center justify-center" style={{ animation: 'flipCard 1.5s ease-in-out infinite' }}>
              <RotateCw className="w-10 h-10 text-primary/50" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('docScanFlipTitle', lang)}</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">{t('docScanFlipDesc', lang)}</p>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <Button onClick={handleFlipDone} icon>
            {t('continue', lang)}
          </Button>
        </div>

        <style>{`
          @keyframes flipCard {
            0% { transform: perspective(600px) rotateY(0deg); }
            50% { transform: perspective(600px) rotateY(90deg); }
            100% { transform: perspective(600px) rotateY(180deg); }
          }
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  STEP 2 & 3: IN-APP CAMERA (Front / Back)
  // ══════════════════════════════════════════════════════════════
  if (step === 'capture_front' || step === 'capture_back') {
    const isFront = step === 'capture_front';
    const handleCapture = isFront ? handleCaptureFront : handleCaptureBack;

    return (
      <div className="flex flex-col h-full bg-black relative safe-top">
        {hiddenCanvas}

        {/* Camera feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top bar */}
          <div className="px-4 py-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => { stopCamera(); handleRetry(); }}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                {isFront ? t('docScanFrontLabel', lang) : t('docScanBackLabel', lang)}
              </span>
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* Center: Card outline guide */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-sm aspect-[1.6/1] border-2 border-white/50 rounded-2xl relative">
              {/* Corner brackets */}
              <div className="absolute -top-0.5 -left-0.5 w-10 h-10 border-t-3 border-l-3 border-white rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-10 h-10 border-t-3 border-r-3 border-white rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-10 h-10 border-b-3 border-l-3 border-white rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-10 h-10 border-b-3 border-r-3 border-white rounded-br-xl" />

              {/* Inner instruction */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                  <p className="text-white text-xs font-semibold text-center">
                    {isFront ? t('docScanFrontHint', lang) : t('docScanBackHint', lang)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Capture button + tips */}
          <div className="bg-gradient-to-t from-black/70 to-transparent pb-8 pt-6 px-6">
            <p className="text-white/70 text-xs text-center mb-4 font-medium">{t('docScanCameraTip', lang)}</p>
            <div className="flex justify-center">
              <button
                onClick={handleCapture}
                className="w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-4 border-white/30"
                style={{ width: 72, height: 72 }}
              >
                <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-700" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  STEP 4: ANALYZING / LOADING
  // ══════════════════════════════════════════════════════════════
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col h-full bg-slate-50 safe-top">
        {hiddenCanvas}

        <div className="flex-1 flex flex-col items-center justify-center px-6">

          {/* ── Card scanning animation ──────────────────────── */}
          <div className="relative mb-10" style={{ width: 220, height: 140 }}>
            {/* Card body with captured image */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg border border-slate-200/80"
              style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
            >
              {frontImage ? (
                <img
                  src={`data:image/jpeg;base64,${frontImage}`}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.6, filter: 'blur(0.5px)' }}
                />
              ) : (
                <>
                  {/* Placeholder lines mimicking card content */}
                  <div className="absolute top-5 left-5 right-12 space-y-2.5">
                    <div className="h-2 bg-slate-200/80 rounded-full w-3/5" />
                    <div className="h-2 bg-slate-200/60 rounded-full w-4/5" />
                    <div className="h-2 bg-slate-200/40 rounded-full w-2/5" />
                  </div>
                  <div className="absolute bottom-5 left-5 space-y-2">
                    <div className="h-2 bg-slate-200/50 rounded-full w-3/4" />
                    <div className="h-2 bg-slate-200/30 rounded-full w-1/2" />
                  </div>
                  {/* Photo placeholder */}
                  <div className="absolute top-4 right-4 w-12 h-14 rounded-lg bg-slate-200/50" />
                </>
              )}
            </div>

            {/* Scan beam */}
            <div
              className="absolute left-0 right-0 h-0.5 rounded-full z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--color-primary, #2563eb), transparent)',
                boxShadow: '0 0 12px 2px var(--color-primary, #2563eb)',
                animation: 'scanBeam 2s ease-in-out infinite',
              }}
            />

            {/* Corner scan markers */}
            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />

            {/* Subtle pulse glow behind card */}
            <div
              className="absolute -inset-4 rounded-3xl -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, var(--color-primary, #2563eb) 0%, transparent 70%)',
                opacity: 0.06,
                animation: 'pulseGlow 2.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* ── AI Progress steps ────────────────────────────── */}
          <div className="w-full max-w-[260px] space-y-3 mb-8">
            {[
              { label: t('docScanLoading1', lang), delay: '0s' },
              { label: t('docScanLoading2', lang), delay: '2.5s' },
              { label: t('docScanLoading3', lang), delay: '5s' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{ animation: `stepFadeIn 500ms ease-out ${item.delay} both` }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ animation: `dotPulse 1.2s ease-in-out ${item.delay} infinite` }}
                  />
                </div>
                <p className="text-[13px] font-medium text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>

          {/* ── Powered by AI pill ───────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" className="text-primary">
              <path d="M12 1C12 1 14 8 16 10C18 12 23 12 23 12C23 12 18 12 16 14C14 16 12 23 12 23C12 23 10 16 8 14C6 12 1 12 1 12C1 12 6 12 8 10C10 8 12 1 12 1Z" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">Powered by AI</span>
          </div>
        </div>

        {/* ── Keyframes (scoped) ─────────────────────────────── */}
        <style>{`
          @keyframes scanBeam {
            0%, 100% { top: 8%; opacity: 0.3; }
            50% { top: 88%; opacity: 1; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.04; transform: scale(1); }
            50% { opacity: 0.08; transform: scale(1.05); }
          }
          @keyframes stepFadeIn {
            from { opacity: 0; transform: translateX(-8px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes dotPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.6); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  STEP 5: REVIEW EXTRACTED DATA
  // ══════════════════════════════════════════════════════════════
  if (step === 'review' && extractedProfile) {
    const fieldCount = Object.keys(extractedProfile).filter(k => (extractedProfile as any)[k]).length;

    return (
      <div className="flex flex-col h-full bg-white safe-top">
        {hiddenCanvas}
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-4 border-b border-primary/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={handleRetry} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg font-semibold text-primary flex-1 text-center pr-10">{t('docScanReviewTitle', lang)}</h1>
        </div>

        <div className="flex-1 px-5 py-6 overflow-y-auto no-scrollbar animate-fadeSlideUp">
          {/* Success header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-primary/10">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t('docScanReviewHeading', lang)}</h2>
            <p className="text-sm text-slate-500">
              {t('fieldsAutoFilled', lang).replace('{count}', String(fieldCount))}
            </p>
          </div>

          {/* Editable extracted fields */}
          <div className="space-y-3 mb-4">
            {extractedProfile.name && (
              <EditableFieldCard icon={User} label={t('fullName', lang)} value={extractedProfile.name} field="name" />
            )}
            {extractedProfile.gender && (
              <EditableFieldCard icon={Users} label={t('gender', lang)} value={extractedProfile.gender} field="gender" />
            )}
            {extractedProfile.dateOfBirth && (
              <EditableFieldCard icon={Calendar} label={t('dob', lang)} value={extractedProfile.dateOfBirth} field="dateOfBirth" />
            )}
            {extractedProfile.state && (
              <EditableFieldCard icon={MapPin} label={t('state', lang)} value={extractedProfile.state} field="state" />
            )}
            {extractedProfile.district && (
              <EditableFieldCard icon={MapPin} label={t('district', lang)} value={extractedProfile.district} field="district" />
            )}
          </div>

          {/* Tap to edit hint */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">{t('tapToEditHint', lang)}</p>
          </div>

          {/* Info banner */}
          <div className="flex gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">{t('docScanReviewInfo', lang)}</p>
          </div>
        </div>

        {/* Bottom action — single Continue button */}
        <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <Button onClick={handleContinue} icon>{t('continue', lang)}</Button>
        </div>

        {/* Edit field popup modal */}
        <EditFieldModal />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  ERROR STATE
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-white safe-top">
      {hiddenCanvas}
      <div className="px-4 py-4 flex items-center gap-4 border-b border-primary/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => onNavigate(ScreenName.PROFILE_METHOD)} className="p-2 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-semibold text-primary flex-1 text-center pr-10">{t('docScanTitle', lang)}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border-2 border-red-100">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{t('scanFailed', lang)}</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">{errorMessage || t('docScanError', lang)}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            {t('scanRetry', lang)}
          </button>
          <button
            onClick={() => onNavigate(ScreenName.PROFILE_WIZARD)}
            className="px-6 py-3 text-primary font-semibold text-sm rounded-xl border-2 border-slate-100 hover:border-primary/30 transition-colors"
          >
            {t('enterManually', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}