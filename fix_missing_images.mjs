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

const UNSP_FALLBACKS = [
    'https://images.unsplash.com/photo-1466692476877-3bc056562d29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1453904300235-0f2f60b15b5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    });
}

async function main() {
    let fixed = 0;
    for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];
        const localPath = path.join(__dirname, 'public', plant.image);
        
        let needsFix = false;
        if (fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            if (stat.size < 15000) {
                needsFix = true;
            }
        } else {
            needsFix = true;
        }

        if (needsFix) {
            console.log(`Fixing missing/broken image for: ${plant.name}`);
            const fallbackUrl = UNSP_FALLBACKS[fixed % UNSP_FALLBACKS.length];
            try {
                await downloadImage(fallbackUrl, localPath);
                fixed++;
            } catch(e) {
                console.log(`Failed to download fallback for ${plant.name}: ${e.message}`);
            }
        }
    }
    console.log(`Successfully fixed ${fixed} images with high-quality botanical fallbacks!`);
}

main();
