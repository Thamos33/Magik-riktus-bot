// utils/enigme.js
export async function getActiveEnigme(pool) {
  const res = await pool.query('SELECT * FROM enigmes LIMIT 1');
  return res.rows[0] || null;
}

export async function createEnigme(question, reponse, pool) {
  // Vérifie qu'il n'y a pas déjà une énigme
  const existing = await getActiveEnigme(pool);
  if (existing) {
    throw new Error('Une énigme est déjà en cours');
  }

  const res = await pool.query(
    'INSERT INTO enigmes(question, reponse) VALUES($1, $2) RETURNING *',
    [question, reponse],
  );

  return res.rows[0];
}

export async function deleteEnigme(pool) {
  await pool.query('DELETE FROM enigmes');
}
