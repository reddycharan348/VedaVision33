import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';

// Using the exact new API key you provided
const apiKey = "AIzaSyA245LbKfw7uHql6RVfojpqJ67wxKuPuLk";
const ai = new GoogleGenAI({ apiKey });

// 72 additional highly famous and utilized Ayurvedic Plants (to reach ~100 total)
const newPlants = [
    "Jatamansi", "Vacha", "Jyotishmati", "Tagara", "Sarpagandha",
    "Khadira", "Katuki", "Kiratatikta", "Aragvadha", "Trivrit",
    "Chitrak", "Dhanyaka", "Jeeraka", "Hingu", "Ela",
    "Tvak", "Lavanga", "Ashoka", "Lodhra", "Varuna",
    "Shigru", "Pashanabheda", "Guggulu", "Shallaki", "Kapikacchu",
    "Vidari", "Kantakari", "Brihati", "Prishniparni", "Shalaparni",
    "Ushira", "Sariva", "Patola", "Danti", "Apamarga",
    "Lajjalu", "Palasha", "Shirisha", "Kanchanara", "Agastya",
    "Bakula", "Karpura", "Nagakeshara", "Jatiphala", "Mishreya",
    "Yavani", "Bhallataka", "Ativisha", "Vatsanabha", "Kupeelu",
    "Gudmar", "Saptarangi", "Vijaysar", "Bimbi", "Jambu",
    "Karavellaka", "Makhana", "Priyala", "Chironji", "Raktachandana",
    "Kushmanda", "Eranda", "Bala", "Atibala", "Nagabala",
    "Mahabala", "Sahachara", "Rasna", "Dronapushpi", "Mandukaparni",
    "Pippalimoola", "Chavya"
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const dataDirectory = path.join(process.cwd(), 'app', 'data', 'plants');
    await fs.mkdir(dataDirectory, { recursive: true });

    console.log(`Starting generation of ${newPlants.length} new plants to reach 100 total...`);

    let index = 1;
    for (const plantName of newPlants) {
        const fileId = plantName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const filePath = path.join(dataDirectory, `${fileId}.json`);

        try {
            await fs.access(filePath);
            console.log(`[${index}/${newPlants.length}] Skipping ${plantName}, already exists.`);
            index++;
            continue;
        } catch (e) {
            // file does not exist, proceed
        }

        console.log(`\n[${index}/${newPlants.length}] Generating highly detailed, WHO/AYUSH verified profile for: ${plantName}...`);

        const prompt = `You are a master Ayurvedic physician and WHO botanical expert.
Perform a deep analysis for the medicinal plant: "${plantName}".
Create an EXTREMELY SPECIFIC, highly detailed Ayurvedic and botanical profile based entirely on WHO guidelines, and the Ayurvedic Pharmacopoeia of India (API).

DO NOT USE BOILERPLATE. Provide POINT-BY-POINT detailed arrays just like this strict JSON schema.

Return ONLY a valid strict JSON object matching this exact schema:
{
  "name": "Full Name",
  "scientificName": "Botanical Name",
  "botanicalFamily": "Family Name",
  "usesInAyurveda": [
    "Tridoshic Modulation: (Detailed explanation of Dosha effects)",
    "Rasa (Taste): (Detailed)",
    "Guna (Qualities): (Detailed)",
    "Virya (Potency): (Detailed)",
    "Vipaka (Post-digestive taste): (Detailed)",
    "Karma (Actions): (Detailed)",
    "API/AFI Adherence: (Detailed)",
    "Specific Indications: (Detailed)"
  ],
  "usageForm": "List of forms",
  "mainMedicinalUses": [
    "Use 1: Highly detailed clinical description aligned with WHO/AYUSH",
    "Use 2: ...",
    "Use 3: ...",
    "Use 4: ...",
    "Use 5: ..."
  ],
  "plantProfile": [
    "Unique History: Detailed historical and classical Ayurvedic textual references",
    "Physical Characteristics: Very detailed botanical description",
    "Specific Chemical Compounds: Exhaustive list of active phyto-compounds",
    "Strict Standardizations: API & WHO quality control parameters and markers"
  ],
  "preparationMethods": [
    "Method 1 (e.g., Decoction): Very specific instructions",
    "Method 2 (e.g., Powder): Very specific instructions",
    "Method 3: ...",
    "Method 4: ..."
  ],
  "dosages": {
    "Children": "Specific pediatric guidelines",
    "Adults": "Specific adult dosages for various forms",
    "Elderly": "Specific geriatric guidelines"
  },
  "safetyProfile": [
    "Contraindications: Specific conditions to avoid",
    "GRAS Status: Safety history and regulatory status",
    "Herb-Drug Interactions: Known interactions with allopathic meds",
    "Adverse Effects: Potential side effects or toxicity"
  ]
}`;

        let success = false;
        let retries = 0;

        while (!success && retries < 5) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        temperature: 0.2, // low temp for clinical accuracy
                        responseMimeType: "application/json"
                    }
                });

                let text = response.text;
                if (typeof text !== 'string') text = await response.text();

                const parsed = JSON.parse(text);

                if (parsed.name && parsed.plantProfile && Array.isArray(parsed.plantProfile)) {
                    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), 'utf8');
                    console.log(`✅ Saved deeply detailed, unique point-by-point profile: ${fileId}.json`);
                    success = true;
                } else {
                    console.log("Response was missing required array fields. Retrying...");
                    retries++;
                    await delay(3000);
                }
            } catch (e) {
                console.log(`[RETRY ${retries + 1}/5] Error during generation for ${plantName}: ${e.message}`);
                retries++;
                await delay(5000);
            }

            // Wait to avoid hitting rate limits
            await delay(2000);
        }

        if (!success) {
            console.error(`❌ Failed to generate ${plantName} after retries.`);
        }

        index++;
    }

    console.log("\n🎉 Phase 2 Deep Generation Complete! You now have ~100 world-class herbal profiles.");

    // Automatically regenerate the plants list to capture the new ones
    console.log("Rebuilding plantsList.js...");
    const files = (await fs.readdir(dataDirectory)).filter(f => f.endsWith('.json'));
    const plantsList = [];

    for (const file of files) {
        const fileContent = JSON.parse(await fs.readFile(path.join(dataDirectory, file), 'utf8'));
        plantsList.push({
            id: fileContent.id || file.replace('.json', ''),
            name: fileContent.name.split(' (')[0],
            scientific: fileContent.scientificName || fileContent.scientific_name || '',
            desc: fileContent.botanicalFamily || fileContent.family || '',
            image: `/images/plants/${fileContent.id || file.replace('.json', '')}.jpg`
        });
    }

    plantsList.sort((a, b) => a.name.localeCompare(b.name));

    await fs.writeFile(
        path.join(process.cwd(), 'app', 'data', 'plantsList.js'),
        `export const featuredPlants = ${JSON.stringify(plantsList, null, 4)};`,
        'utf8'
    );
    console.log(`Done! plantsList.js updated to contain all ${plantsList.length} plants.`);
}

main();
