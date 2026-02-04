import { SlashCommandBuilder } from 'discord.js';
import cloudinary from '../utils/cloudinary.js';

export const data = new SlashCommandBuilder()
  .setName('fr-reset')
  .setDescription("Réinitialise l'événement Fashion-Riktus (admin)");

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has(process.env.ADMINID))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  await interaction.deferReply({ ephemeral: true });

  try {
    const res = await pool.query('SELECT public_id FROM submissions');

    if (res.rows.length > 0) {
      const publicIds = res.rows.map((r) => r.public_id);

      const deleteResult = await cloudinary.api.delete_resources(publicIds);

      console.log('🧹 Suppression Cloudinary terminée :', deleteResult.deleted);

      await pool.query(`TRUNCATE TABLE submissions RESTART IDENTITY`);

      await interaction.editReply(
        `✅ Réinitialisation complète effectuée : ${publicIds.length} image(s) supprimée(s).`,
      );
    } else {
      await pool.query(`TRUNCATE TABLE submissions RESTART IDENTITY`);
      await interaction.editReply(
        'ℹ️ Aucune image à supprimer. Base réinitialisée.',
      );
    }
  } catch (err) {
    console.error('Erreur lors du reset :', err);
    await interaction.editReply('❌ Une erreur est survenue lors du reset.');
  }
}
