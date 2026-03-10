import fs from 'fs';
import path from 'path';

const plantsDir = path.join(process.cwd(), 'app', 'data', 'plants');
const files = fs.readdirSync(plantsDir).filter(f => f.endsWith('.json'));

const plantsList = files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(plantsDir, file), 'utf-8'));
    return {
        id: data.id || file.replace('.json', ''),
        name: data.name.split(' (')[0],
        scientific: data.scientificName || data.scientific_name || '',
        desc: data.botanicalFamily || data.family || '',
        image: `/images/plants/${data.id || file.replace('.json', '')}.jpg`
    };
});

fs.writeFileSync(path.join(process.cwd(), 'app', 'data', 'plantsList.js'), `export const featuredPlants = ${JSON.stringify(plantsList, null, 4)};`);
console.log('Generated app/data/plantsList.js with ' + plantsList.length + ' plants.');
