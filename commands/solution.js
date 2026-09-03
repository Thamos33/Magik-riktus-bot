import { SlashCommandBuilder } from 'discord.js';
import { deleteEnigme, getActiveEnigme } from '../utils/enigme.js';

/**
 * Normalise une chaîne de caractères (supprime les accents, la ponctuation, les majuscules et espaces superflus)
 *
 * @param {string} str - La chaîne à normaliser
 * @returns {string} La chaîne nettoyée
 */
function normalizeString(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Supprime la ponctuation
    .toLowerCase()
    .trim();
}

/**
 * Configuration de la commande Slash /solution
 */
export const data = new SlashCommandBuilder()
  .setName('solution')
  .setDescription('Proposer une réponse à l’énigme en cours')
  .addStringOption((option) =>
    option
      .setName('reponse')
      .setDescription('Votre proposition de réponse')
      .setRequired(true),
  );

/**
 * Exécute la commande /solution
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  await interaction.deferReply();

  try {
    const enigme = await getActiveEnigme(pool);

    if (!enigme) {
      return interaction.editReply({
        content: '❌ Il n’y a aucune énigme en cours pour le moment.',
      });
    }

    const userAnswer = normalizeString(
      interaction.options.getString('reponse'),
    );
    const correctAnswer = normalizeString(enigme.reponse);

    const displayName =
      interaction.member?.displayName || interaction.user.username;

    if (userAnswer === correctAnswer) {
      // Suppression de l'énigme résolue en BDD
      await deleteEnigme(pool);

      return interaction.editReply({
        content: `🎉 Félicitations ${displayName} ! Tu as trouvé la bonne réponse : **${enigme.reponse}** !`,
      });
    }

    await interaction.editReply({
      content: `❌ Dommage ${displayName}, ce n’est pas la bonne réponse. Essaie encore !`,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la solution :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la vérification de ta réponse.',
    });
  }
}
