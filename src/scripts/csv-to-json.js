const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

(async function() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'equipment.csv');
    const outDir = path.join(process.cwd(), 'src', 'data');
    const outPath = path.join(outDir, 'equipment.json');

    const csv = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const data = parsed.data || [];

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Converted ${csvPath} -> ${outPath} (${data.length} rows)`);
  } catch (err) {
    console.error('Failed to convert CSV to JSON:', err);
    process.exit(1);
  }
})();
