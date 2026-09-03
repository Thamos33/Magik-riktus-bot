import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getBalance, getRanking } from '../utils/balance.js';

/**
 * Symboles pour le podium du classement
 */
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Configuration de la commande Slash /classement
 */
export const data = new SlashCommandBuilder()
  .setName('classement')
  .setDescription(
    'Affiche le top 10 des utilisateurs ayant le plus de Magik-Coins 🪙',
  );

/**
 * Exécute la commande /classement
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  await interaction.deferReply();

  try {
    const ranking = await getRanking(pool);
    const nonZeroRanking = ranking.filter((row) => row.balance > 0);

    if (nonZeroRanking.length === 0) {
      return interaction.editReply({
        content: '🪙 Personne ne possède de Magik-Coins pour le moment !',
      });
    }

    const top10 = nonZeroRanking.slice(0, 10);
    const myBalance = await getBalance(interaction.user.id, pool);
    const myIndex = nonZeroRanking.findIndex(
      (row) => row.userid === interaction.user.id,
    );

    const descriptionLines = [];

    // Affichage du rang de l'utilisateur qui lance la commande
    if (myBalance > 0 && myIndex !== -1) {
      descriptionLines.push(
        `**Ta place :** ${myIndex + 1}ᵉ avec **${myBalance}** Magik-Coins 🪙\n`,
      );
    } else {
      descriptionLines.push(
        "**Ta place :** Tu n'as pas encore de Magik-Coins 🪙.\n",
      );
    }

    descriptionLines.push('🏆 **Top 10 :**');

    // Construction de la liste des membres du Top 10
    top10.forEach((row, index) => {
      const prefix = MEDALS[index] || `**${index + 1}.**`;
      descriptionLines.push(
        `${prefix} <@${row.userid}> — **${row.balance}** Magik-Coins 🪙`,
      );
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Classement Magik-Coins 🏆')
      .setDescription(descriptionLines.join('\n'))
      .setColor('#FFD700')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande classement :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la récupération du classement.',
    });
  }
}
