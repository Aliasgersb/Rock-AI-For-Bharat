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
  ACTION_PLAN = 'ACTION_PLAN',
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
  tradeOffs?: string[];
  tradeOffType?: TradeOffCategory;
}

export enum TradeOffCategory {
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  CO_PAYMENT_REQUIRED = 'CO_PAYMENT_REQUIRED',
  REGULAR_PREMIUM = 'REGULAR_PREMIUM',
  LOCK_IN_PERIOD = 'LOCK_IN_PERIOD',
  INCOME_CAP_STRICT = 'INCOME_CAP_STRICT',
  MANDATORY_TRAINING = 'MANDATORY_TRAINING',
  MANUAL_LABOR = 'MANUAL_LABOR',
  REGULAR_REPORTING = 'REGULAR_REPORTING',
  SPECIFIC_VENDOR_ONLY = 'SPECIFIC_VENDOR_ONLY',
  EXCLUDES_OTHER_PENSIONS = 'EXCLUDES_OTHER_PENSIONS',
  EXCLUDES_OTHER_SCHOLARSHIPS = 'EXCLUDES_OTHER_SCHOLARSHIPS',
  ONE_PER_FAMILY = 'ONE_PER_FAMILY',
  NO_GOVT_EMPLOYEES = 'NO_GOVT_EMPLOYEES',
  AGE_LIMIT_STRICT = 'AGE_LIMIT_STRICT',
  RURAL_ONLY = 'RURAL_ONLY',
  GENDER_SPECIFIC = 'GENDER_SPECIFIC',
  CASTE_CERTIFICATE_REQUIRED = 'CASTE_CERTIFICATE_REQUIRED',
  LAND_OWNERSHIP_REQUIRED = 'LAND_OWNERSHIP_REQUIRED',
  NO_PUCCA_HOUSE = 'NO_PUCCA_HOUSE',
  BUSINESS_REGISTRATION_REQUIRED = 'BUSINESS_REGISTRATION_REQUIRED',
}