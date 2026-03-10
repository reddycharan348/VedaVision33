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

    console.log(`\x1b[36m[ENRICHING]\x1b[0m ${plantName} (${sciName})...`);

    const prompt = `
Generate a COMPREHENSIVE and SCIENTIFIC profile for ${plantName} (${sciName}) following WHO, API, and AYUSH standards.
The depth of detail MUST match the provided REFERENCE JSON (Agnimantha).

STRUCTURE:
1. "usesInAyurveda": Array of 7+ detailed points covering Dosha, Rasa, Guna, Virya, Vipaka, and Karma.
2. "mainMedicinalUses": Array of 7+ detailed points with clinical alignments.
3. "plantProfile": Array of 4 massive points covering History, Botany, Chemistry, and Standardization.
4. "preparationMethods": Array of 5+ specific instructions.
5. "dosages": Object with Children, Adults, Elderly specifics.
6. "safetyProfile": Array of 4+ detailed safety points.

REFERENCE:
${referenceData}

Return ONLY VALID JSON.
`;

    try {
        const responseData = await ai.models.generateContent({
            model: 'models/gemini-2.0-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const textResult = await responseData.text;
        const enrichedJson = JSON.parse(textResult);
        enrichedJson.id = fileName.replace('.json', '');

        fs.writeFileSync(filePath, JSON.stringify(enrichedJson, null, 2));
        console.log(`\x1b[32m[SUCCESS]\x1b[0m ${fileName} enriched to ${fs.statSync(filePath).size} bytes.`);
        return true;
    } catch (error) {
        if (error.message.includes('429')) {
            console.log("\x1b[33m[QUOTA]\x1b[0m Hitting rate limit. Sleeping for 45 seconds...");
            await new Promise(r => setTimeout(r, 45000));
            return await enrichPlant(fileName); // Retry once
        }
        console.error(`\x1b[31m[ERROR]\x1b[0m ${fileName}: ${error.message}`);
        return false;
    }
}

async function runEnrichment() {
    const files = fs.readdirSync(plantsDir).filter(f => f.endsWith('.json'));

    // Target only small files
    const targetFiles = files.filter(f => {
        const stats = fs.statSync(path.join(plantsDir, f));
        return stats.size < 5000 && f !== 'agnimantha.json';
    });

    console.log(`Starting deep enrichment for ${targetFiles.length} plants...\n`);

    // Process one by one with a delay to respect free tier
    for (const file of targetFiles) {
        const success = await enrichPlant(file);
        if (success) {
            console.log("Waiting 12 seconds before next plant...");
            await new Promise(r => setTimeout(r, 12000));
        } else {
            console.log("Skipping due to error. Waiting 5 seconds...");
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log("\nEnrichment phase complete!");
}

runEnrichment();
