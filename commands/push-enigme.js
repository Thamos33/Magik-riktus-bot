import { SlashCommandBuilder } from 'discord.js';
import { getActiveEnigme } from '../utils/enigme.js';

/**
 * Configuration de la commande Slash /push-enigme
 */
export const data = new SlashCommandBuilder()
  .setName('push-enigme')
  .setDescription('Publier ou rappeler l’énigme en cours dans le salon actuel');

/**
 * Exécute la commande /push-enigme
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
        content: '❌ Il n’y a aucune énigme active pour le moment.',
      });
    }

    const messageContent = [
      `🧩 **Énigme en cours :**`,
      `> ${enigme.question}`,
      '',
      '💡 Pour proposer une réponse, utilisez la commande **/solution** !',
      '📢 Pour réafficher cette question plus tard, utilisez la commande **/push-enigme**.',
    ].join('\n');

    await interaction.editReply({ content: messageContent });
  } catch (error) {
    console.error('❌ Erreur lors de l’affichage de l’énigme :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la récupération de l’énigme.',
    });
  }
}
