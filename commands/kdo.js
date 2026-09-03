import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { getBalance, removeBalance } from '../utils/balance.js';

/**
 * Prix unitaire d'un cadeau en Magik-Coins
 */
const GIFT_PRICE = 50;

/**
 * Configuration de la commande Slash /kdo
 */
export const data = new SlashCommandBuilder()
  .setName('kdo')
  .setDescription(
    'Donne des cadeaux en échange de <:magikcoin:1545124652383469719> (Admin)',
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription("L'utilisateur qui recevra les cadeaux")
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('quantite')
      .setDescription('Nombre de cadeaux à donner')
      .setMinValue(1)
      .setRequired(true),
  );

/**
 * Exécute la commande /kdo
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  // Vérification de la permission via le rôle administrateur
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission d'utiliser cette commande.",
      flags: 64,
    });
  }

  const target = interaction.options.getUser('utilisateur');
  const quantity = interaction.options.getInteger('quantite');
  const totalCost = quantity * GIFT_PRICE;

  await interaction.deferReply();

  try {
    const currentBalance = await getBalance(target.id, pool);

    // Vérification du solde de l'utilisateur cible
    if (currentBalance < totalCost) {
      return interaction.editReply({
        content: `⚠️ ${target} n'a pas assez de <:magikcoin:1545124652383469719>. (Requis : **${totalCost}**, Solde actuel : **${currentBalance}**)`,
      });
    }

    // Retrait des coins et récupération du solde mis à jour
    await removeBalance(target.id, totalCost, pool);
    const newBalance = await getBalance(target.id, pool);

    const embed = new EmbedBuilder()
      .setTitle('🎁 Cadeaux distribués ! 🎁')
      .setDescription(
        `**${quantity}** cadeau(x) attribué(s) à ${target}.\n` +
          `**${totalCost}** <:magikcoin:1545124652383469719> <:magikcoin:1545124652383469719> retirés.\n\n` +
          `Nouveau solde : **${newBalance}** <:magikcoin:1545124652383469719> <:magikcoin:1545124652383469719>`,
      )
      .setColor('#9E0E40')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande kdo :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la distribution des cadeaux.',
    });
  }
}
