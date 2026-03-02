import { UserProfile, Scheme } from '../types';
import { ALL_SCHEMES, SchemeEntry } from '../data/schemesDb';

export interface MatchResult extends Scheme {
    matchScore: number;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
}

/**
 * Convert a date of birth (YYYY-MM-DD) into the app's ageRange bucket.
 */
export function dobToAgeRange(dob?: string): string {
    if (!dob) return '';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) return 'under_18';
    if (age <= 35) return '18_35';
    if (age <= 50) return '36_50';
    if (age <= 60) return '51_60';
    return 'above_60';
}


/**
 * Rule-based matching engine that filters schemes based on user profile.
 * Returns schemes sorted by match score (highest first).
 */
export const findMatchingSchemes = (profile: UserProfile): MatchResult[] => {
    const results: MatchResult[] = [];

    for (const scheme of ALL_SCHEMES) {
        const { score, matched, unmatched } = calculateMatch(profile, scheme);

        // Include schemes with at least 75% match
        if (score >= 75) {
            results.push({
                ...scheme,
                eligible: score >= 70,
                matchScore: score,
                matchedCriteria: matched,
                unmatchedCriteria: unmatched,
            });
        }
    }

    // Sort by match score descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
};

function calculateMatch(
    profile: UserProfile,
    scheme: SchemeEntry
): { score: number; matched: string[]; unmatched: string[] } {
    const rules = scheme.eligibilityRules;
    const matched: string[] = [];
    const unmatched: string[] = [];
    let totalCriteria = 0;
    let matchedCount = 0;

    // === HARD REQUIREMENTS (instant disqualification) ===

    // Hard check: Occupation (if scheme requires specific occupations, user MUST match)
    if (rules.occupations && rules.occupations.length > 0 && !rules.occupations.includes('All')) {
        if (!profile.occupation || !rules.occupations.includes(profile.occupation)) {
            return { score: 0, matched: [], unmatched: ['Occupation does not match'] };
        }
    }

    // Hard check: Gender (if scheme requires specific gender, user MUST match)
    if (rules.gender && rules.gender.length > 0 && !rules.gender.includes('All')) {
        if (!profile.gender || !rules.gender.includes(profile.gender)) {
            return { score: 0, matched: [], unmatched: ['Gender does not match'] };
        }
    }

    // === SOFT CRITERIA (contribute to score) ===

    // 1. Check Age
    if (rules.ageRanges && rules.ageRanges.length > 0) {
        totalCriteria++;
        const ageRange = dobToAgeRange(profile.dateOfBirth);
        if (rules.ageRanges.includes('All') || (ageRange && rules.ageRanges.includes(ageRange))) {
            matchedCount++;
            matched.push('Age range matches');
        } else {
            unmatched.push(ageRange ? 'Age range does not match' : 'Date of birth not provided');
        }
    }

    // 2. Check State
    if (rules.states && rules.states.length > 0) {
        totalCriteria++;
        if (rules.states.includes('All') || (profile.state && rules.states.includes(profile.state))) {
            matchedCount++;
            matched.push('Available in your state');
        } else {
            unmatched.push(profile.state ? 'Not available in your state' : 'State not provided');
        }
    }

    // 3. Check Occupation (as soft score now — hard check already passed)
    if (rules.occupations && rules.occupations.length > 0) {
        totalCriteria++;
        if (rules.occupations.includes('All') || (profile.occupation && rules.occupations.includes(profile.occupation))) {
            matchedCount++;
            matched.push('Occupation matches');
        } else {
            unmatched.push(profile.occupation ? 'Occupation does not match' : 'Occupation not provided');
        }
    }

    // 4. Check Income
    if (rules.maxIncome && rules.maxIncome.length > 0) {
        totalCriteria++;
        if (rules.maxIncome.includes('All') || (profile.income && rules.maxIncome.includes(profile.income))) {
            matchedCount++;
            matched.push('Income criteria met');
        } else {
            unmatched.push(profile.income ? 'Income exceeds threshold' : 'Income not provided');
        }
    }

    // 5. Check Category
    if (rules.categories && rules.categories.length > 0) {
        totalCriteria++;
        if (rules.categories.includes('All') || (profile.category && rules.categories.includes(profile.category))) {
            matchedCount++;
            matched.push('Category matches');
        } else {
            unmatched.push(profile.category ? 'Category does not match' : 'Category not provided');
        }
    }

    // 6. Check Gender (soft score — hard check already passed)
    if (rules.gender && rules.gender.length > 0) {
        totalCriteria++;
        if (rules.gender.includes('All') || (profile.gender && rules.gender.includes(profile.gender))) {
            matchedCount++;
            matched.push('Gender matches');
        } else {
            unmatched.push(profile.gender ? 'Gender does not match' : 'Gender not provided');
        }
    }

    // 7. Check Education
    if (rules.education && rules.education.length > 0) {
        totalCriteria++;
        if (rules.education.includes('All') || (profile.education && rules.education.includes(profile.education))) {
            matchedCount++;
            matched.push('Education level matches');
        } else {
            unmatched.push(profile.education ? 'Education level does not match' : 'Education not provided');
        }
    }

    // If no criteria defined, it's a universal scheme
    if (totalCriteria === 0) {
        return { score: 100, matched: ['Universal scheme - open to all'], unmatched: [] };
    }

    const score = Math.round((matchedCount / totalCriteria) * 100);
    return { score, matched, unmatched };
}
