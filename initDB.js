export default async function initDB(pool) {
  // Vérifie si la table existe déjà
  const res = await pool.query(`
    SELECT to_regclass('public.submissions') AS table_name;
  `);

  if (!res.rows[0].table_name) {
    console.log("📦 Création de la table 'submissions'...");

    await pool.query(`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        file_path TEXT NOT NULL,
        public_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Table 'submissions' créée !");
  } else {
    console.log(
      "🗂️ Table 'submissions' déjà existante, aucune action nécessaire."
    );
  }
}
