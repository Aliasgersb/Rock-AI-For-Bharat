export enum ScreenName {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  PROFILE_METHOD = 'PROFILE_METHOD',
  PROFILE_WIZARD = 'PROFILE_WIZARD',
  SCAN_VERIFY = 'SCAN_VERIFY',
  ANALYZING = 'ANALYZING',
  DASHBOARD = 'DASHBOARD',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  SCHEME_DETAILS = 'SCHEME_DETAILS',
  COMPARE_SCHEMES = 'COMPARE_SCHEMES',
  HISTORY = 'HISTORY',
}

export interface UserProfile {
  name: string;
  mobile: string;
  gender?: string;
  dateOfBirth?: string; // ISO format: YYYY-MM-DD
  state?: string;
  district?: string;
  occupation?: string;
  education?: string;
  income?: string;
  category?: string;
  language: string;
  profileImage?: string;
}

export const INITIAL_PROFILE: UserProfile = {
  name: 'Rajesh Kumar',
  mobile: '',
  language: 'English',
};

export interface Scheme {
  id: string;
  title: string;
  description: string;
  benefitType: string;
  tags: string[];
  eligible: boolean;
  amount?: string;
  ministry?: string;
  benefits?: { icon: string; title: string; description: string }[];
  eligibilityCriteria?: string[];
  documents?: { icon: string; name: string }[];
  officialWebsite?: string;
}