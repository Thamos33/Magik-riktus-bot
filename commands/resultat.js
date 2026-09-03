import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { getSubmissions } from '../utils/submissions.js';

/**
 * Configuration de la commande Slash /resultat
 */
export const data = new SlashCommandBuilder()
  .setName('resultat')
  .setDescription(
    'Affiche la liste des soumissions anonymes des participants (Admin)',
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Exécute la commande /resultat
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  // Vérification du rôle Administrateur
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission d'utiliser cette commande.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Accusé de réception différé et privé
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const submissions = await getSubmissions(pool);

    if (!submissions || submissions.length === 0) {
      return interaction.editReply({
        content: '⚠️ Aucune participation n’a été enregistrée pour le moment.',
      });
    }

    // Publication de chaque skin dans le canal
    for (const sub of submissions) {
      try {
        const embed = new EmbedBuilder()
          .setTitle(`👗 Skin #${sub.id}`)
          .setImage(sub.file_path)
          .setColor('#B419A7');

        await interaction.channel.send({ embeds: [embed] });
      } catch (sendError) {
        console.error(
          `❌ Impossible d’envoyer le skin #${sub.id} :`,
          sendError,
        );
        await interaction.channel.send({
          content: `⚠️ Impossible d’afficher le skin #${sub.id}.`,
        });
      }
    }

    await interaction.editReply({
      content:
        '✅ Toutes les participations ont été publiées dans le salon avec succès !',
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des résultats :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la récupération des participations.',
    });
  }
}
