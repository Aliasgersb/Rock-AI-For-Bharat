import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fs from 'fs';
import { TradeOffCategory } from '../types';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

                if (key.startsWith('VITE_AWS_')) {
                    process.env[key.replace('VITE_', '')] = value;
                } else {
                    process.env[key] = value;
                }
            }
        });
        console.log("Loaded environment variables for resumption.");
    } catch (e) {
        console.log("No .env.local found:", e.message);
    }
};

loadEnv();

const config: any = { region: process.env.AWS_REGION || 'ap-south-1' };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}
const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

// Copying the exact same BASE_SCHEMES array from harvester.ts
const BASE_SCHEMES = [
    {
        baseId: "state-cm-relief",
        title: "Chief Minister's Relief Fund ({State})",
        desc: "Provides immediate financial assistance to individuals affected by natural calamities, major accidents, and for critical medical treatments like heart surgeries, kidney transplants, and cancer in {State}.",
        type: "Financial Aid",
        tags: ["relief", "medical", "financial_aid", "state_fund"],
        amount: "Up to ₹2,000,00",
        min: "State Government of {State}",
        beni: [
            { icon: "HeartPulse", title: "Medical Assistance", description: "Coverage for major surgeries and treatments" },
            { icon: "AlertTriangle", title: "Calamity Relief", description: "Disaster compensation" }
        ],
        crit: ["Resident of {State}", "Requires medical certificate/calamity proof", "Low income families prioritized"],
        docs: ["Aadhaar Card", "Income Certificate", "Medical Recommendation/Police FIR"],
        url: "https://{StateForUrl}.gov.in/cmrf",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { states: ["{State}"], maxIncome: ["low", "mid_low"], ageRanges: ["All"] }
    },
    {
        baseId: "state-girl-child",
        title: "{State} Kanya Vidya Dhan Yojana",
        desc: "Financial incentive provided by the {State} Government to meritorious girl students who have passed their 12th standard exams, encouraging higher education and preventing early marriages.",
        type: "Education Scholarship",
        tags: ["education", "girl_child", "scholarship", "merit"],
        amount: "₹30,000 one-time",
        min: "Department of Education, {State}",
        beni: [
            { icon: "GraduationCap", title: "Financial Reward", description: "One-time grant for higher studies" }
        ],
        crit: ["Girl student resident of {State}", "Passed Class 12th from State Board", "BPL family"],
        docs: ["Aadhaar Card", "12th Marksheet", "Income Certificate", "Bank Passbook"],
        url: "https://education.{StateForUrl}.gov.in/kanya",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS, rules: { states: ["{State}"], maxIncome: ["low"], ageRanges: ["18_35"], gender: ["Female"], education: ["12th Pass"] }
    },
    {
        baseId: "state-old-age",
        title: "{State} Senior Citizen Pension Scheme",
        desc: "Monthly financial assistance for destitute elders above 60 years of age living in {State} to ensure they can meet their basic needs and medicine costs.",
        type: "Pension",
        tags: ["pension", "senior_citizen", "old_age"],
        amount: "₹1,000 - ₹2,500/month",
        min: "Department of Social Justice, {State}",
        beni: [
            { icon: "HandHeart", title: "Monthly Pension", description: "Transferred directly to bank account" }
        ],
        crit: ["Age 60 or above", "Permanent resident of {State}", "No regular source of income/BPL"],
        docs: ["Age Proof (Aadhaar/Voter ID)", "Domicile Certificate", "Bank Account"],
        url: "https://socialwelfare.{StateForUrl}.gov.in/pension",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_PENSIONS, rules: { states: ["{State}"], ageRanges: ["above_60"], maxIncome: ["low"] }
    },
    {
        baseId: "state-farmer-debt",
        title: "{State} Kisan Karz Mafi Yojana",
        desc: "A state-level agricultural debt waiver scheme in {State} to relieve small and marginal farmers from the burden of crop loans taken from cooperative banks.",
        type: "Agricultural Waiver",
        tags: ["agriculture", "farmer", "loan_waiver"],
        amount: "Up to ₹1,000,000 waived",
        min: "Department of Agriculture, {State}",
        beni: [
            { icon: "IndianRupee", title: "Loan Waiver", description: "Outstanding crop loan cleared up to Rs 1 Lakh" }
        ],
        crit: ["Small/Marginal farmer in {State}", "Loan taken from cooperative/rural banks"],
        docs: ["Aadhaar Card", "Land Records (Khasra/Khatauni)", "Bank Loan Statement"],
        url: "https://agri.{StateForUrl}.gov.in/karzmafi",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { states: ["{State}"], occupations: ["Farmer"], maxIncome: ["low", "mid_low"] }
    },
    {
        baseId: "state-unemployment",
        title: "{State} Berozgari Bhatta (Unemployment Allowance)",
        desc: "Provides monthly financial allowance to educated but unemployed youth in {State} to support them while they search for suitable jobs or prepare for competitive exams.",
        type: "Financial Allowance",
        tags: ["unemployment", "youth", "allowance"],
        amount: "₹1,500 - ₹3,000/month",
        min: "Employment Exchange, {State}",
        beni: [
            { icon: "Briefcase", title: "Monthly Allowance", description: "Direct bank transfer for up to 2 years" }
        ],
        crit: ["Registered with {State} Employment Exchange", "Minimum 12th pass", "Age 21-35 years", "Unemployed"],
        docs: ["Aadhaar Card", "Employment Registration Card", "Education Certificates"],
        url: "https://employment.{StateForUrl}.gov.in",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { states: ["{State}"], ageRanges: ["18_35"], education: ["12th Pass", "Graduate / Diploma", "Post Graduate & above"], occupations: ["Unemployed"], maxIncome: ["low"] }
    },
    {
        baseId: "state-widow-pension",
        title: "{State} Vidhwa Pension Yojana",
        desc: "Financial security for widows living below the poverty line in {State}, aimed at making them self-reliant and providing for their daily living expenses.",
        type: "Pension",
        tags: ["widow", "pension", "women_empowerment"],
        amount: "₹1,000 - ₹1,500/month",
        min: "Department of Women and Child Development, {State}",
        beni: [
            { icon: "Banknote", title: "Direct Transfer", description: "Monthly pension deposited to bank" }
        ],
        crit: ["Widow above 18 years of age", "Resident of {State}", "BPL Category"],
        docs: ["Husband's Death Certificate", "Income Certificate", "Aadhaar Card"],
        url: "https://wcd.{StateForUrl}.gov.in/widow-pension",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_PENSIONS, rules: { states: ["{State}"], gender: ["Female"], maxIncome: ["low"], ageRanges: ["18_35", "36_50", "51_60", "above_60"] }
    },
    {
        baseId: "state-disabled-pension",
        title: "{State} Divyang Pension Scheme",
        desc: "State-funded monthly pension to support persons with severe disabilities (40% or more) in {State} for their livelihood and medical needs.",
        type: "Pension",
        tags: ["disability", "pension", "medical"],
        amount: "₹1,000 - ₹2,000/month",
        min: "Department of Social Justice, {State}",
        beni: [
            { icon: "Accessibility", title: "Financial Support", description: "Monthly pension" }
        ],
        crit: ["Minimum 40% disability", "Resident of {State}", "Low income"],
        docs: ["Disability Certificate (UDID)", "Aadhaar Card", "Bank Account"],
        url: "https://socialjustice.{StateForUrl}.gov.in/divyang",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_PENSIONS, rules: { states: ["{State}"], maxIncome: ["low", "mid_low"], ageRanges: ["All"] }
    },
    {
        baseId: "state-housing-repair",
        title: "{State} Chief Minister Awas Marammat Yojana",
        desc: "Financial aid provided to BPL families in {State} for the repair and maintenance of dilapidated un-pucca houses to ensure safe shelter.",
        type: "Housing",
        tags: ["housing", "repair", "infrastructure"],
        amount: "₹50,000",
        min: "Housing Board, {State}",
        beni: [
            { icon: "Home", title: "Repair Grant", description: "One time grant for roof/wall repairs" }
        ],
        crit: ["Must own a kutcha house", "BPL resident of {State}", "Not availed PM Awas Yojana recently"],
        docs: ["House Photos", "BPL Card", "Aadhaar Card"],
        url: "https://housing.{StateForUrl}.gov.in/marammat",
        tradeOffType: TradeOffCategory.NO_PUCCA_HOUSE, rules: { states: ["{State}"], maxIncome: ["low"], ageRanges: ["All"] }
    },
    {
        baseId: "state-agriculture-equipment",
        title: "{State} Krishi Yantra Subsidy Yojana",
        desc: "Subsidizes the purchase of modern agricultural equipment (like tractors, seed drills, rotavators) for farmers in {State} to boost agricultural productivity.",
        type: "Agriculture Subsidy",
        tags: ["agriculture", "equipment", "farmer", "subsidy"],
        amount: "40% to 50% Subsidy",
        min: "Department of Agriculture, {State}",
        beni: [
            { icon: "Tractor", title: "Equipment Subsidy", description: "Discounts on authorized farm machinery" }
        ],
        crit: ["Registered farmer in {State}", "Must own agricultural land"],
        docs: ["Land Records", "Aadhaar Card", "Quotation of Equipment"],
        url: "https://agri.{StateForUrl}.gov.in/yantra",
        tradeOffType: TradeOffCategory.LAND_OWNERSHIP_REQUIRED, rules: { occupations: ["Farmer"], states: ["{State}"], maxIncome: ["low", "mid_low", "high"] }
    },
    {
        baseId: "state-obc-scholarship",
        title: "{State} Post-Matric Scholarship for OBC",
        desc: "Covers tuition fees and provides a maintenance allowance to students belonging to Other Backward Classes (OBC) studying at post-matriculation or post-secondary stages in {State}.",
        type: "Scholarship",
        tags: ["education", "obc", "scholarship", "students"],
        amount: "Tuition Fee + Maintenance Allowance",
        min: "Backward Classes Welfare Department, {State}",
        beni: [
            { icon: "BookOpen", title: "Fee Reimbursement", description: "College tuition covered" }
        ],
        crit: ["Belong to OBC category", "Resident of {State}", "Family income below ₹2.5 Lakh/annum"],
        docs: ["OBC Caste Certificate", "Income Certificate", "Previous Year Marksheet"],
        url: "https://obcwelfare.{StateForUrl}.gov.in/scholarship",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS, rules: { categories: ["OBC", "MBC"], education: ["10th Pass", "12th Pass", "Graduate / Diploma"], states: ["{State}"], maxIncome: ["low"] }
    },
    {
        baseId: "state-scst-startup",
        title: "{State} SC/ST Entrepreneurship Fund",
        desc: "Provides margin money subsidy and low-interest loans to SC/ST youth in {State} to set up micro and small manufacturing or service enterprises.",
        type: "Business Loan/Subsidy",
        tags: ["business", "sc_st", "entrepreneurship", "startup"],
        amount: "Up to ₹25 Lakhs Loan",
        min: "Department of SC/ST Welfare, {State}",
        beni: [
            { icon: "Store", title: "Capital Subsidy", description: "25% to 35% margin money subsidy" }
        ],
        crit: ["SC/ST Category", "Age 18-45 years", "Resident of {State}"],
        docs: ["Caste Certificate", "Project Report", "Aadhaar Card"],
        url: "https://scstwelfare.{StateForUrl}.gov.in/startup",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { categories: ["SC", "ST"], ageRanges: ["18_35", "36_50"], occupations: ["Business", "Unemployed"], states: ["{State}"] }
    },
    {
        baseId: "state-marriage-grant",
        title: "{State} Shadi Shagun / Vivah Anudan Yojana",
        desc: "Financial assistance given to BPL families in {State} for the marriage of their daughters, aimed at preventing child marriages and supporting poor families.",
        type: "Financial Aid",
        tags: ["marriage", "women", "financial_aid"],
        amount: "₹51,000",
        min: "Social Welfare Department, {State}",
        beni: [
            { icon: "Gift", title: "Marriage Grant", description: "Lump sum amount given near marriage date" }
        ],
        crit: ["Bride's age > 18, Groom's age > 21", "Family income below poverty line", "Resident of {State}"],
        docs: ["Age Proof of Bride & Groom", "Income Certificate", "Wedding Card/Proof"],
        url: "https://socialwelfare.{StateForUrl}.gov.in/vivah",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { maxIncome: ["low"], states: ["{State}"], ageRanges: ["18_35"] }
    },
    {
        baseId: "state-animal-husbandry",
        title: "{State} Pashupalan / Dairy Loan Subsidy",
        desc: "Promotes dairy farming and animal husbandry in {State} by providing subsidies on loans taken for purchasing milch animals (cows, buffaloes) and building cattle sheds.",
        type: "Agriculture Subsidy",
        tags: ["dairy", "agriculture", "loan", "farmer"],
        amount: "50% Subsidy on Loan",
        min: "Department of Animal Husbandry, {State}",
        beni: [
            { icon: "Cow", title: "Dairy Support", description: "Subsidy for purchasing 2 to 10 cattle" }
        ],
        crit: ["Resident of {State}", "Availability of space/fodder for cattle"],
        docs: ["Aadhaar Card", "Bank Loan Sanction Letter", "Land Proof"],
        url: "https://ahd.{StateForUrl}.gov.in/dairy",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { occupations: ["Farmer", "Business"], states: ["{State}"], maxIncome: ["low", "mid_low", "high"] }
    },
    {
        baseId: "state-solar-pump",
        title: "{State} Solar Irrigation Pump Scheme",
        desc: "Subsidized distribution of solar agricultural pumps to farmers in {State} to safely irrigate fields without depending on erratic grid electricity.",
        type: "Agriculture Subsidy",
        tags: ["solar", "agriculture", "irrigation"],
        amount: "Up to 75% Subsidy",
        min: "Renewable Energy Development Agency, {State}",
        beni: [
            { icon: "Sun", title: "Solar Pump", description: "Highly subsidized solar water pump" }
        ],
        crit: ["Farmer owning land in {State}", "Source of water (borewell/surface water) available"],
        docs: ["Land Records", "Aadhaar Card", "Bank Account"],
        url: "https://energy.{StateForUrl}.gov.in/solar-pump",
        tradeOffType: TradeOffCategory.LAND_OWNERSHIP_REQUIRED, rules: { occupations: ["Farmer"], states: ["{State}"] }
    },
    {
        baseId: "state-weaver-support",
        title: "{State} Handloom Weaver Samman Yojana",
        desc: "Financial assistance and raw material subsidy for registered handloom weavers in {State} to preserve local crafts and support their livelihood.",
        type: "Financial Aid",
        tags: ["weaver", "artisan", "handloom", "subsidy"],
        amount: "₹10,000/year",
        min: "Directorate of Handlooms & Textiles, {State}",
        beni: [
            { icon: "Scissors", title: "Annual Grant", description: "Direct support for purchasing yarn" }
        ],
        crit: ["Registered Weaver in {State}", "Primary income from handloom"],
        docs: ["Weaver ID Card", "Aadhaar", "Bank Account"],
        url: "https://textiles.{StateForUrl}.gov.in/weavers",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { occupations: ["Artisan", "Worker", "Business"], states: ["{State}"], maxIncome: ["low", "mid_low"] }
    },
    {
        baseId: "state-sports-scholarship",
        title: "{State} Outstanding Sportsperson Scholarship",
        desc: "Monthly stipend for youths in {State} who have won medals at State, National, or International level sporting events to support their diet and training.",
        type: "Scholarship",
        tags: ["sports", "youth", "scholarship"],
        amount: "₹2,000 - ₹10,000/month",
        min: "Sports Authority of {State}",
        beni: [
            { icon: "Medal", title: "Monthly Stipend", description: "Depends on medal level" }
        ],
        crit: ["Resident of {State}", "Age under 25", "Medal winner in recognized sports"],
        docs: ["Sports Certificates", "Aadhaar Card", "Age Proof"],
        url: "https://sports.{StateForUrl}.gov.in/scholarship",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS, rules: { ageRanges: ["under_18", "18_35"], education: ["10th Pass", "12th Pass", "Student"], states: ["{State}"] }
    },
    {
        baseId: "state-maternity-benefit",
        title: "{State} Matritva Vandana / Pregnant Women Aid",
        desc: "Provides conditional cash transfer to pregnant and lactating mothers in {State} to partially compensate for wage loss and ensure proper nutrition during pregnancy.",
        type: "Health & Nutrition",
        tags: ["women", "health", "maternity", "pregnancy"],
        amount: "₹5,000 to ₹6,000",
        min: "Department of Health, {State}",
        beni: [
            { icon: "Baby", title: "Maternity Cash", description: "Paid in 3 installments during and after pregnancy" }
        ],
        crit: ["Pregnant/Lactating woman", "Resident of {State}", "Not a regular govt employee"],
        docs: ["MCP Card (Mother Child Protection)", "Aadhaar Card", "Bank Account"],
        url: "https://health.{StateForUrl}.gov.in/maternity",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC, rules: { gender: ["Female"], ageRanges: ["18_35", "36_50"], states: ["{State}"], maxIncome: ["low", "mid_low"] }
    },
    {
        baseId: "state-electric-vehicle",
        title: "{State} EV Subsidy Policy",
        desc: "Upfront direct subsidy on the purchase of new 2-wheeler and 4-wheeler Electric Vehicles (EVs) registered in {State} to promote green transport.",
        type: "Subsidy",
        tags: ["ev", "transport", "environment", "subsidy"],
        amount: "₹5,000 to ₹1,50,000 Subsidy",
        min: "Transport Department, {State}",
        beni: [
            { icon: "Car", title: "Purchase Discount", description: "Based on battery capacity (kWh)" }
        ],
        crit: ["Purchasing a new EV in {State}", "Registered with {State} RTO"],
        docs: ["Aadhaar", "Vehicle Invoice", "Bank Details"],
        url: "https://transport.{StateForUrl}.gov.in/ev-policy",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { states: ["{State}"], occupations: ["All"], ageRanges: ["18_35", "36_50", "51_60", "above_60"], maxIncome: ["All"] }
    },
    {
        baseId: "state-street-vendor",
        title: "{State} Rehri-Patri / Street Vendor Micro Loan",
        desc: "Working capital loan for street vendors, hawkers, and theles-walas in {State} to restart or expand their marginal businesses at subsidized interest rates.",
        type: "Business Loan",
        tags: ["vendor", "business", "loan", "urban"],
        amount: "₹10,000 - ₹20,000 Loan",
        min: "Urban Local Bodies, {State}",
        beni: [
            { icon: "Store", title: "Working Capital", description: "Collateral-free micro loan" }
        ],
        crit: ["Registered Street Vendor in {State}", "Possess Vending Certificate/ID"],
        docs: ["Vendor ID Card/ULB Certificate", "Aadhaar Card"],
        url: "https://urban.{StateForUrl}.gov.in/vendors",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { occupations: ["Vendor"], states: ["{State}"] }
    },
    {
        baseId: "state-girl-laptop",
        title: "{State} Free Laptop/Tablet for Meritorious Students",
        desc: "The {State} government provides free laptops or tablets to students who score above a certain cutoff in their 10th or 12th board exams to bridge the digital divide.",
        type: "Education Device",
        tags: ["education", "students", "digital", "laptop"],
        amount: "Free Laptop/Tablet",
        min: "Department of Education, {State}",
        beni: [
            { icon: "Laptop", title: "Free Device", description: "Loaded with educational content" }
        ],
        crit: ["Passed 10th/12th from {State} Board", "Scored > 75% marks (General) or > 65% (Reserved)"],
        docs: ["Marksheet", "Domicile Certificate", "Aadhaar Card"],
        url: "https://education.{StateForUrl}.gov.in/laptop",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS, rules: { education: ["10th Pass", "12th Pass", "Student"], ageRanges: ["under_18", "18_35"], states: ["{State}"] }
    },
    {
        baseId: "state-orphan-care",
        title: "{State} Mukhyamantri Bal Ashirwad Yojana",
        desc: "Provides financial aid, free health insurance, and free school education to orphan children in {State} until they turn 18.",
        type: "Child Welfare",
        tags: ["orphan", "child_welfare", "education"],
        amount: "₹2,000/month",
        min: "Department of Women & Child Development, {State}",
        beni: [
            { icon: "Baby", title: "Monthly Allowance", description: "For foster parents/guardians" }
        ],
        crit: ["Orphan child under 18 years", "Resident of {State}"],
        docs: ["Death Certificates of Parents", "Aadhaar of Child/Guardian"],
        url: "https://wcd.{StateForUrl}.gov.in/orphan",
        tradeOffType: TradeOffCategory.REGULAR_PREMIUM, rules: { ageRanges: ["under_18"], states: ["{State}"], maxIncome: ["low", "mid_low", "high"] }
    },
    {
        baseId: "state-labour-maternity",
        title: "{State} Nirman Shramik Matritva Sahayata",
        desc: "Registered women construction workers in {State} get delivery assistance and nutrition support during childbirth.",
        type: "Health & Welfare",
        tags: ["worker", "construction", "maternity", "women"],
        amount: "₹20,000",
        min: "Labour Welfare Board, {State}",
        beni: [
            { icon: "HardHat", title: "Maternity Benefit", description: "Lump sum financial assistance" }
        ],
        crit: ["Registered female construction worker", "Resident of {State}"],
        docs: ["Labour Card", "Hospital Discharge Summary", "Aadhaar"],
        url: "https://labour.{StateForUrl}.gov.in/maternity",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC, rules: { occupations: ["Worker", "Construction"], gender: ["Female"], states: ["{State}"], maxIncome: ["low"] }
    },
    {
        baseId: "state-free-electricity",
        title: "{State} BPL Free Electricity Scheme (Up to 100 Units)",
        desc: "Provides 100 units of free electricity every month to Below Poverty Line (BPL) families in {State}, reducing their cost of living.",
        type: "Utility Subsidy",
        tags: ["electricity", "bpl", "subsidy"],
        amount: "100 Units Free/Month",
        min: "Department of Energy, {State}",
        beni: [
            { icon: "Zap", title: "Bill Zeroing", description: "Bills up to 100 units are waived completely" }
        ],
        crit: ["BPL Card Holder", "Domestic electricity connection in {State}"],
        docs: ["Electricity Bill", "BPL Ration Card"],
        url: "https://power.{StateForUrl}.gov.in/free-units",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { maxIncome: ["low"], states: ["{State}"], ageRanges: ["All"], occupations: ["All"] }
    },
    {
        baseId: "state-intercaste-marriage",
        title: "{State} Inter-Caste Marriage Incentive",
        desc: "To promote social integration and remove untouchability, the {State} government provides a cash incentive to couples opting for inter-caste marriage (where one spouse is SC).",
        type: "Financial Reward",
        tags: ["marriage", "social_welfare", "sc"],
        amount: "₹2,50,000",
        min: "Department of Social Justice, {State}",
        beni: [
            { icon: "HeartHandshake", title: "Joint Account Deposit", description: "Fixed deposit in joint name of the couple" }
        ],
        crit: ["Legally married couple in {State}", "One spouse must belong to Scheduled Caste (SC)"],
        docs: ["Marriage Certificate", "Caste Certificate of SC spouse", "Joint Bank Account"],
        url: "https://socialjustice.{StateForUrl}.gov.in/intercaste",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { states: ["{State}"], categories: ["SC", "General", "OBC"], ageRanges: ["18_35", "36_50"] }
    },
    {
        baseId: "state-self-help-group",
        title: "{State} Mahila SHG Revolving Fund",
        desc: "Provides a revolving fund and community investment fund to Women Self Help Groups (SHGs) in {State} to encourage internal lending and micro-enterprises.",
        type: "Business Grant",
        tags: ["women", "business", "shg", "rural"],
        amount: "₹15,000 to ₹50,000/SHG",
        min: "State Rural Livelihood Mission, {State}",
        beni: [
            { icon: "Users", title: "Group Funding", description: "Seed capital for the SHG" }
        ],
        crit: ["Registered Women SHG in {State}", "Minimum 6 months of active saving/internal lending"],
        docs: ["SHG Registration", "SHG Bank Passbook"],
        url: "https://srlm.{StateForUrl}.gov.in/shg-fund",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC, rules: { gender: ["Female"], states: ["{State}"], ageRanges: ["18_35", "36_50", "51_60"] }
    },
    {
        baseId: "state-coaching-scheme",
        title: "{State} Mukhyamantri Anuprati / Free Coaching Scheme",
        desc: "Provides free coaching and accommodation stipend to meritorious students of SC/ST/OBC/EWS categories in {State} preparing for UPSC, State PSC, NEET, and JEE.",
        type: "Education Support",
        tags: ["education", "coaching", "students", "sc_st"],
        amount: "Free Coaching + ₹40,000 Stipend",
        min: "Tribal/Social Justice Department, {State}",
        beni: [
            { icon: "BookOpen", title: "Fee Waiver", description: "Coaching fees paid directly to institutes" }
        ],
        crit: ["SC/ST/OBC/EWS Resident of {State}", "Minimum marks criteria in 10th/12th/Graduation"],
        docs: ["Aadhaar", "Marksheets", "Caste Certificate", "Income Certificate"],
        url: "https://socialjustice.{StateForUrl}.gov.in/coaching",
        tradeOffType: TradeOffCategory.EXCLUDES_OTHER_SCHOLARSHIPS, rules: { states: ["{State}"], categories: ["SC", "ST", "OBC", "EWS"], education: ["10th Pass", "12th Pass", "Graduate / Diploma", "Student"], ageRanges: ["under_18", "18_35"] }
    },
    {
        baseId: "state-artisan-credit",
        title: "{State} Shilpi/Artisan Credit Card Scheme",
        desc: "Working capital loan at highly concessional interest rates for handicrafts and handloom artisans in {State} to buy raw materials freely.",
        type: "Business Loan",
        tags: ["artisan", "business", "loan", "crafts"],
        amount: "Up to ₹2,00,000 limit",
        min: "Department of Industries, {State}",
        beni: [
            { icon: "CreditCard", title: "Credit Card", description: "Revolving credit facility for artisans" }
        ],
        crit: ["Registered artisan/craftsman in {State}", "Possess Pehchan Card/Artisan ID"],
        docs: ["Artisan ID", "Aadhaar Card", "Bank Account"],
        url: "https://industries.{StateForUrl}.gov.in/artisan-credit",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { occupations: ["Artisan"], states: ["{State}"] }
    },
    {
        baseId: "state-tractor-subsidy",
        title: "{State} Mukhyamantri Tractor Scheme",
        desc: "Direct subsidy provided to farmer groups or individuals in {State} for purchasing tractors up to 35 PTO HP.",
        type: "Agriculture Subsidy",
        tags: ["agriculture", "farmer", "tractor"],
        amount: "₹1,00,000 Subsidy",
        min: "Department of Agriculture, {State}",
        beni: [
            { icon: "Tractor", title: "Purchase Discount", description: "Flat subsidy on ex-showroom price" }
        ],
        crit: ["Farmer in {State}", "Must have minimum 2 acres of land", "Not purchased a tractor in last 7 years"],
        docs: ["Jamabandi/Land Proof", "Aadhaar Card", "Driving License"],
        url: "https://agri.{StateForUrl}.gov.in/tractor",
        tradeOffType: TradeOffCategory.LAND_OWNERSHIP_REQUIRED, rules: { occupations: ["Farmer"], states: ["{State}"] }
    },
    {
        baseId: "state-fisheries",
        title: "{State} Matsya Sampada / Fishermen Boat Subsidy",
        desc: "Subsidy for traditional fishermen in {State} to upgrade their boats, buy fishing nets, and install safety equipment.",
        type: "Agriculture/Fisheries",
        tags: ["fisheries", "farmer", "boat", "subsidy"],
        amount: "60% Subsidy",
        min: "Department of Fisheries, {State}",
        beni: [
            { icon: "Anchor", title: "Equipment Subsidy", description: "Discount on nets, boats, and motors" }
        ],
        crit: ["Registered Fisherman in {State}", "Member of Fisheries Cooperative"],
        docs: ["Fisherman ID", "Aadhaar", "Quotation of equipment"],
        url: "https://fisheries.{StateForUrl}.gov.in/subsidy",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { occupations: ["Farmer", "Worker", "Business"], states: ["{State}"] }
    },
    {
        baseId: "state-rickshaw",
        title: "{State} E-Rickshaw Scheme for Unemployed",
        desc: "Subsidy to unemployed youth and manual rickshaw pullers in {State} for purchasing E-Rickshaws, encouraging self-employment and green transit.",
        type: "Subsidy/Employment",
        tags: ["transport", "ev", "unemployed", "business"],
        amount: "₹50,000 Subsidy",
        min: "Department of Social Welfare, {State}",
        beni: [
            { icon: "Car", title: "Vehicle Purchase", description: "Direct subsidy sent to dealer" }
        ],
        crit: ["Resident of {State}", "Age 18-40", "Valid Driving License"],
        docs: ["Aadhaar", "Driving License", "Income Certificate"],
        url: "https://socialwelfare.{StateForUrl}.gov.in/erickshaw",
        tradeOffType: TradeOffCategory.CASTE_CERTIFICATE_REQUIRED, rules: { states: ["{State}"], ageRanges: ["18_35", "36_50"], occupations: ["Unemployed", "Driver", "Worker"] }
    },
    {
        baseId: "state-girl-marriage",
        title: "{State} Kanya Vivah Yojana",
        desc: "Financial assistance for the marriage of girls from BPL and registered construction worker families in {State}, ensuring safe and verified marriages.",
        type: "Financial Aid",
        tags: ["marriage", "women", "bpl"],
        amount: "₹55,000",
        min: "Labour / Social Welfare Department, {State}",
        beni: [
            { icon: "Gift", title: "Cash Grant", description: "Transferred to the bride's account" }
        ],
        crit: ["Bride > 18 years", "Resident of {State}", "Mass marriage/registered marriage only"],
        docs: ["Age Proof", "Aadhaar", "Marriage Registration Certificate"],
        url: "https://labour.{StateForUrl}.gov.in/vivah",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC, rules: { gender: ["Female"], ageRanges: ["18_35"], maxIncome: ["low"], states: ["{State}"] }
    },
    {
        baseId: "state-smart-village",
        title: "{State} Adarsh Gram Puraskar / Smart Village",
        desc: "Reward fund given to Gram Panchayats in {State} that achieve 100% sanitation, vaccination, and digital literacy.",
        type: "Community Grant",
        tags: ["rural", "panchayat", "infrastructure"],
        amount: "₹10,00,000 per Village",
        min: "Panchayati Raj Department, {State}",
        beni: [
            { icon: "Building", title: "Development Fund", description: "Used for village infrastructure" }
        ],
        crit: ["Gram Panchayat in {State}", "Must clear state-level KPIs"],
        docs: ["Panchayat Resolution", "KPI Reports"],
        url: "https://panchayati.{StateForUrl}.gov.in/smartvillage",
        tradeOffType: TradeOffCategory.RURAL_ONLY, rules: { states: ["{State}"], occupations: ["All"] }
    },
    {
        baseId: "state-homemaker-pension",
        title: "{State} Gruhalakshmi / Homemaker Guarantee Scheme",
        desc: "Monthly direct cash transfer to the female head of the family in {State} to recognize her homemaker efforts and fight inflation.",
        type: "Financial Aid",
        tags: ["women", "homemaker", "financial_aid"],
        amount: "₹1,000 - ₹2,000/month",
        min: "Department of Women and Child Development, {State}",
        beni: [
            { icon: "IndianRupee", title: "Monthly Allowance", description: "Credited to Aadhar linked account" }
        ],
        crit: ["Female head of family", "Aadhaar linked with Ration Card", "Resident of {State}"],
        docs: ["Aadhaar Card", "Ration Card", "Bank Passbook"],
        url: "https://wcd.{StateForUrl}.gov.in/gruhalakshmi",
        tradeOffType: TradeOffCategory.NO_PUCCA_HOUSE, rules: { gender: ["Female"], occupations: ["Homemaker", "Unemployed"], ageRanges: ["18_35", "36_50", "51_60", "above_60"], states: ["{State}"] }
    },
    {
        baseId: "state-tour-guide",
        title: "{State} Paryatan / Tourism Guide License & Loan",
        desc: "Free training, licensing, and micro-loan facility for youth in {State} to become certified tourism guides and open localized travel agencies.",
        type: "Education & Loan",
        tags: ["tourism", "business", "youth"],
        amount: "Free Training + ₹50,000 Loan",
        min: "Department of Tourism, {State}",
        beni: [
            { icon: "MapPin", title: "Training & Loan", description: "Complete package for tourism self-employment" }
        ],
        crit: ["Minimum 12th Pass", "Resident of {State}", "Age 18-35"],
        docs: ["Aadhaar", "Education Certificates", "Character Certificate"],
        url: "https://tourism.{StateForUrl}.gov.in/guide",
        tradeOffType: TradeOffCategory.LOAN_REPAYMENT, rules: { ageRanges: ["18_35"], education: ["12th Pass", "Graduate / Diploma", "Post Graduate & above"], states: ["{State}"] }
    },
    {
        baseId: "state-free-travel",
        title: "{State} Nari Shakti Free Bus Travel",
        desc: "100% concession on ticket fares for women passengers in ordinary and express state-run buses within the borders of {State}.",
        type: "Transport Subsidy",
        tags: ["women", "transport", "free"],
        amount: "Free Travel",
        min: "State Road Transport Corporation, {State}",
        beni: [
            { icon: "Bus", title: "Zero Ticket Fare", description: "Free travel by showing State Domicile/Aadhaar" }
        ],
        crit: ["Female passenger", "Resident/Domicile of {State}"],
        docs: ["Aadhaar Card/Voter ID (for age and address proof)"],
        url: "https://transport.{StateForUrl}.gov.in/free-travel",
        tradeOffType: TradeOffCategory.GENDER_SPECIFIC, rules: { gender: ["Female"], ageRanges: ["All"], states: ["{State}"] }
    }
];

const getUrlState = (state) => {
    return state.toLowerCase().replace(/ \s/g, '').replace(/ & /g, '').replace(/and/g, '');
};

const resumeUploads = async () => {
    const generatedSchemes = [];
    let counter = 1000;

    console.log("Re-generating list...");

    for (const base of BASE_SCHEMES) {
        for (const state of INDIAN_STATES) {
            const urlState = getUrlState(state);
            const schemeId = `${base.baseId}-${urlState}-${counter++}`;

            generatedSchemes.push({
                id: schemeId,
                title: base.title.replace(/{State}/g, state),
                description: base.desc.replace(/{State}/g, state),
                benefitType: base.type,
                tags: base.tags,
                eligible: true,
                tradeOffType: base.tradeOffType,
                amount: base.amount,
                ministry: base.min.replace(/{State}/g, state),
                benefits: base.beni,
                eligibilityCriteria: base.crit.map(c => c.replace(/{State}/g, state)),
                documents: base.docs.map(d => ({ icon: "FileText", name: d })),
                officialWebsite: base.url.replace(/{StateForUrl}/g, urlState).replace(/{State}/g, state),
                eligibilityRules: {
                    ...base.rules,
                    states: [state]
                }
            });
        }
    }

    // Resume from index 1000 to the end (the missing 50 schemes)
    const missingSchemes = generatedSchemes.slice(1000, 1050);
    console.log(`Found ${missingSchemes.length} missing schemes. Attempting targeted push to DynamoDB.`);

    let successCount = 0;
    for (let i = 0; i < missingSchemes.length; i++) {
        try {
            await docClient.send(new PutCommand({
                TableName: "JanSaarthiSchemes",
                Item: missingSchemes[i]
            }));
            successCount++;
            console.log(`Pushed item ${i + 1}/50`);
            await new Promise(r => setTimeout(r, 100)); // Small pause to prevent throttling
        } catch (e) {
            console.error("Failed to push item", i, e.message);
        }
    }

    console.log(`Successfully caught up and pushed ${successCount} items.`);
}

resumeUploads();
