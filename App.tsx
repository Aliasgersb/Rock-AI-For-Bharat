import React, { useState, useEffect } from 'react';
import { ScreenName, UserProfile, INITIAL_PROFILE, Scheme } from './types';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileMethodScreen from './screens/ProfileMethodScreen';
import ProfileWizardScreen from './screens/ProfileWizardScreen';
import ScanVerifyScreen from './screens/ScanVerifyScreen';
import AnalyzingScreen from './screens/AnalyzingScreen';
import DashboardScreen from './screens/DashboardScreen';
import SchemeDetailsScreen from './screens/SchemeDetailsScreen';
import CompareScreen from './screens/CompareScreen';
import HistoryScreen from './screens/HistoryScreen';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('janSaarthi_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch (e) {
      return INITIAL_PROFILE;
    }
  });

  const [schemes, setSchemes] = useState<Scheme[]>(() => {
    try {
      const saved = localStorage.getItem('janSaarthi_schemes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('janSaarthi_saved_schemes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenName>(() => {
    try {
      const savedProfile = localStorage.getItem('janSaarthi_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        // Check if critical fields exist to consider profile "made" and ready for dashboard
        // We assume if they have a state and mobile, they've gone through the wizard/scan
        if (parsed.mobile && parsed.state && parsed.district) {
          return ScreenName.DASHBOARD;
        }
        // If they have at least logged in
        if (parsed.mobile) {
          return ScreenName.PROFILE_METHOD;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return ScreenName.WELCOME;
  });

  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    localStorage.setItem('janSaarthi_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('janSaarthi_schemes', JSON.stringify(schemes));
  }, [schemes]);

  useEffect(() => {
    localStorage.setItem('janSaarthi_saved_schemes', JSON.stringify(Array.from(savedSchemeIds)));
  }, [savedSchemeIds]);

  const toggleSaveScheme = (id: string) => {
    setSavedSchemeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const navigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case ScreenName.WELCOME:
        return <WelcomeScreen onNavigate={navigate} updateProfile={updateProfile} />;
      case ScreenName.LOGIN:
        return <LoginScreen onNavigate={navigate} updateProfile={updateProfile} userProfile={userProfile} />;
      case ScreenName.PROFILE_METHOD:
        return <ProfileMethodScreen onNavigate={navigate} userProfile={userProfile} />;
      case ScreenName.SCAN_VERIFY:
        return <ScanVerifyScreen onNavigate={navigate} userProfile={userProfile} updateProfile={updateProfile} />;
      case ScreenName.PROFILE_WIZARD:
        return <ProfileWizardScreen onNavigate={navigate} updateProfile={updateProfile} userProfile={userProfile} />;
      case ScreenName.ANALYZING:
        return <AnalyzingScreen onNavigate={navigate} userProfile={userProfile} setSchemes={setSchemes} />;
      case ScreenName.DASHBOARD:
        return <DashboardScreen onNavigate={navigate} userProfile={userProfile} schemes={schemes} setSchemes={setSchemes} setSelectedScheme={setSelectedScheme} updateProfile={updateProfile} savedSchemeIds={savedSchemeIds} toggleSaveScheme={toggleSaveScheme} />;
      case ScreenName.SCHEME_DETAILS:
        return <SchemeDetailsScreen onNavigate={navigate} scheme={selectedScheme} userProfile={userProfile} updateProfile={updateProfile} savedSchemeIds={savedSchemeIds} toggleSaveScheme={toggleSaveScheme} />;
      case ScreenName.COMPARE_SCHEMES:
        return <CompareScreen onNavigate={navigate} schemes={schemes} userProfile={userProfile} />;
      case ScreenName.HISTORY:
        return <HistoryScreen onNavigate={navigate} schemes={schemes} userProfile={userProfile} setSelectedScheme={setSelectedScheme} />;
      default:
        return <WelcomeScreen onNavigate={navigate} updateProfile={updateProfile} />;
    }
  };

  return (
    <div className="w-full h-full font-sans text-slate-800 selection:bg-primary/20">
      <div className="w-full h-full overflow-hidden bg-surface">
        <div key={currentScreen} className="w-full h-full screen-enter">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}