/**
 * Programme un message à envoyer dans un canal Discord à une date donnée
 *
 * @param {string} channelId - L'identifiant du salon Discord
 * @param {string} content - Le texte du message à envoyer
 * @param {string} date - La date ciblée au format YYYY-MM-DD
 * @param {string|null} fileUrl - L'URL sécurisée de l'image (Cloudinary)
 * @param {string|null} publicId - L'ID public Cloudinary
 * @param {string|null} roleId - L'identifiant du rôle à mentionner
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function scheduleMessage(
  channelId,
  content,
  date,
  fileUrl,
  publicId,
  roleId,
  pool,
) {
  try {
    // Récupération de la date du jour au format YYYY-MM-DD en tenant compte du fuseau local
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    // Si la date saisie est passée, on programme au plus tôt (aujourd'hui)
    const sendDate = date < today ? today : date;

    const query = `
      INSERT INTO scheduled_messages (
        channel_id,
        content,
        send_at,
        file_path,
        public_id,
        role_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
      channelId,
      content,
      sendDate,
      fileUrl || null,
      publicId || null,
      roleId || null,
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('❌ Erreur SQL lors de la programmation du message :', error);
    throw new Error('Impossible d’enregistrer le message en base de données.');
  }
}
