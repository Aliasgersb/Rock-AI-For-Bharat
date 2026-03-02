import { UserProfile } from '../types';
import { ALL_SCHEMES, SchemeEntry } from '../data/schemesDb';

export type DriftAlertType = 'unlock' | 'lastChance';

export interface DriftAlert {
    type: DriftAlertType;
    scheme: SchemeEntry;
    daysRemaining: number;
    boundaryAge: number;
}

/**
 * The age boundaries where eligibility transitions happen.
 * Each entry: [age, ageRangeBefore, ageRangeAfter]
 */
const AGE_BOUNDARIES: [number, string, string][] = [
    [18, 'under_18', '18_35'],
    [36, '18_35', '36_50'],
    [51, '36_50', '51_60'],
    [61, '51_60', 'above_60'],
];

const ALERT_WINDOW_DAYS = 90;

/**
 * Calculate exact age in fractional years, plus days until next birthday milestone.
 */
function getAgeInfo(dob: string): { age: number; daysUntilNextBirthday: (targetAge: number) => number } | null {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return {
        age,
        daysUntilNextBirthday: (targetAge: number) => {
            const targetDate = new Date(
                birthDate.getFullYear() + targetAge,
                birthDate.getMonth(),
                birthDate.getDate()
            );
            const diffMs = targetDate.getTime() - today.getTime();
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        },
    };
}

/**
 * Check if a scheme matches the user's NON-age criteria (gender, state, income, etc.)
 * so we only show relevant drift alerts.
 */
function matchesNonAgeCriteria(profile: UserProfile, scheme: SchemeEntry): boolean {
    const rules = scheme.eligibilityRules;

    // Hard: Gender
    if (rules.gender && rules.gender.length > 0 && !rules.gender.includes('All')) {
        if (!profile.gender || !rules.gender.includes(profile.gender)) return false;
    }

    // Hard: Occupation
    if (rules.occupations && rules.occupations.length > 0 && !rules.occupations.includes('All')) {
        if (!profile.occupation || !rules.occupations.includes(profile.occupation)) return false;
    }

    // Soft: State
    if (rules.states && rules.states.length > 0 && !rules.states.includes('All')) {
        if (!profile.state || !rules.states.includes(profile.state)) return false;
    }

    // Soft: Income
    if (rules.maxIncome && rules.maxIncome.length > 0 && !rules.maxIncome.includes('All')) {
        if (!profile.income || !rules.maxIncome.includes(profile.income)) return false;
    }

    // Soft: Category
    if (rules.categories && rules.categories.length > 0 && !rules.categories.includes('All')) {
        if (!profile.category || !rules.categories.includes(profile.category)) return false;
    }

    // Soft: Education
    if (rules.education && rules.education.length > 0 && !rules.education.includes('All')) {
        if (!profile.education || !rules.education.includes(profile.education)) return false;
    }

    return true;
}

/**
 * Compute drift alerts for the user.
 * Returns alerts sorted: last-chance first (most urgent), then unlocks.
 */
export function computeDriftAlerts(profile: UserProfile): DriftAlert[] {
    if (!profile.dateOfBirth) return [];

    const ageInfo = getAgeInfo(profile.dateOfBirth);
    if (!ageInfo) return [];

    const alerts: DriftAlert[] = [];

    for (const [boundaryAge, rangeBefore, rangeAfter] of AGE_BOUNDARIES) {
        const daysUntil = ageInfo.daysUntilNextBirthday(boundaryAge);

        // Only consider boundaries within the alert window and in the future
        if (daysUntil <= 0 || daysUntil > ALERT_WINDOW_DAYS) continue;

        for (const scheme of ALL_SCHEMES) {
            const ageRanges = scheme.eligibilityRules.ageRanges;
            if (!ageRanges || ageRanges.length === 0 || ageRanges.includes('All')) continue;

            // Skip schemes that don't match non-age criteria
            if (!matchesNonAgeCriteria(profile, scheme)) continue;

            const inBefore = ageRanges.includes(rangeBefore);
            const inAfter = ageRanges.includes(rangeAfter);

            if (inBefore && !inAfter) {
                // User will LOSE eligibility → Last Chance
                alerts.push({
                    type: 'lastChance',
                    scheme,
                    daysRemaining: daysUntil,
                    boundaryAge,
                });
            } else if (!inBefore && inAfter) {
                // User will GAIN eligibility → Unlock
                alerts.push({
                    type: 'unlock',
                    scheme,
                    daysRemaining: daysUntil,
                    boundaryAge,
                });
            }
        }
    }

    // Sort: last-chance first (urgent), then unlocks; within each group by days ascending
    return alerts.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'lastChance' ? -1 : 1;
        return a.daysRemaining - b.daysRemaining;
    });
}
