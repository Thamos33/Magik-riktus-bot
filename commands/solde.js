import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getBalance } from '../utils/balance.js';

/**
 * Configuration de la commande Slash /solde
 */
export const data = new SlashCommandBuilder()
  .setName('solde')
  .setDescription("Affiche ton solde ou celui d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription('Mentionner un utilisateur')
      .setRequired(false),
  );

/**
 * Exécute la commande /solde
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  const target = interaction.options.getUser('utilisateur') || interaction.user;

  await interaction.deferReply();

  try {
    const balance = await getBalance(target.id, pool);

    // Récupération du pseudo serveur (displayName) s'il s'agit d'un membre du serveur
    let displayName = target.username;
    if (interaction.guild) {
      const member =
        interaction.options.getMember('utilisateur') ||
        (target.id === interaction.user.id ? interaction.member : null) ||
        (await interaction.guild.members.fetch(target.id).catch(() => null));

      if (member) displayName = member.displayName;
    }

    const isSelf = target.id === interaction.user.id;
    const embed = new EmbedBuilder()
      .setTitle(isSelf ? 'Mon solde' : `Le solde de ${displayName}`)
      .setDescription(`**${balance}** <:magikcoin:1545124652383469719>`)
      .setColor('#165416')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande solde :', error);
    await interaction.editReply({
      content: '❌ Impossible de récupérer le solde pour le moment.',
    });
  }
}
