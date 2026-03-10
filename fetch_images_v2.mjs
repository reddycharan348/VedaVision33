import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plantsListPath = path.join(__dirname, 'app/data/plantsList.js');
const content = fs.readFileSync(plantsListPath, 'utf-8');
const startIdx = content.indexOf('export const featuredPlants = [');
const endIdx = content.lastIndexOf('];');
const arrayStr = content.substring(startIdx + 'export const featuredPlants = '.length, endIdx + 1);

let plants = [];
try { plants = eval(arrayStr); } catch(e) { process.exit(1); }

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'VedaVision/2.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve(null); } });
        }).on('error', reject);
    });
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'VedaVision/2.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    });
}

async function getSearchImage(searchTerm) {
    if (!searchTerm) return null;
    const encoded = encodeURIComponent(searchTerm);
    // Use generator=search to search Wikipedia and prop=pageimages for the results
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrlimit=3&prop=pageimages&format=json&pithumbsize=600`;
    try {
        const data = await fetchJson(url);
        if (data && data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            for (const page of pages) {
                if (page.thumbnail && page.thumbnail.source && !page.thumbnail.source.includes('Question_book') && !page.thumbnail.source.includes('Ambox') && !page.thumbnail.source.includes('Commons-logo')) {
                    return page.thumbnail.source;
                }
            }
        }
    } catch (e) {}
    return null;
}

const GENERIC_PLANT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/A_branch_of_a_neem_tree.jpg/600px-A_branch_of_a_neem_tree.jpg';

async function main() {
    let updated = 0;
    for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];
        const localPath = path.join(__dirname, 'public', plant.image);
        
        let isPlaceholder = false;
        if (fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            // If the file is very small or exactly the size of the UI-avatars placeholder, mark it to be updated
            if (stat.size < 15000) {
                isPlaceholder = true;
            }
        } else {
            isPlaceholder = true;
        }

        if (isPlaceholder) {
            console.log(`[${i+1}/${plants.length}] Finding better image for ${plant.name}...`);
            
            // Search strategy
            let scientificBase = plant.scientific.split(' ').slice(0, 2).join(' ').replace(/\(.*?\)/g, '').trim();
            let imgUrl = await getSearchImage(scientificBase);
            if (!imgUrl) imgUrl = await getSearchImage(plant.name + " medicinal plant");
            if (!imgUrl) imgUrl = await getSearchImage(plant.scientific.split(' ')[0]);
            
            if (imgUrl) {
                try {
                    await downloadImage(imgUrl, localPath);
                    console.log(`  -> Success! Fetched real image from Wikipedia.`);
                    updated++;
                } catch(e) {
                    console.log(`  -> Failed to download: ${e.message}`);
                }
            } else {
                console.log(`  -> Still no exact image found. Using beautiful generic botanical photo.`);
                try {
                    await downloadImage(GENERIC_PLANT_IMAGE, localPath);
                    updated++;
                } catch(e) {}
            }
        }
    }
    console.log(`Done. Updated ${updated} images from placeholders to real photos.`);
}

main();
