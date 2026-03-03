import { Scheme, TradeOffCategory } from '../types';
import { SCHEMES_BATCH_2 } from './schemes_batch2';
import { SCHEMES_BATCH_3 } from './schemes_batch3';
import { SCHEMES_BATCH_4 } from './schemes_batch4';
import { SCHEMES_BATCH_5 } from './schemes_batch5';

export interface SchemeRule {
    ageRanges?: string[];
    states?: string[];
    occupations?: string[];
    maxIncome?: string[];
    categories?: string[];
    gender?: string[];
    education?: string[];
}

export interface SchemeEntry extends Scheme {
    eligibilityRules: SchemeRule;
}

export const SCHEMES_DATABASE: SchemeEntry[] = [
    {
        id: "pm-kisan",
        title: "PM-KISAN Samman Nidhi",
        description: "Direct income support of ₹6,000 per year to small and marginal farmer families, paid in three equal installments every four months directly to their bank accounts.",
        benefitType: "Financial",
        tags: ["agriculture", "farmer", "income"],
        eligible: true,
        amount: "₹6,000/year",
        ministry: "Ministry of Agriculture & Farmers Welfare",
        benefits: [
            { icon: "IndianRupee", title: "₹6,000 per year", description: "Paid in 3 installments of ₹2,000" },
            { icon: "Landmark", title: "Direct Bank Transfer", description: "Money sent directly to your bank account" }
        ],
        eligibilityCriteria: ["Must be a small or marginal farmer", "Must have cultivable land", "Family income below ₹2 lakh per annum", "Must have Aadhaar-linked bank account"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Land Records" }, { icon: "CreditCard", name: "Bank Passbook" }],
        officialWebsite: "https://pmkisan.gov.in",
        tradeOffType: TradeOffCategory.LAND_OWNERSHIP_REQUIRED,
        eligibilityRules: { occupations: ["Farmer"], maxIncome: ["low", "mid_low"], ageRanges: ["18_35", "36_50", "51_60", "above_60"], states: ["All"] }
    },
    {
        id: "ayushman-bharat",
        title: "Ayushman Bharat PM-JAY",
        description: "Free health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalization. Covers pre and post-hospitalization expenses.",
        benefitType: "Health Insurance",
        tags: ["health", "insurance", "hospital"],
        eligible: true,
        amount: "₹5,00,000/year",
        ministry: "Ministry of Health & Family Welfare",
        benefits: [
            { icon: "IndianRupee", title: "₹5 Lakh health cover", description: "Per family per year for hospitalization" },
            { icon: "HeartHandshake", title: "Cashless treatment", description: "At any empanelled hospital across India" }
        ],
        eligibilityCriteria: ["Family must be in SECC 2011 database", "No cap on family size or age", "Covers pre-existing diseases from day one"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Ration Card" }, { icon: "Smartphone", name: "Mobile Number" }],
        officialWebsite: "https://pmjay.gov.in",
        tradeOffType: TradeOffCategory.INCOME_CAP_STRICT,
        eligibilityRules: { maxIncome: ["low", "mid_low"], states: ["All"], ageRanges: ["All"] }
    },
    {
        id: "pm-awas-yojana",
        title: "PM Awas Yojana (Gramin/Urban)",
        description: "Financial assistance for construction of pucca houses for eligible rural and urban poor families who are homeless or living in kutcha/dilapidated houses.",
        benefitType: "Housing",
        tags: ["housing", "construction", "rural"],
        eligible: true,
        amount: "₹1.20 - ₹2.50 Lakh",
        ministry: "Ministry of Housing & Urban Affairs",
        benefits: [
            { icon: "Building", title: "₹1.20-2.50 Lakh subsidy", description: "For house construction or enhancement" },
            { icon: "IndianRupee", title: "Interest subsidy on loans", description: "Up to 6.5% on home loans" }
        ],
        eligibilityCriteria: ["Must not own a pucca house", "Annual household income below ₹3 lakh (EWS)", "Preference to SC/ST, minorities, disabled"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Income Certificate" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://pmaymis.gov.in",
        tradeOffType: TradeOffCategory.NO_PUCCA_HOUSE,
        eligibilityRules: { maxIncome: ["low", "mid_low"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60", "above_60"] }
    },
    {
        id: "ujjwala-yojana",
        title: "PM Ujjwala Yojana",
        description: "Free LPG gas connection to women from Below Poverty Line households, ensuring clean cooking fuel and reducing health hazards from smoke.",
        benefitType: "Fuel Subsidy",
        tags: ["lpg", "cooking", "women"],
        eligible: true,
        amount: "Free LPG Connection + ₹1,600",
        ministry: "Ministry of Petroleum & Natural Gas",
        benefits: [
            { icon: "IndianRupee", title: "Free LPG connection", description: "Including first refill and stove" },
            { icon: "HeartHandshake", title: "Clean cooking fuel", description: "Reduces indoor air pollution and health risks" }
        ],
        eligibilityCriteria: ["Women applicant from BPL household", "No existing LPG connection in the household", "Age must be 18 years or above"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "BPL Certificate" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://www.pmujjwalayojana.com",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC,
        eligibilityRules: { maxIncome: ["low"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60", "above_60"], gender: ["Female"] }
    },
    {
        id: "mudra-yojana",
        title: "PM MUDRA Yojana",
        description: "Collateral-free loans up to ₹10 lakh for small businesses and entrepreneurs. Three categories: Shishu (up to ₹50K), Kishore (₹50K-5L), Tarun (₹5L-10L).",
        benefitType: "Business Loan",
        tags: ["business", "loan", "entrepreneur"],
        eligible: true,
        amount: "Up to ₹10 Lakh",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "Collateral-free loans", description: "No security or guarantor needed" },
            { icon: "Briefcase", title: "Three loan categories", description: "Shishu, Kishore, and Tarun based on need" }
        ],
        eligibilityCriteria: ["Must be a non-farm small/micro enterprise", "Business should not already be funded by a bank", "Indian citizen with a viable business plan"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Business Plan" }, { icon: "CreditCard", name: "Bank Statement" }],
        officialWebsite: "https://www.mudra.org.in",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT,
        eligibilityRules: { occupations: ["Business", "Vendor", "Artisan", "GigWorker"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60"] }
    },
    {
        id: "sukanya-samriddhi",
        title: "Sukanya Samriddhi Yojana",
        description: "Government savings scheme for the girl child with high interest rate (8.2%). Parents can open account for girls under 10 years. Matures after 21 years.",
        benefitType: "Savings Scheme",
        tags: ["girl", "savings", "education"],
        eligible: true,
        amount: "8.2% Interest Rate",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "8.2% annual interest", description: "One of the highest government rates" },
            { icon: "GraduationCap", title: "Tax-free returns", description: "Under Section 80C of Income Tax Act" }
        ],
        eligibilityCriteria: ["Girl child must be below 10 years of age", "Only 2 accounts per family allowed", "Minimum deposit of ₹250 per year"],
        documents: [{ icon: "Fingerprint", name: "Birth Certificate" }, { icon: "FileText", name: "Parent's ID Proof" }, { icon: "CreditCard", name: "Address Proof" }],
        officialWebsite: "https://www.india.gov.in/sukanya-samriddhi-yojna",
        tradeOffType: TradeOffCategory.LOCK_IN_PERIOD,
        eligibilityRules: { ageRanges: ["under_18"], states: ["All"] }
    },
    {
        id: "pm-vishwakarma",
        title: "PM Vishwakarma Yojana",
        description: "Support for traditional artisans and craftsmen with toolkit, training, and collateral-free credit up to ₹3 lakh at 5% interest rate.",
        benefitType: "Skill & Credit",
        tags: ["artisan", "craft", "skill"],
        eligible: true,
        amount: "Up to ₹3 Lakh + Training",
        ministry: "Ministry of Micro, Small & Medium Enterprises",
        benefits: [
            { icon: "IndianRupee", title: "₹3 Lakh credit at 5%", description: "Collateral-free enterprise loan" },
            { icon: "Briefcase", title: "Free toolkit & training", description: "Modern tools and skill upgradation" }
        ],
        eligibilityCriteria: ["Must be engaged in one of 18 traditional trades", "Self-employed, working with hands and tools", "Not received similar benefits in last 5 years"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "Smartphone", name: "Mobile Number" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://pmvishwakarma.gov.in",
        tradeOffType: TradeOffCategory.MANDATORY_TRAINING,
        eligibilityRules: { occupations: ["Artisan", "Construction", "Worker"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60"] }
    },
    {
        id: "nrega",
        title: "MGNREGA (100 Days Work)",
        description: "Guarantees 100 days of unskilled manual work per year to every rural household. Wages are paid directly to bank accounts.",
        benefitType: "Employment",
        tags: ["employment", "rural", "wages"],
        eligible: true,
        amount: "100 days guaranteed work",
        ministry: "Ministry of Rural Development",
        benefits: [
            { icon: "Briefcase", title: "100 days guaranteed", description: "Unskilled manual work per household per year" },
            { icon: "IndianRupee", title: "Daily wages ₹200-350", description: "Varies by state, paid to bank account" }
        ],
        eligibilityCriteria: ["Must be a member of a rural household", "Willing to do unskilled manual work", "Must apply for a Job Card at Gram Panchayat"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Job Card" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://nrega.nic.in",
        tradeOffType: TradeOffCategory.MANUAL_LABOR,
        eligibilityRules: { occupations: ["Worker", "Farmer", "Unemployed", "Construction"], maxIncome: ["low", "mid_low"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60", "above_60"] }
    },
    {
        id: "pm-jan-dhan",
        title: "PM Jan Dhan Yojana",
        description: "Zero-balance bank account with free RuPay debit card, ₹2 lakh accident insurance, and ₹30,000 life insurance coverage.",
        benefitType: "Banking",
        tags: ["banking", "insurance", "account"],
        eligible: true,
        amount: "Free Bank Account + Insurance",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "Landmark", title: "Zero-balance account", description: "No minimum balance required" },
            { icon: "IndianRupee", title: "₹2 Lakh accident cover", description: "Free insurance with RuPay card" }
        ],
        eligibilityCriteria: ["Any Indian citizen above 10 years", "Must not have an existing bank account", "One account per household"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "Smartphone", name: "Mobile Number" }],
        officialWebsite: "https://pmjdy.gov.in",
        tradeOffType: TradeOffCategory.ONE_PER_FAMILY,
        eligibilityRules: { states: ["All"], ageRanges: ["All"], maxIncome: ["low", "mid_low", "mid_high"] }
    },
    {
        id: "stand-up-india",
        title: "Stand Up India",
        description: "Bank loans between ₹10 lakh and ₹1 crore to SC/ST and women entrepreneurs for setting up greenfield enterprises.",
        benefitType: "Business Loan",
        tags: ["sc", "st", "women", "business"],
        eligible: true,
        amount: "₹10 Lakh - ₹1 Crore",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "₹10L to ₹1Cr loan", description: "For greenfield manufacturing or services" },
            { icon: "Briefcase", title: "Handholding support", description: "Guidance through the entire process" }
        ],
        eligibilityCriteria: ["Must be SC/ST or a woman", "Enterprise must be greenfield (new)", "Age above 18 years"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Caste Certificate/ID" }, { icon: "FileText", name: "Business Plan" }],
        officialWebsite: "https://www.standupmitra.in",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT,
        eligibilityRules: { categories: ["SC", "ST"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60"] }
    },
    {
        id: "atal-pension",
        title: "Atal Pension Yojana",
        description: "Guaranteed monthly pension of ₹1,000 to ₹5,000 after age 60, based on contribution amount. Government co-contributes 50% for eligible subscribers.",
        benefitType: "Pension",
        tags: ["pension", "retirement", "savings"],
        eligible: true,
        amount: "₹1,000 - ₹5,000/month pension",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "Guaranteed pension", description: "₹1K-5K/month after age 60" },
            { icon: "HeartHandshake", title: "Govt co-contributes 50%", description: "For non-taxpayers who join before 40" }
        ],
        eligibilityCriteria: ["Age between 18-40 years", "Must have a savings bank account", "Must not be an income tax payer (for co-contribution)"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "CreditCard", name: "Bank Account" }, { icon: "Smartphone", name: "Mobile Number" }],
        officialWebsite: "https://www.npscra.nsdl.co.in/scheme-details.php",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_PENSIONS, eligibilityRules: { ageRanges: ["18_35", "36_50"], states: ["All"], maxIncome: ["low", "mid_low", "mid_high"] }
    },
    {
        id: "pm-suraksha-bima",
        title: "PM Suraksha Bima Yojana",
        description: "Accidental death and disability insurance of ₹2 lakh at a premium of just ₹20 per year. Renewed annually from the bank account.",
        benefitType: "Insurance",
        tags: ["insurance", "accident", "affordable"],
        eligible: true,
        amount: "₹2 Lakh cover @ ₹20/year",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "₹2 Lakh accident cover", description: "For death or permanent disability" },
            { icon: "HeartHandshake", title: "Only ₹20/year premium", description: "Most affordable insurance in India" }
        ],
        eligibilityCriteria: ["Age between 18-70 years", "Must have Aadhaar-linked bank account", "Auto-debit consent for ₹20/year"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://financialservices.gov.in/insurance-divisions/Government-Sponsored-Socially-Oriented-Insurance-Schemes/Pradhan-Mantri-Suraksha-Bima-Yojana(PMSBY)",
        tradeOffType: TradeOffCategory.REGULAR_PREMIUM, eligibilityRules: { ageRanges: ["18_35", "36_50", "51_60", "above_60"], states: ["All"] }
    },
    {
        id: "national-scholarship",
        title: "National Scholarship Portal",
        description: "Centralized portal offering various scholarships for students from SC, ST, OBC, Minority, and EWS categories across all education levels.",
        benefitType: "Scholarship",
        tags: ["education", "student", "scholarship"],
        eligible: true,
        amount: "Varies by scholarship",
        ministry: "Ministry of Education",
        benefits: [
            { icon: "GraduationCap", title: "Multiple scholarships", description: "For school, college, and professional courses" },
            { icon: "IndianRupee", title: "Direct benefit transfer", description: "Scholarship funds sent to bank account" }
        ],
        eligibilityCriteria: ["Must be a student enrolled in recognized institution", "Must belong to SC/ST/OBC/Minority/EWS category", "Family income below specified threshold"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Income Certificate" }, { icon: "FileText", name: "Caste Certificate" }],
        officialWebsite: "https://scholarships.gov.in",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS,
        eligibilityRules: { occupations: ["Student"], categories: ["SC", "ST", "OBC", "EWS"], states: ["All"], ageRanges: ["under_18", "18_35"], education: ["10th", "12th", "graduate", "post_graduate"] }
    },
    {
        id: "pm-jeevan-jyoti",
        title: "PM Jeevan Jyoti Bima Yojana",
        description: "Life insurance cover of ₹2 lakh at a premium of ₹436 per year. In case of death due to any reason, nominee receives the full amount.",
        benefitType: "Life Insurance",
        tags: ["insurance", "life", "affordable"],
        eligible: true,
        amount: "₹2 Lakh @ ₹436/year",
        ministry: "Ministry of Finance",
        benefits: [
            { icon: "IndianRupee", title: "₹2 Lakh life cover", description: "Nominee receives full amount on death" },
            { icon: "HeartHandshake", title: "Just ₹436/year", description: "Auto-debited from bank account" }
        ],
        eligibilityCriteria: ["Age between 18-50 years", "Must have Aadhaar-linked bank account"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://financialservices.gov.in/insurance-divisions/Government-Sponsored-Socially-Oriented-Insurance-Schemes/Pradhan-Mantri-Jeevan-Jyoti-Bima-Yojana(PMJJBY)",
        tradeOffType: TradeOffCategory.REGULAR_PREMIUM, eligibilityRules: { ageRanges: ["18_35", "36_50"], states: ["All"] }
    },
    {
        id: "skill-india",
        title: "Skill India Mission (PMKVY)",
        description: "Free short-term skill training (150-300 hours) with certification and placement support. Training centers available across all districts.",
        benefitType: "Skill Training",
        tags: ["skill", "training", "youth"],
        eligible: true,
        amount: "Free Training + Certificate",
        ministry: "Ministry of Skill Development",
        benefits: [
            { icon: "GraduationCap", title: "Free certified training", description: "Industry-recognized certification" },
            { icon: "Briefcase", title: "Placement assistance", description: "Job support after training completion" }
        ],
        eligibilityCriteria: ["Indian citizen aged 15-45", "Class 10 or above (for most courses)", "Not currently enrolled in formal education"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Education Certificate" }],
        officialWebsite: "https://www.pmkvyofficial.org",
        tradeOffType: TradeOffCategory.MANDATORY_TRAINING, eligibilityRules: { occupations: ["Unemployed", "Worker", "GigWorker", "Student"], ageRanges: ["under_18", "18_35", "36_50"], states: ["All"], education: ["none", "below_10", "10th", "12th"] }
    },
    {
        id: "old-age-pension",
        title: "National Old Age Pension (IGNOAPS)",
        description: "Monthly pension of ₹200-500 for senior citizens above 60 from BPL families. State governments add their own contribution on top.",
        benefitType: "Pension",
        tags: ["senior", "pension", "elderly"],
        eligible: true,
        amount: "₹200-500/month + state top-up",
        ministry: "Ministry of Rural Development",
        benefits: [
            { icon: "IndianRupee", title: "Monthly pension", description: "₹200 (60-79 yrs) / ₹500 (80+ yrs) from Centre" },
            { icon: "HeartHandshake", title: "State top-up", description: "Most states add ₹400-1500 more" }
        ],
        eligibilityCriteria: ["Age 60 years or above", "Must belong to BPL family", "Must not receive any other pension"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Age Proof" }, { icon: "FileText", name: "BPL Certificate" }],
        officialWebsite: "https://nsap.nic.in",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_PENSIONS, eligibilityRules: { ageRanges: ["above_60"], maxIncome: ["low"], states: ["All"] }
    },
    {
        id: "fasal-bima",
        title: "PM Fasal Bima Yojana",
        description: "Crop insurance scheme for farmers. Premium is just 2% for Kharif and 1.5% for Rabi crops. Full claim settlement for crop loss due to natural calamities.",
        benefitType: "Crop Insurance",
        tags: ["farmer", "insurance", "crop"],
        eligible: true,
        amount: "Full crop value coverage",
        ministry: "Ministry of Agriculture & Farmers Welfare",
        benefits: [
            { icon: "IndianRupee", title: "Low premium (1.5-2%)", description: "Government pays remaining premium" },
            { icon: "HeartHandshake", title: "Full claim on crop loss", description: "Covers natural disasters, pests, diseases" }
        ],
        eligibilityCriteria: ["Must be a farmer (landowner or tenant)", "Crop must be notified under the scheme", "Must enroll before sowing season deadline"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "FileText", name: "Land Records" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://pmfby.gov.in",
        tradeOffType: TradeOffCategory.REGULAR_PREMIUM, eligibilityRules: { occupations: ["Farmer"], states: ["All"], ageRanges: ["18_35", "36_50", "51_60", "above_60"] }
    },
    {
        id: "e-shram",
        title: "e-Shram Card (NDUW)",
        description: "Registration portal for unorganized workers. Provides a unique Universal Account Number (UAN) and ₹2 lakh accidental insurance coverage.",
        benefitType: "Worker Registration",
        tags: ["worker", "unorganized", "registration"],
        eligible: true,
        amount: "₹2 Lakh accident cover + UAN",
        ministry: "Ministry of Labour & Employment",
        benefits: [
            { icon: "IndianRupee", title: "₹2 Lakh accident cover", description: "Free accidental insurance for registered workers" },
            { icon: "Briefcase", title: "Access to welfare schemes", description: "UAN links you to government benefits" }
        ],
        eligibilityCriteria: ["Age between 16-59 years", "Must be an unorganized sector worker", "Must not be a member of EPFO or ESIC"],
        documents: [{ icon: "Fingerprint", name: "Aadhaar Card" }, { icon: "Smartphone", name: "Mobile Number" }, { icon: "CreditCard", name: "Bank Account" }],
        officialWebsite: "https://eshram.gov.in",
        tradeOffType: TradeOffCategory.REGULAR_PREMIUM, eligibilityRules: { occupations: ["Worker", "Construction", "Driver", "Vendor", "GigWorker", "Homemaker", "Artisan"], ageRanges: ["under_18", "18_35", "36_50", "51_60"], states: ["All"] }
    }
];

// Merge all batches into one unified database
export const ALL_SCHEMES: SchemeEntry[] = [
    ...SCHEMES_DATABASE,
    ...SCHEMES_BATCH_2,
    ...SCHEMES_BATCH_3,
    ...SCHEMES_BATCH_4,
    ...SCHEMES_BATCH_5,
];
