import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import cloudinary from '../utils/cloudinary.js';

/**
 * Taille maximale de lots autorisée par l'API Cloudinary pour delete_resources
 */
const CLOUDINARY_BATCH_SIZE = 100;

/**
 * Configuration de la commande Slash /fr-reset
 */
export const data = new SlashCommandBuilder()
  .setName('fr-reset')
  .setDescription("Réinitialise l'événement Fashion-Riktus (Admin)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Exécute la commande /fr-reset
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
      flags: MessageFlags.Ephemeral,
    });
  }

  // Accusé de réception différé et privé
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const res = await pool.query(
      'SELECT public_id FROM submissions WHERE public_id IS NOT NULL',
    );

    if (res.rows.length > 0) {
      const publicIds = res.rows.map((row) => row.public_id);

      // Suppression des fichiers sur Cloudinary par lots de 100 maximum
      for (let i = 0; i < publicIds.length; i += CLOUDINARY_BATCH_SIZE) {
        const batch = publicIds.slice(i, i + CLOUDINARY_BATCH_SIZE);
        const deleteResult = await cloudinary.api.delete_resources(batch);
        console.log('🧹 Suppression Cloudinary (lot) :', deleteResult.deleted);
      }

      // Vider la table des soumissions et réinitialiser l'auto-incrément d'ID
      await pool.query('TRUNCATE TABLE submissions RESTART IDENTITY');

      await interaction.editReply({
        content: `✅ Réinitialisation complète effectuée : **${publicIds.length}** image(s) supprimée(s) sur Cloudinary et base nettoyée.`,
      });
    } else {
      // Nettoyage de sécurité même si aucun id Cloudinary n'est répertorié
      await pool.query('TRUNCATE TABLE submissions RESTART IDENTITY');

      await interaction.editReply({
        content:
          'ℹ️ Aucune image à supprimer. La table des soumissions a été réinitialisée.',
      });
    }
  } catch (error) {
    console.error(
      '❌ Erreur lors de la réinitialisation de l’événement Fashion-Riktus :',
      error,
    );
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la réinitialisation de l’événement.',
    });
  }
}
