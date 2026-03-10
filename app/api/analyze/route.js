import { GoogleGenAI } from "@google/genai";
import translate from 'google-translate-api-x';
import fs from 'fs/promises';
import path from 'path';

const LANG_CODES = {
    English: 'en', Telugu: 'te', Hindi: 'hi',
    Tamil: 'ta', Malayalam: 'ml', Kannada: 'kn', Sanskrit: 'sa',
};

async function translateText(text, langCode) {
    if (!text || typeof text !== 'string' || text.trim() === '') return text;
    try {
        const res = await translate(text, { to: langCode });
        return res.text;
    } catch (e) { return text; }
}

async function translateDeep(obj, langCode) {
    if (!obj) return obj;
    if (typeof obj === 'string') return translateText(obj, langCode);
    if (Array.isArray(obj)) {
        if (obj.length === 0) return obj;
        if (obj.every(item => typeof item === 'string')) {
            const SEP = ' ||| ';
            const joined = obj.join(SEP);
            const translated = await translateText(joined, langCode);
            return translated.split(SEP).map(s => s.trim());
        }
        return Promise.all(obj.map(item => translateDeep(item, langCode)));
    }
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = await translateDeep(value, langCode);
        }
        return result;
    }
    return obj;
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { image, query, language } = body;

        if (!image && !query) {
            return new Response(JSON.stringify({ error: "No image or search query provided" }), { status: 400 });
        }

        let plantIdentifier = query;

        // Step 1: If an image is provided, use Gemini Vision to identify the plant name ONLY
        if (image) {
            const apiKeys = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_2,
                process.env.GEMINI_API_KEY_3,
                process.env.GEMINI_API_KEY_4,
                process.env.GEMINI_API_KEY_5,
                process.env.GEMINI_API_KEY_6
            ].filter(Boolean); // Only use keys that are actually present

            const prompt = `Identify the name of this medicinal plant in the image. STRICTLY return ONLY the common name or scientific name as plain text. Do not return any other text, markdown, or explanation.`;
            const imagePart = { inlineData: { data: image.split(',')[1], mimeType: image.split(';')[0].split(':')[1] || "image/jpeg" } };

            let success = false;
            let lastError = null;

            // Try each API key in sequence until one works
            for (let i = 0; i < apiKeys.length; i++) {
                try {
                    const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            prompt,
                            { inlineData: { data: image.split(',')[1], mimeType: image.split(';')[0].split(':')[1] || "image/jpeg" } }
                        ]
                    });
                    
                    plantIdentifier = response.text.trim();
                    success = true;
                    console.log(`Successfully used API Key index ${i}`);
                    break;
                } catch (e) {
                    console.warn(`API Key index ${i} failed:`, e.message);
                    lastError = e;
                }
            }

            if (!success) {
                console.error("All Gemini API keys failed:", lastError?.message);
                return new Response(JSON.stringify({ error: "API Quota exceeded for all keys. Please try searching by text instead or add new keys." }), { status: 429 });
            }
        }

        if (!plantIdentifier) {
            return new Response(JSON.stringify({ error: "Could not identify plant." }), { status: 400 });
        }

        // Step 2: Search the local app/data/{plants,cereals,pulses}/ folders for a matching JSON file
        const directories = ['plants', 'cereals', 'pulses'];
        const normalizedSearchTerm = plantIdentifier.toLowerCase();
        let matchedFile = null;

        for (const dir of directories) {
            const dataDirectory = path.join(process.cwd(), 'app', 'data', dir);
            let files = [];
            try {
                files = await fs.readdir(dataDirectory);
            } catch (e) {
                console.error(`Data directory error for ${dir}:`, e);
                continue;
            }

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(dataDirectory, file);
                const fileContents = await fs.readFile(filePath, 'utf8');
                let data;
                try {
                    data = JSON.parse(fileContents);
                } catch (err) {
                    continue; // skip malformed JSON
                }

                const nameMatch = data.name ? data.name.toLowerCase() : "";
                const sciNameMatch = (data.scientific_name || data.scientificName || "").toLowerCase();
                const idMatch = (data.id || file.replace('.json', '')).toLowerCase();

                // Simple search against name, scientific_name/scientificName, id, or filename
                if (
                    (nameMatch && nameMatch.includes(normalizedSearchTerm)) ||
                    (nameMatch && normalizedSearchTerm.includes(nameMatch)) ||
                    (sciNameMatch && sciNameMatch.includes(normalizedSearchTerm)) ||
                    (sciNameMatch && normalizedSearchTerm.includes(sciNameMatch)) ||
                    (idMatch && idMatch.includes(normalizedSearchTerm)) ||
                    (idMatch && normalizedSearchTerm.includes(idMatch))
                ) {
                    matchedFile = filePath;
                    break;
                }
            }
            if (matchedFile) break;
        }

        // Step 3: If found, return the verified local JSON data
        if (matchedFile) {
            const fileData = await fs.readFile(matchedFile, 'utf8');

            // Step 4: Translate to the requested language if needed
            if (language && language !== 'English') {
                try {
                    const parsed = JSON.parse(fileData);
                    const langCode = LANG_CODES[language] || 'en';

                    const fieldsToTranslate = [
                        'name', 'description', 'habitat', 'parts_used', 'usage_form',
                        'botanicalFamily', 'family',
                        'plant_profile', 'plantProfile',
                        'main_medicinal_uses', 'mainMedicinalUses',
                        'preparation_methods', 'preparationMethods',
                        'safety_profile', 'safetyProfile',
                        'three_main_uses', 'usesInAyurveda',
                        'medicinal_uses', 'ayurvedic_properties',
                        'contraindications', 'drug_interactions',
                        'dosages', 'active_compounds',
                    ];

                    await Promise.all(fieldsToTranslate.map(async (field) => {
                        if (parsed[field] === undefined || parsed[field] === null) return;
                        parsed[field] = await translateDeep(parsed[field], langCode);
                    }));

                    if (parsed.scientificName) parsed.scientific_name = parsed.scientificName;

                    return new Response(JSON.stringify(parsed), {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    });
                } catch (e) {
                    console.error("Translation error:", e);
                    return new Response(fileData, {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    });
                }
            } else {
                return new Response(fileData, {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }
        } else {
            return new Response(JSON.stringify({
                error: `Plant identified as '${plantIdentifier}', but it is not in our verified WHO/AYUSH database.`
            }), { status: 404 });
        }

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
