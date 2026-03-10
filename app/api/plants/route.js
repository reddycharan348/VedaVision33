import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const directories = ['plants', 'cereals', 'pulses'];
        const plants = [];

        for (const dir of directories) {
            const dataDirectory = path.join(process.cwd(), 'app', 'data', dir);
            try {
                const filenames = await fs.readdir(dataDirectory);
                for (const filename of filenames) {
                    if (filename.endsWith('.json')) {
                        const filePath = path.join(dataDirectory, filename);
                        const fileContents = await fs.readFile(filePath, 'utf8');
                        try {
                            const data = JSON.parse(fileContents);
                            // We only need basic info for the dropdown list
                            plants.push({
                                id: data.id,
                                identity: data.name,
                                scientificName: data.scientific_name || data.scientificName,
                                emoji: "🌿" // We can keep a default emoji or extract if added to schema
                            });
                        } catch(e) {
                           console.error("Parse error for", filename);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error reading directory ${dir}:`, err);
            }
        }
        
        return new Response(JSON.stringify(plants), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to load plants registry.' }), { status: 500 });
    }
}
