export default async function initDB(pool) {
  console.log("⚠️ Réinitialisation complète de la table 'submissions'...");

  await pool.query(`DROP TABLE IF EXISTS submissions;`);

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

  console.log("✅ Table 'submissions' recréée avec succès !");
}
