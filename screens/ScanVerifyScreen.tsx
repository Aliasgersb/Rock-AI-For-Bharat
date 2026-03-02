import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Camera, Check, AlertCircle, RefreshCw,
  User, Calendar, MapPin, Users, ShieldCheck, Sparkles,
  RotateCw, ChevronRight, Pencil, Loader2
} from 'lucide-react';
import { ScreenName, UserProfile } from '../types';
import { Button } from '../components/Button';
import { extractProfileFromIdCard } from '../services/ai';
import { t } from '../translations';

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
        },
        audio: false,
      });
      streamRef.current = stream;
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
    const isEditing = editingField === field;
    const currentValue = (editedProfile as any)[field] || value;

    return (
      <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-green-100 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {isEditing ? (
            <input
              type={field === 'dateOfBirth' ? 'date' : 'text'}
              value={currentValue}
              onChange={(e) => handleFieldEdit(field, e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
              autoFocus
              className="w-full text-sm font-semibold text-slate-800 border-b-2 border-primary bg-transparent outline-none py-0.5"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-800 truncate">{currentValue}</p>
          )}
        </div>
        {isEditing ? (
          <button onClick={() => setEditingField(null)} className="p-1 rounded-full hover:bg-green-50">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
          </button>
        ) : (
          <button onClick={() => setEditingField(field)} className="p-1 rounded-full hover:bg-slate-100">
            <Pencil className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        )}
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
            <div className="flex items-center gap-4 p-4 bg-green-50/60 rounded-2xl border border-green-100/60">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
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
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 text-center safe-top">
        {hiddenCanvas}
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 border-2 border-primary/10">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{t('docScanAnalyzing', lang)}</h2>
        <p className="text-sm text-slate-500 max-w-xs transition-opacity duration-300">{loadingMessage}</p>

        {/* Mini preview of captured cards */}
        <div className="flex gap-3 mt-8">
          {frontImage && (
            <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-green-200 shadow-sm">
              <img src={`data:image/jpeg;base64,${frontImage}`} alt={t('sideFront', lang)} className="w-full h-full object-cover" />
            </div>
          )}
          {backImage && (
            <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-green-200 shadow-sm">
              <img src={`data:image/jpeg;base64,${backImage}`} alt={t('sideBack', lang)} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
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
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-100">
              <Sparkles className="w-8 h-8 text-green-500" />
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