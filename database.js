import sqlite3 from "sqlite3";
const sqlite = sqlite3.verbose();

// Le fichier balances.sqlite sera créé si inexistant
const db = new sqlite.Database("./data/balances.sqlite", (err) => {
  if (err) return console.error(err.message);
  console.log("✅ Connecté à la base SQLite");
});

// Créer la table si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS balances (
    userId TEXT PRIMARY KEY,
    balance INTEGER
  )
`);
