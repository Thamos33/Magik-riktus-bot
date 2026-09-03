import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { addBalance, getBalance } from '../utils/balance.js';

/**
 * Configuration de la commande Slash /addcoin
 */
export const data = new SlashCommandBuilder()
  .setName('addcoin')
  .setDescription(
    'Ajoute des <:magikcoin:1545128700985614336> à un utilisateur (Admin)',
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription(
        "L'utilisateur qui recevra les <:magikcoin:1545128700985614336>",
      )
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('montant')
      .setDescription('Nombre de <:magikcoin:1545128700985614336> à ajouter')
      .setMinValue(1)
      .setRequired(true),
  );

/**
 * Exécute la commande /addcoin
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  // Vérification du rôle Administrateur via variable d'environnement
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission d'utiliser cette commande.",
      flags: 64, // Remplace 'ephemeral: true' (obsolète dans v14.18+)
    });
  }

  const target = interaction.options.getUser('utilisateur');
  const amount = interaction.options.getInteger('montant');

  // Accusé de réception différé pour éviter les timeouts
  await interaction.deferReply();

  try {
    // Mise à jour de la base de données
    await addBalance(target.id, amount, pool);
    const newBalance = await getBalance(target.id, pool);

    // Envoi de la réponse enrichie
    const embed = new EmbedBuilder()
      .setTitle('Gain de <:magikcoin:1545128700985614336>')
      .setDescription(
        `**${amount}** <:magikcoin:1545128700985614336> ont été ajoutés à ${target}.\n` +
          `Nouveau solde : **${newBalance}** <:magikcoin:1545128700985614336>`,
      )
      .setColor('#5CA25F')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande addcoin :', error);
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors de l’ajout des Magik-Coins.',
    });
  }
}
