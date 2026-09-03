import cron from 'node-cron';
import cloudinary from './cloudinary.js';

/**
 * Démarre le planificateur de tâches (cron) pour l'envoi automatique des messages programmés
 *
 * @param {import('discord.js').Client} client - L'instance du client Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 */
export function startScheduler(client, pool) {
  // Exécution du cron chaque heure au début de l'heure
  cron.schedule(
    '0 * * * *',
    async () => {
      try {
        // Date actuelle en ISO YYYY-MM-DD ajustée sur le fuseau horaire de Paris
        const now = new Date();
        const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];

        // Récupération des messages dus
        const { rows } = await pool.query(
          `SELECT * FROM scheduled_messages WHERE sent = FALSE AND send_at <= $1`,
          [today],
        );

        if (rows.length === 0) return;

        for (const msg of rows) {
          try {
            const channel = await client.channels.fetch(msg.channel_id);

            if (!channel) {
              console.error(
                `❌ Salon introuvable pour le message ID ${msg.id}`,
              );
              continue;
            }

            // Envoi du message dans le salon Discord
            await channel.send({
              content: msg.role_id
                ? `<@&${msg.role_id}>\u200B\n${msg.content}`
                : msg.content,
              allowedMentions: { parse: ['users', 'roles', 'everyone'] },
              files: msg.file_path ? [msg.file_path] : [],
            });

            // Nettoyage sur Cloudinary si une image était jointe
            if (msg.public_id) {
              try {
                const deleteResult = await cloudinary.api.delete_resources([
                  msg.public_id,
                ]);
                console.log(
                  '🧹 Image Cloudinary supprimée :',
                  deleteResult.deleted,
                );
              } catch (cloudinaryError) {
                console.error(
                  `⚠️ Erreur suppression Cloudinary pour le message #${msg.id} :`,
                  cloudinaryError,
                );
              }
            }

            // Suppression du message expédié en BDD
            await pool.query('DELETE FROM scheduled_messages WHERE id = $1', [
              msg.id,
            ]);
          } catch (msgError) {
            console.error(
              `❌ Erreur lors de l'envoi du message programmé #${msg.id} :`,
              msgError,
            );
          }
        }
      } catch (cronError) {
        console.error(
          "❌ Erreur globale lors de l'exécution du cron scheduler :",
          cronError,
        );
      }
    },
    {
      timezone: 'Europe/Paris',
    },
  );
}
