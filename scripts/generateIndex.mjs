import fs from 'fs';
import path from 'path';

/**
 * VedaVision Index Generator
 * Crawls through all JSON data files (plants, cereals, pulses) 
 * and builds a high-speed keyword index for the Diagnosis Engine.
 */

const baseDir = './app/data';
const dirs = ['plants', 'cereals', 'pulses'];
const index = {};

// Common words to exclude from indexing
const stopWords = new Set([
    'and', 'the', 'for', 'with', 'from', 'this', 'that', 'used', 'are', 'was', 'were', 'been', 'has', 'have', 'had',
    'not', 'but', 'can', 'may', 'will', 'shall', 'should', 'would', 'could', 'some', 'any', 'all', 'such', 'this',
    'that', 'these', 'those', 'also', 'more', 'most', 'very', 'than', 'into', 'upon', 'about', 'above', 'below',
    'under', 'over', 'between', 'among', 'through', 'during', 'before', 'after', 'since', 'while', 'when', 'where',
    'how', 'why', 'what', 'who', 'which', 'whom', 'whose', 'their', 'them', 'they', 'your', 'ours', 'ourselves',
    'themselves', 'each', 'other', 'another', 'many', 'much', 'few', 'less', 'few', 'each', 'either', 'neither',
    'both', 'such', 'only', 'own', 'same', 'so', 'too', 'very', 'once', 'twice', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'its', 'every', 'everyone', 'everything', 'everywhere', 'well', 'best', 'good',
    'treatment', 'medicinal', 'properties', 'ayurvedic', 'traditional', 'medicine', 'highly', 'effective', 'helps'
]);

dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        if (!file.endsWith('.json')) return;
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const id = file.replace('.json', '');
        
        // Extract searchable tokens from the whole JSON
        const rawContent = JSON.stringify(data).toLowerCase();
        const tokens = rawContent.match(/[a-z]{3,}/g) || [];
        
        const tokenMap = {};
        tokens.forEach(t => {
            if (!stopWords.has(t)) {
                tokenMap[t] = (tokenMap[t] || 0) + 1;
            }
        });

        Object.entries(tokenMap).forEach(([token, count]) => {
            if (!index[token]) index[token] = [];
            index[token].push({ 
                id, 
                score: count, 
                name: data.summary?.name || data.plant?.name || data.name || id
            });
        });
    });
});

// Sort and limit results per keyword to keep index size manageable
Object.keys(index).forEach(kw => {
    index[kw].sort((a,b) => b.score - a.score);
    if (index[kw].length > 100) index[kw] = index[kw].slice(0, 100);
});

const outputPath = path.join(baseDir, 'keywordIndex.json');
fs.writeFileSync(outputPath, JSON.stringify(index));

console.log(`✅ Success: Index generated at ${outputPath}`);
console.log(`🔍 Total unique keywords indexed: ${Object.keys(index).length}`);
