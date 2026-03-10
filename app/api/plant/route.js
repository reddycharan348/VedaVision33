import translate from 'google-translate-api-x';
import fs from 'fs/promises';
import path from 'path';

// Language code mapping for Google Translate
const LANG_CODES = {
    English: 'en',
    Telugu: 'te',
    Hindi: 'hi',
    Tamil: 'ta',
    Malayalam: 'ml',
    Kannada: 'kn',
    Sanskrit: 'sa',
};

// Translate a single string
async function translateText(text, langCode) {
    if (!text || typeof text !== 'string' || text.trim() === '') return text;
    try {
        const res = await translate(text, { to: langCode });
        return res.text;
    } catch (e) {
        console.error('Translate error:', e.message);
        return text;
    }
}

// Translate all string values in an object/array recursively
async function translateDeep(obj, langCode) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        return translateText(obj, langCode);
    }

    if (Array.isArray(obj)) {
        // Batch translate array items: join with separator, translate once, split back
        if (obj.length === 0) return obj;
        if (obj.every(item => typeof item === 'string')) {
            const SEP = ' ||| ';
            const joined = obj.join(SEP);
            const translated = await translateText(joined, langCode);
            return translated.split(SEP).map(s => s.trim());
        }
        // Non-string arrays: translate each item
        return Promise.all(obj.map(item => translateDeep(item, langCode)));
    }

    if (typeof obj === 'object') {
        const result = {};
        const entries = Object.entries(obj);
        for (const [key, value] of entries) {
            result[key] = await translateDeep(value, langCode);
        }
        return result;
    }

    return obj;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const language = searchParams.get('lang') || 'English';

        if (!id) {
            return new Response(JSON.stringify({ error: "No plant ID provided" }), { status: 400 });
        }

        const directories = ['plants', 'cereals', 'pulses'];
        let matchedFile = null;

        for (const dir of directories) {
            const filePath = path.join(process.cwd(), 'app', 'data', dir, `${id}.json`);
            try {
                await fs.access(filePath);
                matchedFile = filePath;
                break;
            } catch (e) { /* continue */ }
        }

        if (!matchedFile) {
            return new Response(JSON.stringify({ error: "Plant not found in the local dataset." }), { status: 404 });
        }

        const fileData = await fs.readFile(matchedFile, 'utf8');

        // English — return immediately
        if (!language || language === 'English') {
            return new Response(fileData, {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" }
            });
        }

        const langCode = LANG_CODES[language] || 'en';

        try {
            const parsed = JSON.parse(fileData);

            // Fields to translate (all user-visible content)
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

            // Translate all fields in parallel
            const translationPromises = fieldsToTranslate.map(async (field) => {
                if (parsed[field] === undefined || parsed[field] === null) return;
                parsed[field] = await translateDeep(parsed[field], langCode);
            });

            await Promise.all(translationPromises);

            // Keep scientific name in Latin
            if (parsed.scientificName) parsed.scientific_name = parsed.scientificName;

            return new Response(JSON.stringify(parsed), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            console.error("Translation error, falling back to English:", e.message);
            return new Response(fileData, { status: 200, headers: { "Content-Type": "application/json" } });
        }
    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
