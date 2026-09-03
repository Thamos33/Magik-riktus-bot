import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { getBalance, removeBalance } from '../utils/balance.js';

/**
 * Configuration de la commande Slash /removecoin
 */
export const data = new SlashCommandBuilder()
  .setName('removecoin')
  .setDescription("Retire des Magik-Coins 🪙 d'un utilisateur (Admin)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription("L'utilisateur qui perdra les Magik-Coins 🪙")
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('montant')
      .setDescription('Nombre de Magik-Coins 🪙 à retirer')
      .setMinValue(1)
      .setRequired(true),
  );

/**
 * Exécute la commande /removecoin
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  // Vérification de la permission via rôle
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission d'utiliser cette commande.",
      flags: 64,
    });
  }

  const target = interaction.options.getUser('utilisateur');
  const amount = interaction.options.getInteger('montant');

  // Prise en charge explicite pour éviter le timeout
  await interaction.deferReply();

  try {
    // Retrait des coins et récupération du solde à jour
    await removeBalance(target.id, amount, pool);
    const newBalance = await getBalance(target.id, pool);

    const embed = new EmbedBuilder()
      .setTitle('Perte de Magik-Coins 🪙')
      .setDescription(
        `**${amount}** Magik-Coins 🪙 ont été retirés à ${target}.\n` +
          `Nouveau solde : **${newBalance}** Magik-Coins 🪙`,
      )
      .setColor('#9E0E40')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande removecoin :', error);
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors du retrait des Magik-Coins.',
    });
  }
}
