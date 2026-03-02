const fs = require('fs');

const tsFilePath = 'c:/Users/HP/Downloads/Antigravity/JanSaarthi/translations.ts';
let content = fs.readFileSync(tsFilePath, 'utf8');

const additional = {
    Marathi: `    w_gender: "तुमचे लिंग काय आहे?",\n    w_education: "तुमचे शिक्षण काय आहे?",`,
    Telugu: `    w_gender: "మీ లింగం ఏమిటి?",\n    w_education: "మీ విద్యా స్థాయి ఏమిటి?",`,
    Tamil: `    w_gender: "உங்கள் பாலினம் என்ன?",\n    w_education: "உங்கள் கல்வி தகுதி என்ன?",`,
    Bengali: `    w_gender: "আপনার লিঙ্গ কি?",\n    w_education: "আপনার শিক্ষাগত যোগ্যতা কি?",`,
    Gujarati: `    w_gender: "તમારું લિંગ શું છે?",\n    w_education: "તમારું શિક્ષણ શું છે?",`,
    Kannada: `    w_gender: "ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು?",\n    w_education: "ನಿಮ್ಮ ಶಿಕ್ಷಣವೇನು?",`,
    Malayalam: `    w_gender: "നിങ്ങളുടെ ലിംഗം എന്താണ്?",\n    w_education: "നിങ്ങളുടെ വിദ്യാഭ്യാസം എന്താണ്?",`,
    Punjabi: `    w_gender: "ਤੁਹਾਡਾ ਲਿੰਗ ਕੀ ਹੈ?",\n    w_education: "ਤੁਹਾਡੀ ਸਿੱਖਿਆ ਕੀ ਹੈ?",`,
    Odia: `    w_gender: "ଆପଣଙ୍କ ଲିଙ୍ଗ କଣ?",\n    w_education: "ଆପଣଙ୍କ ଶିକ୍ଷା କଣ?",`,
    Assamese: `    w_gender: "আপোনাৰ লিংগ কি?",\n    w_education: "আপোনাৰ শিক্ষা কি?",`,
    Urdu: `    w_gender: "آپ کی جنس کیا ہے؟",\n    w_education: "آپ کی تعلیم کیا ہے؟",`
};

let modifiedContent = content;
Object.keys(additional).forEach(lang => {
    const anchor = lang + ': {';
    const blockStartIdx = modifiedContent.indexOf(anchor);
    if (blockStartIdx !== -1) {
        const nextLineIdx = modifiedContent.indexOf('\\n', blockStartIdx);
        const injectionPoint = nextLineIdx !== -1 ? nextLineIdx + 1 : blockStartIdx + anchor.length;
        modifiedContent = modifiedContent.substring(0, blockStartIdx + anchor.length) + "\\n" + additional[lang] + modifiedContent.substring(blockStartIdx + anchor.length);
    }
});

modifiedContent = modifiedContent.replace(/\{\\n/g, '{\n');
fs.writeFileSync(tsFilePath, modifiedContent, 'utf8');
console.log("Injected the final 2 keys.");
