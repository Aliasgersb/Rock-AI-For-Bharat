const fs = require('fs');

const tsFilePath = 'c:/Users/HP/Downloads/Antigravity/JanSaarthi/translations.ts';
const content = fs.readFileSync(tsFilePath, 'utf8');

// A simple parser to extract the keys for each language.
const languageBlocks = {};
let currentLanguage = null;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect language start
    const langMatch = line.match(/^(\w+):\s*\{$/);
    if (langMatch) {
        currentLanguage = langMatch[1];
        languageBlocks[currentLanguage] = {};
        continue;
    }

    // Detect language end
    if (currentLanguage && line === '},') {
        currentLanguage = null;
        continue;
    }

    // Extract key-value pairs
    if (currentLanguage) {
        const keyMatch = line.match(/^([a-zA-Z0-9_]+):\s*"(.*?)"(,?)$/);
        if (keyMatch) {
            const key = keyMatch[1];
            const val = keyMatch[2];
            languageBlocks[currentLanguage][key] = val;
        }
    }
}

// 1. Language Count
const languages = Object.keys(languageBlocks);
console.log(`Detected Languages (${languages.length}): ${languages.join(', ')}`);

// 2. English Keys Reference
const englishKeys = Object.keys(languageBlocks['English'] || {});
console.log(`English Dictionary has ${englishKeys.length} keys.`);

let hasErrors = false;

// 3. Compare all languages to English
for (const [lang, block] of Object.entries(languageBlocks)) {
    if (lang === 'English') continue;

    const blockKeys = Object.keys(block);

    // Missing keys
    const missingKeys = englishKeys.filter(k => !blockKeys.includes(k));
    if (missingKeys.length > 0) {
        hasErrors = true;
        console.log(`[${lang}] is MISSING ${missingKeys.length} keys: ${missingKeys.join(', ')}`);
    }

    // Extra keys (keys not in English)
    const extraKeys = blockKeys.filter(k => !englishKeys.includes(k));
    if (extraKeys.length > 0) {
        hasErrors = true;
        console.log(`[${lang}] has EXTRA ${extraKeys.length} keys: ${extraKeys.join(', ')}`);
    }

    // Untranslated keys (exactly same as English but shouldn't be)
    const identicalKeys = blockKeys.filter(k => englishKeys.includes(k) && block[k] === languageBlocks['English'][k]);

    // Filter out keys we expect to be identical (like numbers, Aadhaar Card, abbreviations) 
    // or short placeholder text. We'll list them to manually review.
    const suspiciousIdenticals = identicalKeys.filter(k =>
        !["mobilePlaceholder", "aadhaarCard", "years", "cat_general", "cat_obc", "cat_sc", "cat_st", "cat_ews", "cat_pvtg", "cat_dnt", "cat_nt", "cat_sbc", "cat_vj", "cat_mbc"].includes(k) &&
        languageBlocks['English'][k].length > 3
    );

    if (suspiciousIdenticals.length > 0) {
        console.log(`[${lang}] has identical translations (untranslated?): ${suspiciousIdenticals.length} -> ${suspiciousIdenticals.slice(0, 5).join(', ')}...`);
    }
}

if (!hasErrors) {
    console.log("SUCCESS: All languages have exactly the same keys as English! No missing or extra strings.");
}

