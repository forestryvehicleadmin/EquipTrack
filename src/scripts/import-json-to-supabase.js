const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

(async function() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env to import');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'equipment.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('No generated JSON file at', jsonPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const rows = JSON.parse(raw);
  console.log(`Importing ${rows.length} rows to Supabase`);
  for (const r of rows) {
    const row = {
      equipmenttypeid: r.EquipmentTypeID || null,
      name: r.Name || null,
      category: r.Category || null,
      quantity_good: parseInt(r.Quantity_Good, 10) || 0,
      quantity_fair: parseInt(r.Quantity_Fair, 10) || 0,
      quantity_poor: parseInt(r.Quantity_Poor, 10) || 0,
      quantity_broken: parseInt(r.Quantity_Broken, 10) || 0,
      totalquantity: parseInt(r.TotalQuantity, 10) || 0,
      base_location: r.BaseLocation || null,
      quantity_storage: parseInt(r.Quantity_Storage, 10) || 0,
      quantity_lockers: parseInt(r.Quantity_lockers, 10) || 0,
      quantity_checkout: parseInt(r.Quantity_checkout, 10) || 0,
      notes: r.Notes || null,
    };
    const { error } = await supabase.from('equipment').insert([row]);
    if (error) console.error('Insert error', error);
  }
  console.log('Import finished');
})();
