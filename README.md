# JanSaarthi - Rock-AI-For-Bharat

JanSaarthi is an AI-powered platform that helps Indian citizens discover government schemes they are eligible for. It combines rule-based matching for accuracy with AI to extract details from ID scans and simplify complex scheme information into clear, easy-to-understand explanations in local languages.

## Features

- **Smart Profile Creation**: Build your profile through a guided wizard or by scanning government ID cards
- **AI-Powered Matching**: Intelligent scheme matching based on your demographics, occupation, income, and location
- **Reality Check**: Transparent information about scheme trade-offs (loan repayments, co-payments, lock-in periods, etc.)
- **Multi-Language Support**: Access scheme information in your preferred language
- **Scheme Comparison**: Compare multiple schemes side-by-side to make informed decisions
- **Action Plans**: Step-by-step guidance on how to apply for schemes
- **History Tracking**: Keep track of schemes you've viewed and saved

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Custom CSS with Tailwind-like utilities
- **Icons**: Lucide React
- **AI Services**: 
  - Google Generative AI (Gemini)
  - AWS Bedrock Runtime
- **Database**: AWS DynamoDB
- **Deployment**: AWS Amplify

## Project Structure

```
├── components/          # Reusable UI components
│   ├── Button.tsx
│   └── icons/          # Custom icon components
├── screens/            # Main application screens
│   ├── WelcomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ProfileWizardScreen.tsx
│   ├── ScanVerifyScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── SchemeDetailsScreen.tsx
│   ├── CompareScreen.tsx
│   └── ActionPlanScreen.tsx
├── services/           # Business logic and AI services
│   ├── ai.ts
│   ├── matchingEngine.ts
│   ├── insightsEngine.ts
│   └── driftRadar.ts
├── data/              # Scheme database and translations
│   ├── schemesDb.ts
│   └── tradeOffTranslations.ts
├── scripts/           # Utility scripts
│   ├── harvester.ts
│   └── uploadSchemes.ts
└── types.ts           # TypeScript type definitions

```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jansaarthi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_AWS_REGION=your_aws_region
   VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
   VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Deployment

Deploy to AWS Amplify:
```bash
npm run deploy
```

## Key Services

### Matching Engine
Rule-based engine that matches users with eligible government schemes based on:
- Demographics (age, gender, category)
- Location (state, district, rural/urban)
- Occupation and income
- Education level

### Insights Engine
AI-powered service that:
- Generates personalized scheme recommendations
- Explains eligibility criteria in simple language
- Provides context-aware insights

### Drift Radar
Monitors and identifies potential issues with scheme eligibility over time, helping users stay informed about changes that might affect their benefits.

## Lambda Functions

The project includes AWS Lambda functions for backend processing:
- `lambda_function.mjs` - Main Lambda handler
- `lambda_function_v3.js` - Version 3 implementation
- `lambda_function_cjs.js` - CommonJS version

## Scripts

- `analyzeDb.ts` - Analyze scheme database statistics
- `harvester.ts` - Scrape and collect scheme data
- `uploadSchemes.ts` - Upload schemes to DynamoDB

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]

## Support

For support, please [add contact information or issue tracker link]

---

View the app in AI Studio: https://ai.studio/apps/drive/10wC6gRtribhD9nVS3Z942_8tealoIb69
