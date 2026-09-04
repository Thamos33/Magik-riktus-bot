/**
 * Récupère le solde d'un utilisateur
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<number>} Le solde actuel (0 si non trouvé)
 */
export async function getBalance(userId, pool) {
  try {
    const res = await pool.query(
      'SELECT balance FROM balances WHERE user_id = $1',
      [userId],
    );
    return res.rows.length ? Number(res.rows[0].balance) : 0;
  } catch (error) {
    console.error('❌ Erreur SQL lors de la récupération du solde :', error);
    throw new Error('Impossible de récupérer le solde.');
  }
}

/**
 * Ajoute un montant au solde d'un utilisateur et met à jour son nom
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {number} amount - Le montant à ajouter
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @param {string|null} username - Le pseudo Discord (optionnel)
 * @returns {Promise<void>}
 */
export async function addBalance(userId, amount, pool, username = null) {
  try {
    if (username) {
      await pool.query(
        `INSERT INTO balances (user_id, balance, username)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET
           balance = balances.balance + EXCLUDED.balance,
           username = EXCLUDED.username`,
        [userId, amount, username],
      );
    } else {
      await pool.query(
        `INSERT INTO balances (user_id, balance)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET balance = balances.balance + EXCLUDED.balance`,
        [userId, amount],
      );
    }
  } catch (error) {
    console.error('❌ Erreur SQL lors de l’ajout de solde :', error);
    throw new Error('Impossible de modifier le solde.');
  }
}

/**
 * Retire un montant au solde d'un utilisateur
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {number} amount - Le montant à retirer
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function removeBalance(userId, amount, pool) {
  try {
    await pool.query(
      `INSERT INTO balances (user_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET balance = GREATEST(0, balances.balance - EXCLUDED.balance)`,
      [userId, amount],
    );
  } catch (error) {
    console.error('❌ Erreur SQL lors du retrait de solde :', error);
    throw new Error('Impossible de modifier le solde.');
  }
}

/**
 * Incrémente le compteur de parties jouées (+1)
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @param {string|null} username - Le pseudo Discord (optionnel)
 * @returns {Promise<void>}
 */
export async function incrementGamesPlayed(userId, pool, username = null) {
  try {
    if (username) {
      await pool.query(
        `INSERT INTO balances (user_id, balance, games_played, username)
         VALUES ($1, 0, 1, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET
           games_played = balances.games_played + 1,
           username = EXCLUDED.username`,
        [userId, 0, username],
      );
    } else {
      await pool.query(
        `INSERT INTO balances (user_id, balance, games_played)
         VALUES ($1, 0, 1)
         ON CONFLICT (user_id)
         DO UPDATE SET games_played = balances.games_played + 1`,
        [userId, 0, 1],
      );
    }
  } catch (error) {
    console.error(
      '❌ Erreur SQL lors de l’incrémentation des parties :',
      error,
    );
    throw new Error('Impossible d’incrémenter le nombre de parties.');
  }
}

/**
 * Récupère le classement complet
 *
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<Array<{user_id: string, balance: number, username: string, games_played: number}>>}
 */
export async function getRanking(pool) {
  try {
    const res = await pool.query(
      'SELECT user_id, username, balance, games_played FROM balances ORDER BY balance DESC',
    );
    return res.rows;
  } catch (error) {
    console.error(
      '❌ Erreur SQL lors de la récupération du classement :',
      error,
    );
    throw new Error('Impossible de récupérer le classement.');
  }
}

/**
 * Supprime le solde d'un utilisateur
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function deleteBalance(userId, pool) {
  try {
    await pool.query('DELETE FROM balances WHERE user_id = $1', [userId]);
  } catch (error) {
    console.error('❌ Erreur SQL lors de la suppression du solde :', error);
    throw new Error('Impossible de supprimer le solde.');
  }
}
