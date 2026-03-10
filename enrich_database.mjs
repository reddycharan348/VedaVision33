import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const apiKey = "AIzaSyA245LbKfw7uHql6RVfojpqJ67wxKuPuLk";
const ai = new GoogleGenAI({ apiKey });

const plantsDir = path.join(process.cwd(), 'app', 'data', 'plants');
const referenceFile = path.join(plantsDir, 'agnimantha.json');
const referenceData = fs.readFileSync(referenceFile, 'utf-8');

async function enrichPlant(fileName) {
    const filePath = path.join(plantsDir, fileName);
    const currentContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const plantName = currentContent.name;
    const sciName = currentContent.scientificName;

    console.log(`Enriching ${plantName} (${sciName})...`);

    const prompt = `
Generate a HIGHLY DETAILED, SCIENTIFIC, and CLINICALLY RIGOROUS JSON profile for the medicinal plant: "${plantName}" (Scientific Name: "${sciName}").

STRICT RULES:
1. Follow the structure and depth of the provided REFERENCE JSON (Agnimantha) EXACTLY.
2. Every field (usesInAyurveda, mainMedicinalUses, plantProfile, preparationMethods, safetyProfile) MUST be an array of detailed points (minimum 5-7 points per section).
3. The content MUST be accurate, professional, and based on WHO, API, and AYUSH standards.
4. Include scientific terminology and specific chemical markers.
5. Provide specific dosages for Children, Adults, and Elderly in the 'dosages' object.
6. The output MUST be a valid JSON object ONLY.

REFERENCE FORMAT:
${referenceData}

Return ONLY the JSON for ${plantName}.
`;

    try {
        const responseData = await ai.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        let text = responseData.text;
        if (typeof text !== 'string') text = await responseData.text();

        const enrichedJson = JSON.parse(text);

        // Ensure the ID and basic names are preserved
        enrichedJson.id = fileName.replace('.json', '');

        fs.writeFileSync(filePath, JSON.stringify(enrichedJson, null, 2));
        console.log(`✓ Successfully enriched ${fileName}`);
        return true;
    } catch (error) {
        console.error(`✗ Error enriching ${fileName}:`, error.message);
        return false;
    }
}

async function runEnrichment() {
    const files = fs.readdirSync(plantsDir).filter(f => f.endsWith('.json'));

    // PRIORITY: Enrichment for all plants that are significantly smaller than the reference
    const smallFiles = files.filter(f => {
        const stats = fs.statSync(path.join(plantsDir, f));
        // Agnimantha is ~8.5KB. We target anything less than 6KB to ensure depth.
        return stats.size < 6000 && f !== 'agnimantha.json';
    });

    console.log(`Found ${smallFiles.length} plants that need depth enrichment.`);

    const batchSize = 5;
    for (let i = 0; i < smallFiles.length; i += batchSize) {
        const batch = smallFiles.slice(i, i + batchSize);
        console.log(`\n--- Processing Batch ${Math.floor(i / batchSize) + 1} (${batch.length} plants) ---`);

        await Promise.all(batch.map(file => enrichPlant(file)));

        console.log("Waiting 5 seconds between batches...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("\nEnrichment process complete!");
}

runEnrichment();
