import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getRanking } from '../utils/balance.js';

/**
 * Symboles pour les trois premiers du classement
 */
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Taille maximale d'utilisateurs par embed pour respecter les limites Discord
 */
const ITEMS_PER_PAGE = 20;

/**
 * Découpe un tableau en plusieurs sous-tableaux de taille fixe
 *
 * @template T
 * @param {T[]} array - Le tableau à découper
 * @param {number} size - La taille de chaque sous-tableau
 * @returns {T[][]}
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Configuration de la commande Slash /classementgeneral
 */
export const data = new SlashCommandBuilder()
  .setName('classementgeneral')
  .setDescription(
    'Affiche le classement complet des <:magikcoin:1545128700985614336>',
  );

/**
 * Exécute la commande /classementgeneral
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  await interaction.deferReply();

  try {
    const ranking = await getRanking(pool);
    const nonZeroRanking = ranking.filter((row) => Number(row.balance) > 0);

    if (nonZeroRanking.length === 0) {
      return interaction.editReply({
        content:
          '<:magikcoin:1545128700985614336> Personne ne possède de <:magikcoin:1545128700985614336> pour le moment !',
      });
    }

    const pages = chunkArray(nonZeroRanking, ITEMS_PER_PAGE);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageData = pages[pageIndex];
      const membersById = new Map();

      // Récupération des membres sur le serveur pour afficher leur pseudo exact
      if (interaction.guild) {
        try {
          // Correction : passage de row.userid à row.user_id
          const userIds = pageData.map((row) => row.user_id);
          const fetchedMembers = await interaction.guild.members.fetch({
            user: userIds,
          });
          fetchedMembers.forEach((member, id) => membersById.set(id, member));
        } catch {
          // Ignorer si certains utilisateurs ne sont plus sur le serveur
        }
      }

      const lines = pageData.map((row, index) => {
        const globalRank = pageIndex * ITEMS_PER_PAGE + index + 1;
        // Correction : passage de row.userid à row.user_id
        const member = membersById.get(row.user_id);
        const name = member
          ? member.displayName || member.user.username
          : `Utilisateur ${row.user_id}`;

        const prefix = MEDALS[globalRank - 1] || `**${globalRank}.**`;
        return `${prefix} **${name}** — **${row.balance}** <:magikcoin:1545128700985614336>`;
      });

      const embedTitle =
        pages.length > 1
          ? `🏆 Classement Général (${pageIndex + 1}/${pages.length}) 🏆`
          : '🏆 Classement Général 🏆';

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(lines.join('\n'))
        .setColor('#FFD700')
        .setTimestamp();

      if (pageIndex === 0) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.followUp({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la commande classementgeneral :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de l’affichage du classement général.',
    });
  }
}
