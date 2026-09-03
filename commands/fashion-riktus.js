import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

/**
 * Constante pour le nom de la monnaie
 */
const CURRENCY = 'Magik-Coins <:magikcoin:1545128700985614336>';

/**
 * Configuration de la commande Slash /fashion-riktus
 */
export const data = new SlashCommandBuilder()
  .setName('fashion-riktus')
  .setDescription('Affiche les règles et le fonctionnement du Fashion-Riktus');

/**
 * Exécute la commande /fashion-riktus
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @returns {Promise<void>}
 */
export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const rewardsText = [
      `🥇 **1er place :** 30 ${CURRENCY}`,
      `🥈 **2ème place :** 20 ${CURRENCY}`,
      `🥉 **3ème place :** 10 ${CURRENCY}`,
    ].join('\n');

    const rulesText = [
      '🔹 Toutes les deux semaines, nous alternons entre une semaine de soumission de vos créations et une semaine de vote autour d’un thème donné.',
      `🔹 **Soumission :** Pendant la 1ère semaine, utilisez la commande **/send** avec une image dans le salon <#1412175010935607347>. Votre skin sera enregistré et votre message immédiatement masqué afin de garantir l'anonymat pour les votes.`,
      '🔹 **Vote :** Le lundi suivant, tous les skins seront affichés anonymement par le bot. Réagissez avec un 👍 aux visuels qui vous plaisent (votes multiples autorisés).',
      '🔹 **Règles :** Les skins sont à réaliser en jeu ou via un outil de skin. Si vous envoyez une seconde image, elle remplacera la précédente. Le plagiat est strictement interdit sous peine de disqualification.',
    ].join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('🌸 Règlement du Fashion-Riktus 🌸')
      .setDescription(
        'Participez à notre concours de skin bimensuel et tentez de remporter des récompenses !',
      )
      .addFields(
        { name: '🏆 Récompenses', value: rewardsText },
        { name: '⚙️ Fonctionnement & Règles', value: rulesText },
      )
      .setColor('#B419A7')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande fashion-riktus :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de l’affichage du règlement du Fashion-Riktus.',
    });
  }
}
