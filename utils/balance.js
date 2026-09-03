/**
 * Récupère le solde de Magik-Coins d'un utilisateur
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<number>} Le solde actuel (0 si non trouvé)
 */
export async function getBalance(userId, pool) {
  try {
    const res = await pool.query(
      'SELECT balance FROM balances WHERE "userId" = $1',
      [userId],
    );
    return res.rows.length ? Number(res.rows[0].balance) : 0;
  } catch (error) {
    console.error('❌ Erreur SQL lors de la récupération du solde :', error);
    throw new Error('Impossible de récupérer le solde.');
  }
}

/**
 * Ajoute un montant au solde d'un utilisateur (crée l'entrée si inexistante)
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {number} amount - Le montant à ajouter
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function addBalance(userId, amount, pool) {
  try {
    await pool.query(
      `INSERT INTO balances ("userId", balance)
       VALUES ($1, $2)
       ON CONFLICT ("userId")
       DO UPDATE SET balance = balances.balance + EXCLUDED.balance`,
      [userId, amount],
    );
  } catch (error) {
    console.error('❌ Erreur SQL lors de l’ajout de solde :', error);
    throw new Error('Impossible de modifier le solde.');
  }
}

/**
 * Retire un montant au solde d'un utilisateur (crée l'entrée si inexistante)
 *
 * @param {string} userId - L'ID Discord de l'utilisateur
 * @param {number} amount - Le montant à retirer
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function removeBalance(userId, amount, pool) {
  try {
    await pool.query(
      `INSERT INTO balances ("userId", balance)
       VALUES ($1, $2)
       ON CONFLICT ("userId")
       DO UPDATE SET balance = balances.balance - EXCLUDED.balance`,
      [userId, amount],
    );
  } catch (error) {
    console.error('❌ Erreur SQL lors du retrait de solde :', error);
    throw new Error('Impossible de modifier le solde.');
  }
}

/**
 * Récupère le classement complet des utilisateurs trié par solde décroissant
 *
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<Array<{userid: string, balance: number}>>} La liste ordonnée des soldeurs
 */
export async function getRanking(pool) {
  try {
    const res = await pool.query(
      'SELECT "userId" AS userid, balance FROM balances ORDER BY balance DESC',
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
    await pool.query('DELETE FROM balances WHERE "userId" = $1', [userId]);
  } catch (error) {
    console.error('❌ Erreur SQL lors de la suppression du solde :', error);
    throw new Error('Impossible de supprimer le solde.');
  }
}
