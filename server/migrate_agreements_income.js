const db = require('./db/database');

try {
  db.prepare("ALTER TABLE agreements ADD COLUMN monthly_income REAL").run();
  console.log("Added monthly_income to agreements");
} catch (e) {
  console.log("monthly_income already exists or error:", e.message);
}

try {
  db.prepare("ALTER TABLE agreements ADD COLUMN executed_date TEXT").run();
  console.log("Added executed_date to agreements");
} catch (e) {
  console.log("executed_date already exists or error:", e.message);
}

// Update Sanchita's agreement with monthly income 45000 and start date 2026-09-01
const client = db.prepare("SELECT * FROM clients WHERE name LIKE '%SANCHITA%'").get();
if (client) {
  db.prepare("UPDATE clients SET monthly_income = 45000, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(client.id);
  db.prepare("UPDATE agreements SET monthly_income = 45000, start_date = '2026-09-01', executed_date = '2026-09-01', updated_at = CURRENT_TIMESTAMP WHERE client_id = ?").run(client.id);
  console.log("Updated Sanchita agreement and client monthly_income to 45000 and start_date to 2026-09-01");
}
