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

    console.log(`Enriching ${plantName} (${sciName}) using models/gemini-1.5-flash...`);

    const prompt = `
Generate a HIGHLY DETAILED medical JSON for: ${plantName} (${sciName}).
MATCH THE SCALE OF AGNIMANTHA.
${referenceData}
`;

    try {
        const responseData = await ai.models.generateContent({
            model: 'models/gemini-1.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const text = await responseData.text;
        console.log("SUCCESS!");
        console.log(text.substring(0, 100));
        return true;
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        return false;
    }
}

enrichPlant('agastya.json');
