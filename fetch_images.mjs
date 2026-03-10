import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = fs.readFileSync(path.join(__dirname, 'app/data/plantsList.js'), 'utf-8');
const startIdx = content.indexOf('export const featuredPlants = [');
const endIdx = content.lastIndexOf('];');
const arrayStr = content.substring(startIdx + 'export const featuredPlants = '.length, endIdx + 1);

let plants = [];
try {
    plants = eval(arrayStr);
} catch(e) {
    console.error("Eval failed", e);
    process.exit(1);
}

const outDir = path.join(__dirname, 'public/images/plants');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'VedaVision Botanist/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'VedaVision Botanist/1.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
                return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function getWikiImage(scientific, name) {
    let genusSpeciesStr = scientific.split(' ').slice(0, 2).join(' ');
    genusSpeciesStr = genusSpeciesStr.replace(/\(.*?\)/g, '').trim();
    let genusStr = scientific.split(' ')[0].replace(/\(.*?\)/g, '').trim();

    const terms = [
        genusSpeciesStr,
        genusStr,
        name
    ];
    
    for (const term of terms) {
        if (!term) continue;
        const encoded = encodeURIComponent(term);
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&format=json&pithumbsize=600`;
        try {
            const data = await fetchJson(url);
            if(!data || !data.query || !data.query.pages) continue;
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== "-1" && pages[pageId].thumbnail) {
                return pages[pageId].thumbnail.source;
            }
        } catch (e) {
            // ignore
        }
    }
    return null;
}

async function fallbackPlaceholder(name, localPath) {
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0e4429&color=fff&size=512&font-size=0.4`;
    try {
        await downloadImage(placeholderUrl, localPath);
    } catch(e) {
        console.log(`  -> Error downloading placeholder: ${e.message}`);
    }
}

async function main() {
    console.log(`Processing ${plants.length} plants...`);
    let downloaded = 0;
    
    for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];
        const localPath = path.join(__dirname, 'public', plant.image);
        
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        
        if (fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            if (stat.size > 2000) {
                continue;
            }
        }
        
        console.log(`[${i+1}/${plants.length}] Fetching image for ${plant.name}...`);
        
        let imgUrl = await getWikiImage(plant.scientific, plant.name);
        
        if (imgUrl) {
            try {
                await downloadImage(imgUrl, localPath);
                downloaded++;
            } catch (e) {
                console.log(`  -> Error downloading image: ${e.message}`);
                await fallbackPlaceholder(plant.name, localPath);
                downloaded++;
            }
        } else {
            console.log(`  -> No image found on Wikipedia. Using placeholder.`);
            await fallbackPlaceholder(plant.name, localPath);
            downloaded++;
        }
        await new Promise(r => setTimeout(r, 100)); // slight throttling
    }
    
    console.log(`Done! Downloaded ${downloaded} new images/placeholders.`);
}

main();
