/**
 * Insère ou met à jour la soumission d'un utilisateur pour l'événement en cours
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {string} username - Le pseudo de l'utilisateur
 * @param {string} fileUrl - L'URL sécurisée Cloudinary de l'image
 * @param {string} publicId - L'identifiant public Cloudinary
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function updateSubmissions(
  userId,
  username,
  fileUrl,
  publicId,
  pool,
) {
  try {
    const query = `
      INSERT INTO submissions (user_id, username, file_path, public_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        file_path = EXCLUDED.file_path,
        public_id = EXCLUDED.public_id
    `;

    await pool.query(query, [userId, username, fileUrl, publicId]);
  } catch (error) {
    console.error(
      '❌ Erreur SQL lors de l’enregistrement de la soumission :',
      error,
    );
    throw new Error('Impossible d’enregistrer la participation.');
  }
}

/**
 * Récupère l'ensemble des soumissions enregistrées
 *
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<Array<{id: number, user_id: string, username: string, file_path: string, public_id: string}>>} La liste des participations
 */
export async function getSubmissions(pool) {
  try {
    const res = await pool.query(
      'SELECT id, user_id, username, file_path, public_id FROM submissions ORDER BY id ASC',
    );
    return res.rows;
  } catch (error) {
    console.error(
      '❌ Erreur SQL lors de la récupération des soumissions :',
      error,
    );
    throw new Error('Impossible de récupérer les participations.');
  }
}

/**
 * Récupère la soumission spécifique d'un utilisateur
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<{file_path: string, public_id: string}|undefined>} La soumission de l'utilisateur ou undefined
 */
export async function getSubmissionByUser(userId, pool) {
  try {
    const res = await pool.query(
      'SELECT file_path, public_id FROM submissions WHERE user_id = $1',
      [userId],
    );
    return res.rows[0];
  } catch (error) {
    console.error(
      '❌ Erreur SQL lors de la recherche de la soumission :',
      error,
    );
    throw new Error('Impossible de trouver la participation.');
  }
}
