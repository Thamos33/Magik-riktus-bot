import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

/**
 * Constante pour le nom de la monnaie
 */
const CURRENCY = 'Magik-Coins 🪙';

/**
 * ID du salon dédié aux screens du Magik-Rusher
 */
const RUSHER_CHANNEL_ID = '1360338547827282262';

/**
 * Configuration de la commande Slash /magik-rusher
 */
export const data = new SlashCommandBuilder()
  .setName('magik-rusher')
  .setDescription('Affiche les règles et le fonctionnement du Magik-Rusher');

/**
 * Exécute la commande /magik-rusher
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @returns {Promise<void>}
 */
export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const rulesText = [
      '🔹 **Format :** Chaque semaine, un nouveau donjon est à réaliser, du **Lundi 00h00** au **Dimanche 23h59** (UTC+1).',
      '🔹 **Participation :** Aucune limite de personnes par donjon.',
      `🔹 **Validation :** Vous devez obligatoirement poster le screen de victoire avec les pseudos bien visibles dans le salon <#${RUSHER_CHANNEL_ID}>.`,
    ].join('\n');

    const pointsText = [
      `🔹 **Première réussite :** 10 ${CURRENCY}`,
      `🔹 **Bonus joueur unique :** +1 ${CURRENCY} par personnage unique dans le combat n’ayant jamais réalisé ce donjon.`,
      `🔹 **Solo / Mules :** Réaliser le donjon seul ou uniquement avec vos mules rapporte **5 ${CURRENCY}**.`,
      `🔹 **En groupe (2+ joueurs) :** Rapporte **10 ${CURRENCY}** + application des règles de base.`,
    ].join('\n');

    const rankingText = [
      `🔹 Consulter le classement et vos points dans <#${RUSHER_CHANNEL_ID}> :`,
      `  • **/solde** : Affiche votre solde (ou celui d’un joueur tagué).`,
      `  • **/classement** : Affiche le top 10 du serveur ainsi que votre position.`,
      `  • **/classementgeneral** : Affiche le classement complet du serveur.`,
    ].join('\n');

    const rewardsText = [
      `🔹 **260 cosmétiques** emballés dans des cadeaux mystères !`,
      `🔹 Récupérez un cadeau aléatoire en échange de **50 ${CURRENCY}**.`,
      `🔹 Valeur estimée des lots : de **440 Kamas** à plus de **8 Millions de Kamas** l'unité !`,
    ].join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🍀 Règlement du Magik-Rusher 🍀')
      .setDescription(
        'Participez au rush de donjon hebdomadaire pour cumuler de la monnaie et débloquer des cadeaux !',
      )
      .addFields(
        { name: '📜 Règles Générales', value: rulesText },
        { name: `🪙 Attribution des ${CURRENCY}`, value: pointsText },
        { name: '🏆 Consultations & Commandes', value: rankingText },
        { name: '🎁 Gains & Récompenses', value: rewardsText },
      )
      .setColor('#165416')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande magik-rusher :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de l’affichage du règlement du Magik-Rusher.',
    });
  }
}
