import { v2 as cloudinary } from 'cloudinary';
import {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

// Configuration du client Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Configuration de la commande Slash /msgdate
 */
export const data = new SlashCommandBuilder()
  .setName('msgdate')
  .setDescription(
    'Programmer un message avec une date et une image optionnelle',
  )
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Salon textuel où programmer le message')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option
      .setName('role')
      .setDescription('Rôle à mentionner lors de l’envoi du message')
      .setRequired(false),
  )
  .addAttachmentOption((option) =>
    option
      .setName('image')
      .setDescription('Image optionnelle à joindre au message')
      .setRequired(false),
  );

/**
 * Exécute la commande /msgdate
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @returns {Promise<void>}
 */
export async function execute(interaction) {
  try {
    const channel = interaction.options.getChannel('channel');
    const attachment = interaction.options.getAttachment('image');
    const role = interaction.options.getRole('role');

    let fileUrl = null;
    let publicId = null;

    // Traitement de l'image via Cloudinary
    if (attachment) {
      if (!attachment.contentType?.startsWith('image/')) {
        return interaction.reply({
          content: '❌ Le fichier joint doit obligatoirement être une image.',
          flags: 64,
        });
      }

      try {
        const upload = await cloudinary.uploader.upload(attachment.url, {
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

    // Stockage temporaire dans la mémoire du client Discord
    if (!interaction.client.tempData) {
      interaction.client.tempData = new Map();
    }

    interaction.client.tempData.set(interaction.user.id, {
      channelId: channel.id,
      fileUrl,
      publicId,
      roleId: role ? role.id : null,
    });

    // Construction de la modale
    const modal = new ModalBuilder()
      .setCustomId('msgdate_modal')
      .setTitle('Programmer un message');

    const messageInput = new TextInputBuilder()
      .setCustomId('message_content')
      .setLabel('Contenu du message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Texte Discord (titres, sauts de ligne, gras, etc.)')
      .setRequired(true);

    const dateInput = new TextInputBuilder()
      .setCustomId('message_date')
      .setLabel('Date d’envoi (YYYY-MM-DD)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Exemple: 2026-12-31')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(messageInput),
      new ActionRowBuilder().addComponents(dateInput),
    );

    await interaction.showModal(modal);
  } catch (error) {
    console.error('❌ Erreur lors de l’exécution de msgdate :', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de l’ouverture de la modale.',
        flags: 64,
      });
    }
  }
}
