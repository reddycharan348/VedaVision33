import fs from 'fs/promises';
import path from 'path';

// Load the dynamically generated index
const INDEX_PATH = path.join(process.cwd(), 'app', 'data', 'keywordIndex.json');

export async function POST(req) {
    try {
        const { query, language } = await req.json();

        if (!query || !query.trim()) {
            return new Response(JSON.stringify({ error: "No query provided" }), { status: 400 });
        }

        const lowerQuery = query.trim().toLowerCase();
        // Tokenize the input query (e.g. "fever and cold" -> ["fever", "cold"])
        const queryTokens = lowerQuery.match(/[a-z]{3,}/g) || [];
        
        if (queryTokens.length === 0) {
            return new Response(JSON.stringify({ error: "Query is too short or contains no valid keywords." }), { status: 400 });
        }

        let index = {};
        try {
            const indexData = await fs.readFile(INDEX_PATH, 'utf8');
            index = JSON.parse(indexData);
        } catch (e) {
            console.error("Index not found.");
            return new Response(JSON.stringify({ error: "Search index is being updated. Please try again." }), { status: 503 });
        }

        const plantScores = {}; // plantId -> { id, score, name, matchedKeywords: [] }

        // FAST LOOKUP: Instead of iterating the index, we lookup query tokens
        queryTokens.forEach(token => {
            const matches = index[token];
            if (matches) {
                matches.forEach(match => {
                    if (!plantScores[match.id]) {
                        plantScores[match.id] = { 
                            id: match.id,
                            score: 0, 
                            name: match.name, 
                            matchedKeywords: new Set() 
                        };
                    }
                    // Boost score based on matches
                    plantScores[match.id].score += match.score;
                    plantScores[match.id].matchedKeywords.add(token);
                });
            }
        });

        // Convert to array and apply a "coverage boost"
        // Plants that match MORE of the user's search terms should rank higher
        const ranked = Object.values(plantScores)
            .map(p => {
                const uniqueMatchedCount = p.matchedKeywords.size;
                return { 
                    ...p, 
                    matchedKeywords: Array.from(p.matchedKeywords),
                    // Multiplier for matching multiple symptoms
                    finalScore: p.score * (1 + (uniqueMatchedCount - 1) * 2) 
                };
            })
            .sort((a, b) => b.finalScore - a.finalScore);

        if (ranked.length === 0) {
            return new Response(JSON.stringify({
                error: "Manuscripts do not mention these exact symptoms. Try simpler terms like 'fever', 'pain', or 'digestion'."
            }), { status: 404 });
        }

        // Return top 8 results for a broader "everything related" feel
        const topResults = ranked.slice(0, 8);
        
        return new Response(JSON.stringify({
            type: 'diagnosis_results',
            query: query,
            results: topResults,
            explanation: `Our ancient texts suggest these remedies for your symptoms: ${queryTokens.join(', ')}. Found ${ranked.length} total matches.`
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
