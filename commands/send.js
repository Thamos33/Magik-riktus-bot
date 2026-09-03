import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import cloudinary from '../utils/cloudinary.js';
import {
  getSubmissionByUser,
  updateSubmissions,
} from '../utils/submissions.js';

/**
 * Configuration de la commande Slash /send
 */
export const data = new SlashCommandBuilder()
  .setName('send')
  .setDescription('Envoie une image pour les événements (Fashion-Riktus, etc.)')
  .addAttachmentOption((option) =>
    option
      .setName('image')
      .setDescription('L’image à soumettre pour l’événement')
      .setRequired(true),
  );

/**
 * Exécute la commande /send
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  const attachment = interaction.options.getAttachment('image');

  // Vérification de la présence d'un fichier image
  if (!attachment.contentType?.startsWith('image/')) {
    return interaction.reply({
      content: '⚠️ Le fichier fourni doit obligatoirement être une image.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Déféremment privé de la réponse pour éviter les timeouts
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Upload de la nouvelle image sur Cloudinary
    const upload = await cloudinary.uploader.upload(attachment.url, {
      folder: 'discord_screens',
      public_id: `${interaction.user.id}_${Date.now()}`,
      overwrite: true,
    });

    // Récupération de l'ancienne participation si elle existe
    const prevSubmission = await getSubmissionByUser(interaction.user.id, pool);

    // Enregistrement de la nouvelle participation en BDD
    await updateSubmissions(
      interaction.user.id,
      interaction.user.username,
      upload.secure_url,
      upload.public_id,
      pool,
    );

    // Nettoyage de l'ancienne image Cloudinary si elle existe
    if (
      prevSubmission?.public_id &&
      prevSubmission.public_id !== upload.public_id
    ) {
      await cloudinary.uploader
        .destroy(prevSubmission.public_id)
        .catch(() => {});
    }

    // Confirmation privée à l'utilisateur
    await interaction.editReply({
      content:
        '✅ Ton skin a bien été enregistré ! (Visible uniquement par toi)',
    });

    // Notification publique anonyme dans le salon
    if (interaction.channel) {
      await interaction.channel.send('✨ Un nouveau skin a été envoyé !');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi de la soumission :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de l’enregistrement de ton image.',
    });
  }
}
