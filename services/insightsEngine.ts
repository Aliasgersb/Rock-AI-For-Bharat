import { UserProfile, Scheme } from '../types';

export interface Insight {
    key: string;
    params: Record<string, string | number>;
    action?: 'browse' | 'saved' | 'profile';
}

/**
 * Generates a personalized, factually accurate insight based on the user's
 * profile data and their matched schemes. All information is derived
 * deterministically from existing data — nothing is made up.
 *
 * Uses a daily-rotating seed so the user sees the same tip throughout the day
 * but a fresh one the next day.
 */
export function generateInsight(
    profile: UserProfile,
    schemes: Scheme[],
    savedCount: number
): Insight {
    const pool: Insight[] = [];

    // --- 1. Eligible Scheme Count ---
    if (schemes.length > 0) {
        pool.push({
            key: 'insight_scheme_count',
            params: { count: schemes.length },
            action: 'browse',
        });
    }

    // --- 2. Total Benefit Highlight (only use real amounts from schemes) ---
    const insuranceSchemes = schemes.filter(s =>
        s.benefitType.toLowerCase().includes('insurance') ||
        s.benefitType.toLowerCase().includes('health')
    );
    const pensionSchemes = schemes.filter(s =>
        s.benefitType.toLowerCase().includes('pension')
    );
    const loanSchemes = schemes.filter(s =>
        s.benefitType.toLowerCase().includes('loan') ||
        s.benefitType.toLowerCase().includes('credit')
    );
    const financialSchemes = schemes.filter(s =>
        s.benefitType.toLowerCase().includes('financial') ||
        s.benefitType.toLowerCase().includes('subsidy') ||
        s.benefitType.toLowerCase().includes('fuel')
    );

    // --- 3. Scheme by Category insights ---
    if (insuranceSchemes.length > 0) {
        pool.push({
            key: 'insight_category_insurance',
            params: { count: insuranceSchemes.length },
            action: 'browse',
        });
    }

    if (pensionSchemes.length > 0) {
        pool.push({
            key: 'insight_category_pension',
            params: { count: pensionSchemes.length },
            action: 'browse',
        });
    }

    if (loanSchemes.length > 0) {
        pool.push({
            key: 'insight_category_loan',
            params: { count: loanSchemes.length },
            action: 'browse',
        });
    }

    if (financialSchemes.length > 0) {
        pool.push({
            key: 'insight_category_financial',
            params: { count: financialSchemes.length },
            action: 'browse',
        });
    }

    // --- 4. Profile Incomplete hints ---
    if (!profile.income) {
        pool.push({
            key: 'insight_missing_income',
            params: {},
            action: 'profile',
        });
    }
    if (!profile.category) {
        pool.push({
            key: 'insight_missing_category',
            params: {},
            action: 'profile',
        });
    }
    if (!profile.dateOfBirth) {
        pool.push({
            key: 'insight_missing_dob',
            params: {},
            action: 'profile',
        });
    }
    if (!profile.occupation) {
        pool.push({
            key: 'insight_missing_occupation',
            params: {},
            action: 'profile',
        });
    }

    // --- 5. Saved Schemes Reminder ---
    if (savedCount > 0) {
        pool.push({
            key: 'insight_saved_reminder',
            params: { count: savedCount },
            action: 'saved',
        });
    }

    // --- 6. No Saved Schemes ---
    if (savedCount === 0 && schemes.length > 0) {
        pool.push({
            key: 'insight_no_saved',
            params: {},
            action: 'browse',
        });
    }

    // Fallback: generic tip (always in pool as a last resort)
    pool.push({
        key: 'insight_generic',
        params: {},
    });

    // Daily-rotating deterministic pick
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = daySeed % pool.length;

    return pool[index];
}
