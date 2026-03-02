const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// We keep the client outside the handler to reuse connection pools (Cold Start optimization)
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

    // Hard Rules
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

    // Soft Rules
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

// Ensure CORS Headers are ALWAYS returned perfectly
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json"
};

exports.handler = async (event) => {
    try {
        console.log("Raw API Event:", JSON.stringify(event));

        // 1. Handle Preflight Options
        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 200, headers: corsHeaders, body: "" };
        }

        // 2. Safely Parse Profile Body
        let profile = {};
        if (event.body) {
            try {
                profile = JSON.parse(event.body);
            } catch (e) {
                console.warn("Failed to parse body string:", e);
                profile = event.body;
            }
        } else {
            profile = event;
        }

        console.log("Extracted Profile:", profile);

        // 3. Scan limited portion of DynamoDB to prevent the dreaded 3-second timeout
        // Scanning 1,135 items can hit the default 3-second Lambda Timeout Limit.
        const allSchemes = [];
        let lastEvaluatedKey = undefined;
        let loopCount = 0;

        // We will stop scanning early if we spend more than 2.0 seconds inside DynamoDB
        // to guarantee the Lambda NEVER times out and crashes.
        const startTime = Date.now();

        do {
            const command = new ScanCommand({
                TableName: "JanSaarthiSchemes",
                ExclusiveStartKey: lastEvaluatedKey,
                Limit: 400 // Fetch in chunks of 400 to manage memory & time
            });

            const response = await docClient.send(command);
            if (response.Items) {
                allSchemes.push(...response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
            loopCount++;

            // Emergency Timeout Break (AWS default is 3 seconds, we break at 2.4s)
            if (Date.now() - startTime > 2400) {
                console.warn("Approaching Lambda Timeout! Breaking scan loop early.");
                break;
            }
        } while (lastEvaluatedKey);

        console.log(`Successfully fetched ${allSchemes.length} schemes in ${Date.now() - startTime}ms`);

        // 4. Calculate Matches
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

        // 5. Return strict response
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(topResults)
        };

    } catch (error) {
        console.error("Critical Lambda Failure:", error);

        // Even on fail, MUST return CORS Headers so the frontend can read the error!
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message || error.toString()
            })
        };
    }
};
