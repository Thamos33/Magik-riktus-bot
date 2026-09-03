import { Events, MessageFlags } from 'discord.js';
import { scheduleMessage } from '../utils/auto-send.js';

/**
 * Format attendu pour les dates : YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Event Listener principal pour la gestion de toutes les interactions
 */
export default {
  name: Events.InteractionCreate,

  /**
   * Exécute la logique de réception des interactions Discord
   *
   * @param {import('discord.js').Interaction} interaction - L'interaction reçue
   * @param {import('discord.js').Client} client - L'instance du client Discord
   * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
   * @returns {Promise<void>}
   */
  async execute(interaction, client, pool) {
    // --- 1. GESTION DES MODALES ---
    if (
      interaction.isModalSubmit() &&
      interaction.customId === 'msgdate_modal'
    ) {
      const content = interaction.fields.getTextInputValue('message_content');
      const date = interaction.fields.getTextInputValue('message_date').trim();

      // Validation du format de la date
      if (!DATE_REGEX.test(date)) {
        return interaction.reply({
          content:
            '❌ Format de date invalide. Utilise le format YYYY-MM-DD (ex: 2026-12-31).',
          flags: MessageFlags.Ephemeral,
        });
      }

      const temp = client.tempData?.get(interaction.user.id);

      if (!temp) {
        return interaction.reply({
          content:
            '❌ Impossible de retrouver les données associées. Réessaie la commande /msgdate.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const { channelId, fileUrl, publicId, roleId } = temp;

      try {
        await scheduleMessage(
          channelId,
          content,
          date,
          fileUrl,
          publicId,
          roleId,
          pool,
        );

        // Nettoyage de la mémoire temporaire du client
        client.tempData.delete(interaction.user.id);

        await interaction.reply({
          content: `✅ Message programmé pour le **${date}** à 00:01.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        console.error('❌ Erreur lors de la programmation du message :', err);
        await interaction.reply({
          content:
            '❌ Une erreur est survenue lors de la programmation du message en base de données.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    // --- 2. GESTION DES COMMANDES SLASH ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, pool);
      } catch (err) {
        console.error(
          `❌ Erreur lors de l'exécution de /${interaction.commandName} :`,
          err,
        );

        const errorMessage =
          '❌ Une erreur est survenue lors du traitement de la commande.';

        // Sécurisation de la réponse si la commande a déjà été différée (deferReply) ou répondue
        if (interaction.replied || interaction.deferred) {
          await interaction
            .followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        } else {
          await interaction
            .reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        }
      }
    }
  },
};
