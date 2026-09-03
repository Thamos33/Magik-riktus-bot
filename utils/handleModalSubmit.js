import { MessageFlags } from 'discord.js';
import { scheduleMessage } from './auto-send.js';
import cloudinary from './cloudinary.js';

/**
 * Traite la soumission de la modale de programmation de message (/msgdate)
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction - L'interaction de modale Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function handleModalSubmit(interaction, pool) {
  if (!interaction.customId.startsWith('msgdateModal')) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const [_, encoded] = interaction.customId.split('|');
    const { channelId, date, attachment } = JSON.parse(
      Buffer.from(encoded, 'base64').toString('utf-8'),
    );

    const messageContent = interaction.fields.getTextInputValue('messageInput');

    let fileUrl = null;
    let publicId = null;

    // Traitement et upload de l'image sur Cloudinary
    if (attachment) {
      try {
        const upload = await cloudinary.uploader.upload(attachment, {
          folder: 'discord_screens',
          public_id: `${interaction.user.id}_${Date.now()}`,
          overwrite: true,
        });
        fileUrl = upload.secure_url;
        publicId = upload.public_id;
      } catch (uploadError) {
        console.error('❌ Erreur lors de l’upload Cloudinary :', uploadError);
      }
    }

    // Programmation du message en base de données
    await scheduleMessage(
      channelId,
      messageContent,
      date,
      fileUrl,
      publicId,
      null, // roleId si non spécifié
      pool,
    );

    await interaction.editReply({
      content: `✅ Message programmé avec succès pour le **${date}** à 00:01.`,
    });
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la modale :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de la programmation de ton message.',
    });
  }
}
