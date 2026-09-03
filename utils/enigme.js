/**
 * Récupère l'énigme active actuellement en base de données
 *
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<{id: number, question: string, reponse: string}|null>} L'énigme active ou null
 */
export async function getActiveEnigme(pool) {
  try {
    const res = await pool.query('SELECT * FROM enigmes LIMIT 1');
    return res.rows[0] || null;
  } catch (error) {
    console.error('❌ Erreur SQL lors de la récupération de l’énigme :', error);
    throw new Error('Impossible de récupérer l’énigme active.');
  }
}

/**
 * Crée une nouvelle énigme en base de données s'il n'y en a pas déjà une en cours
 *
 * @param {string} question - La question ou l'énoncé de l'énigme
 * @param {string} reponse - La réponse attendue
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<{id: number, question: string, reponse: string}>} L'énigme enregistrée
 */
export async function createEnigme(question, reponse, pool) {
  try {
    const existing = await getActiveEnigme(pool);
    if (existing) {
      throw new Error('Une énigme est déjà en cours.');
    }

    const res = await pool.query(
      'INSERT INTO enigmes (question, reponse) VALUES ($1, $2) RETURNING *',
      [question, reponse],
    );

    return res.rows[0];
  } catch (error) {
    console.error('❌ Erreur SQL lors de la création de l’énigme :', error);
    throw error;
  }
}

/**
 * Supprime l'énigme active (lorsqu'elle est résolue ou réinitialisée)
 *
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function deleteEnigme(pool) {
  try {
    await pool.query('DELETE FROM enigmes');
  } catch (error) {
    console.error('❌ Erreur SQL lors de la suppression de l’énigme :', error);
    throw new Error('Impossible de supprimer l’énigme.');
  }
}
