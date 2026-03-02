const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

function dobToAgeRange(dob) {
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

function calculateMatch(profile, scheme) {
    const rules = scheme.eligibilityRules || {};
    const matched = [];
    const unmatched = [];
    let totalCriteria = 0;
    let matchedCount = 0;

    if (rules.occupations && rules.occupations.length > 0 && !rules.occupations.includes('All')) {
        if (!profile.occupation || !rules.occupations.includes(profile.occupation)) {
            return { score: 0, matched: [], unmatched: ['Occupation does not match'] };
        }
    }

    if (rules.gender && rules.gender.length > 0 && !rules.gender.includes('All')) {
        if (!profile.gender || !rules.gender.includes(profile.gender)) {
            return { score: 0, matched: [], unmatched: ['Gender does not match'] };
        }
    }

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

    if (rules.states && rules.states.length > 0) {
        totalCriteria++;
        if (rules.states.includes('All') || (profile.state && rules.states.includes(profile.state))) {
            matchedCount++;
            matched.push('State matches');
        } else {
            unmatched.push(profile.state ? 'State does not match' : 'State not provided');
        }
    }

    if (rules.maxIncome && rules.maxIncome.length > 0) {
        totalCriteria++;
        if (rules.maxIncome.includes('All') || (profile.income && rules.maxIncome.includes(profile.income))) {
            matchedCount++;
            matched.push('Income criteria matches');
        } else {
            unmatched.push(profile.income ? 'Income does not match' : 'Income not provided');
        }
    }

    if (rules.categories && rules.categories.length > 0) {
        totalCriteria++;
        if (rules.categories.includes('All') || (profile.category && rules.categories.includes(profile.category))) {
            matchedCount++;
            matched.push('Category matches');
        } else {
            unmatched.push(profile.category ? 'Category does not match' : 'Category not provided');
        }
    }

    if (rules.education && rules.education.length > 0) {
        totalCriteria++;
        if (rules.education.includes('All') || (profile.education && rules.education.includes(profile.education))) {
            matchedCount++;
            matched.push('Education matches');
        } else {
            unmatched.push(profile.education ? 'Education does not match' : 'Education not provided');
        }
    }

    let score = 100;
    if (totalCriteria > 0) {
        score = Math.round((matchedCount / totalCriteria) * 100);
    }
    return { score, matched, unmatched };
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "OPTIONS,POST"
                },
                body: ""
            };
        }

        let profile = {};
        if (event.body) {
            try {
                profile = JSON.parse(event.body);
            } catch (e) {
                profile = event;
            }
        } else {
            profile = event;
        }

        const allSchemes = [];
        let lastEvaluatedKey = undefined;
        do {
            const command = new ScanCommand({
                TableName: "JanSaarthiSchemes",
                ExclusiveStartKey: lastEvaluatedKey
            });
            const response = await docClient.send(command);
            if (response.Items) {
                allSchemes.push(...response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        const results = [];
        for (const scheme of allSchemes) {
            const { score, matched, unmatched } = calculateMatch(profile, scheme);
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

        results.sort((a, b) => b.matchScore - a.matchScore);
        const topResults = results.slice(0, 50);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(topResults)
        };
    } catch (error) {
        // Enhanced error handling to print the exact error message
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Internal Server Error", error: error.toString() })
        };
    }
};
