import fs from 'fs/promises';
import path from 'path';

// Keyword → plant mapping built from our dataset
// Symptom keywords map to plant IDs. These are curated for common queries.
const SYMPTOM_KEYWORDS = {
    // Fever & infections
    fever: ['tulsi', 'neem', 'guduchi', 'kiratatikta', 'kalmegh', 'chirata'],
    cold: ['tulsi', 'ginger', 'pippali', 'maricha', 'hingu'],
    cough: ['vasaka', 'tulsi', 'pippali', 'kantakari', 'karpoora'],
    flu: ['tulsi', 'ginger', 'guduchi', 'kalmegh'],
    infection: ['neem', 'guduchi', 'tulsi', 'haridra'],
    viral: ['guduchi', 'tulsi', 'kalmegh', 'kiratatikta'],
    bacterial: ['neem', 'haridra', 'tulsi'],

    // Digestive
    digestion: ['ginger', 'hingu', 'jeeraka', 'methika', 'dhanyaka'],
    stomach: ['ginger', 'hingu', 'bilva', 'jeeraka', 'methika'],
    constipation: ['haritaki', 'trivrit', 'danti', 'aragvadha'],
    diarrhea: ['kutaja', 'bilva', 'haritaki', 'musta'],
    acidity: ['amla', 'shatavari', 'yashtimadhu', 'bilva'],
    bloating: ['hingu', 'jeeraka', 'dhanyaka', 'ajwain'],
    nausea: ['ginger', 'hingu', 'karpoora'],
    vomiting: ['ginger', 'hingu', 'bilva'],
    gas: ['hingu', 'jeeraka', 'methika'],
    indigestion: ['ginger', 'hingu', 'jeeraka', 'dhanyaka'],
    appetite: ['chitrak', 'ginger', 'hingu', 'pippali'],
    liver: ['bhumyamalaki', 'kalmegh', 'punarnava', 'kutaja'],

    // Skin
    skin: ['neem', 'haridra', 'manjistha', 'bakuchi'],
    acne: ['neem', 'haridra', 'manjistha'],
    eczema: ['neem', 'haridra', 'chandana', 'manjistha'],
    psoriasis: ['bakuchi', 'neem', 'haridra', 'manjistha'],
    rash: ['neem', 'haridra', 'chandana'],
    wound: ['haridra', 'neem', 'aloe_vera', 'chandana'],
    burns: ['aloe_vera', 'chandana', 'haridra'],
    dark: ['manjistha', 'haridra', 'chandana'],

    // Pain & inflammation
    pain: ['nirgundi', 'rasna', 'shallaki', 'eranda', 'devadaru'],
    inflammation: ['shallaki', 'haridra', 'nirgundi', 'guggulu'],
    arthritis: ['shallaki', 'guggulu', 'nirgundi', 'rasna', 'devadaru'],
    joint: ['shallaki', 'guggulu', 'rasna', 'nirgundi'],
    back: ['nirgundi', 'devadaru', 'rasna', 'eranda'],
    headache: ['brahmi', 'jatamansi', 'chandana', 'nirgundi'],
    migraine: ['brahmi', 'jatamansi', 'chandana'],
    muscle: ['nirgundi', 'rasna', 'devadaru', 'eranda'],

    // Mental health & nervous system
    stress: ['ashwagandha', 'brahmi', 'jatamansi', 'shatavari'],
    anxiety: ['ashwagandha', 'brahmi', 'jatamansi', 'shankhapushpi'],
    depression: ['brahmi', 'ashwagandha', 'jatamansi', 'shatavari'],
    sleep: ['ashwagandha', 'jatamansi', 'brahmi', 'tagara'],
    insomnia: ['jatamansi', 'ashwagandha', 'tagara', 'brahmi'],
    memory: ['brahmi', 'shankhapushpi', 'jatamansi', 'jyotishmati'],
    focus: ['brahmi', 'shankhapushpi', 'jyotishmati'],
    fatigue: ['ashwagandha', 'shatavari', 'amla', 'guduchi'],
    weakness: ['ashwagandha', 'shatavari', 'amla', 'musali'],

    // Respiratory
    asthma: ['vasaka', 'kantakari', 'pippali', 'tulsi'],
    breathing: ['vasaka', 'kantakari', 'tulsi', 'hingu'],
    bronchitis: ['vasaka', 'pippali', 'tulsi', 'kantakari'],
    sinus: ['tulsi', 'pippali', 'hingu', 'maricha'],
    throat: ['yashtimadhu', 'tulsi', 'maricha', 'pippali'],

    // Urinary & kidney
    urinary: ['gokshura', 'punarnava', 'varuna', 'chandana'],
    kidney: ['punarnava', 'varuna', 'gokshura', 'pashanabheda'],
    uti: ['chandana', 'gokshura', 'punarnava', 'coriander'],
    bladder: ['gokshura', 'punarnava', 'chandana', 'varuna'],

    // Diabetes & blood sugar
    diabetes: ['gudmar', 'haridra', 'karaveera', 'vijaysar'],
    sugar: ['gudmar', 'vijaysar', 'haridra', 'karaveera'],
    blood: ['manjistha', 'guduchi', 'neem', 'haridra'],

    // Heart & circulation
    heart: ['arjuna', 'guggulu', 'punarnava', 'shankhapushpi'],
    cholesterol: ['guggulu', 'arjuna', 'haridra', 'amla'],
    bp: ['sarpagandha', 'arjuna', 'brahmi', 'shankhapushpi'],
    hypertension: ['sarpagandha', 'brahmi', 'arjuna', 'jatamansi'],

    // Women's health
    periods: ['shatavari', 'ashoka', 'lodhra', 'kumkum'],
    menstrual: ['shatavari', 'ashoka', 'lodhra', 'methika'],
    pcos: ['shatavari', 'ashoka', 'guduchi', 'haridra'],
    fertility: ['shatavari', 'ashwagandha', 'musali', 'kapikacchu'],
    menopause: ['shatavari', 'ashwagandha', 'ashoka'],

    // Hair & scalp
    hair: ['bhringraj', 'amla', 'japa', 'brahmi'],
    hairfall: ['bhringraj', 'amla', 'japa'],
    dandruff: ['neem', 'haridra', 'bhringraj'],
    baldness: ['bhringraj', 'amla', 'japa'],

    // Eye
    eye: ['triphala', 'amla', 'chandana', 'haridra'],
    vision: ['amla', 'triphala', 'jyotishmati'],

    // General immunity
    immunity: ['tulsi', 'amla', 'guduchi', 'ashwagandha', 'haridra'],
    immune: ['guduchi', 'tulsi', 'amla', 'ashwagandha'],
    detox: ['neem', 'haritaki', 'amla', 'bhumyamalaki'],
    energy: ['ashwagandha', 'shatavari', 'amla', 'musali'],
    stamina: ['ashwagandha', 'musali', 'kapikacchu', 'shatavari'],
    weight: ['guggulu', 'haritaki', 'triphala', 'methika'],
    obesity: ['guggulu', 'haritaki', 'methika', 'vijaysar'],

    // Thyroid
    thyroid: ['brahmi', 'ashwagandha', 'guggulu', 'jyotishmati'],

    // Bone
    bone: ['shallaki', 'guggulu', 'arjuna', 'haritaki'],
    calcium: ['shallaki', 'arjuna', 'amla'],
};

// Build a reverse map: plantId → score for a given query
function scoreQuery(query) {
    const lowerQuery = query.toLowerCase();
    const scores = {};

    for (const [keyword, plantIds] of Object.entries(SYMPTOM_KEYWORDS)) {
        if (lowerQuery.includes(keyword)) {
            plantIds.forEach((id, rank) => {
                scores[id] = (scores[id] || 0) + (plantIds.length - rank);
            });
        }
    }

    return scores;
}

export async function POST(req) {
    try {
        const { query, language } = await req.json();

        if (!query || !query.trim()) {
            return new Response(JSON.stringify({ error: "No query provided" }), { status: 400 });
        }

        const scores = scoreQuery(query.trim());
        const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

        if (ranked.length === 0) {
            return new Response(JSON.stringify({
                error: "No matching plant found for your query. Try keywords like 'fever', 'cough', 'joint pain', 'diabetes', 'stress', 'hairfall'."
            }), { status: 404 });
        }

        const [bestId] = ranked[0];
        const directories = ['plants', 'cereals', 'pulses'];
        let matchedFile = null;

        for (const dir of directories) {
            const filePath = path.join(process.cwd(), 'app', 'data', dir, `${bestId}.json`);
            try {
                await fs.access(filePath);
                matchedFile = filePath;
                break;
            } catch (e) { /* continue */ }
        }

        if (!matchedFile) {
            // Try variations
            for (const dir of directories) {
                const dirPath = path.join(process.cwd(), 'app', 'data', dir);
                try {
                    const files = await fs.readdir(dirPath);
                    for (const file of files) {
                        if (file.replace('.json', '').includes(bestId) || bestId.includes(file.replace('.json', ''))) {
                            matchedFile = path.join(dirPath, file);
                            break;
                        }
                    }
                } catch (e) { /* continue */ }
                if (matchedFile) break;
            }
        }

        if (!matchedFile) {
            return new Response(JSON.stringify({ error: `Plant '${bestId}' found in index but not in database.` }), { status: 404 });
        }

        const fileData = await fs.readFile(matchedFile, 'utf8');
        const fullData = JSON.parse(fileData);

        // Add which symptom matched
        const matchedKeywords = Object.keys(SYMPTOM_KEYWORDS).filter(k => query.toLowerCase().includes(k));
        fullData.ai_recommendation_explanation = `Recommended for: ${matchedKeywords.join(', ')} — based on traditional Ayurvedic use.`;

        // If non-English, use the plant API for translation (reuse same logic)
        if (language && language !== 'English') {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/plant?id=${bestId}&lang=${language}`
                );
                if (res.ok) {
                    const translated = await res.json();
                    translated.ai_recommendation_explanation = fullData.ai_recommendation_explanation;
                    return new Response(JSON.stringify(translated), {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    });
                }
            } catch (e) {
                console.error("Translation fetch failed, using English:", e.message);
            }
        }

        return new Response(JSON.stringify(fullData), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
