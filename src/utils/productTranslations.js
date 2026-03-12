
const translations = {
    hi: {
        "Shirt": "शर्ट",
        "T-Shirt": "टी-शर्ट",
        "Jeans": "जींस",
        "Dress": "ड्रेस",
        "Shoes": "जूते",
        "Cotton": "सुती",
        "Linen": "लिनन",
        "Slim Fit": "स्लिम फिट",
        "Casual": "कैजुअल",
        "Formal": "फॉर्मल",
        "Men's": "पुरुषों का",
        "Women's": "महिलाओं का",
        "Kids": "बच्चों का",
        "Red": "लाल",
        "Blue": "नीला",
        "Black": "काला",
        "White": "सफेद",
        "Green": "हरा",
        "Yellow": "पीला",
        "Watch": "घड़ी",
        "Smartphone": "स्मार्टफोन",
        "Laptop": "लैपटॉप",
        "Organic": "जैविक",
        "Handmade": "हाथ से बना",
        "Premium": "प्रीमियम",
        "Classic": "क्लासिक",
        "Summer": "गर्मी",
        "Winter": "सर्दी"
    },
    mr: {
        "Shirt": "शर्ट",
        "T-Shirt": "टी-शर्ट",
        "Jeans": "जीन्स",
        "Dress": "ड्रेस",
        "Shoes": "बूट",
        "Cotton": "सुती",
        "Linen": "लिनन",
        "Slim Fit": "स्लिम फिट",
        "Casual": "कॅज्युअल",
        "Formal": "फॉर्मल",
        "Men's": "पुरुषांचे",
        "Women's": "महिलांचे",
        "Kids": "मुलांचे",
        "Red": "लाल",
        "Blue": "निळा",
        "Black": "काळा",
        "White": "पांढरा",
        "Green": "हिरवा",
        "Yellow": "पिवळा",
        "Watch": "घड्याळ",
        "Smartphone": "स्मार्टफोन",
        "Laptop": "लॅपटॉप",
        "Organic": "सेंद्रिय",
        "Handmade": "हस्तनिर्मित",
        "Premium": "प्रीमियम",
        "Classic": "क्लासिक",
        "Summer": "उन्हाळा",
        "Winter": "हिवाळा"
    }
};

/**
 * Localizes a dynamic string (like product name) based on the current language.
 * Uses a word-for-word replacement strategy for common product terms.
 * 
 * @param {string} name - The original English name.
 * @param {string} lang - The target language code ('hi', 'mr').
 * @returns {string} The localized name or the original if no mapping exists.
 */
export const getLocalizedName = (name, lang) => {
    if (!name || lang === 'en') return name;
    
    const langMap = translations[lang];
    if (!langMap) return name;

    // First check for an exact match
    if (langMap[name]) return langMap[name];

    // Otherwise, perform partial word replacement
    let translatedName = name;
    
    // Sort keys by length descending to match longer phrases first (e.g. "Slim Fit" before "Fit")
    const keys = Object.keys(langMap).sort((a, b) => b.length - a.length);
    
    for (const key of keys) {
        // Use word boundaries to avoid partial word replacement (e.g. "Cotton" in "Cottonwood")
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (regex.test(translatedName)) {
            translatedName = translatedName.replace(regex, langMap[key]);
        }
    }
    
    return translatedName;
};
