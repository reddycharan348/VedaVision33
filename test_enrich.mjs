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
Generate a HIGHLY DETAILED, SCIENTIFIC, and CLINICALLY RIGOROUS JSON profile for: "${plantName}" (Scientific Name: "${sciName}").
MATCH THE SCALE AND DEPTH OF AGNIMANTHA REFERENCE. 

RULES:
1. "usesInAyurveda": min 7 detailed points.
2. "mainMedicinalUses": min 7 detailed points.
3. "plantProfile": min 4 massive points.
4. "preparationMethods": min 5 detailed points.
5. "safetyProfile": min 4 detailed points.
6. Return VALID JSON ONLY.

REFERENCE:
${referenceData}
`;

    let retries = 0;
    while (retries < 3) {
        try {
            const responseData = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            let text = responseData.text;
            if (typeof text !== 'string') text = await responseData.text();

            const enrichedJson = JSON.parse(text);
            enrichedJson.id = fileName.replace('.json', '');

            fs.writeFileSync(filePath, JSON.stringify(enrichedJson, null, 2));
            console.log(`✓ Successfully enriched ${fileName} (${fs.statSync(filePath).size} bytes)`);
            return true;
        } catch (error) {
            console.error(`✗ Attempt ${retries + 1} failed for ${fileName}: ${error.message}`);
            if (error.message.includes('429')) {
                console.log("Hitting quota. Waiting 60 seconds...");
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    return false;
}

async function run() {
    // Only one for testing
    await enrichPlant('agastya.json');
}

run();
