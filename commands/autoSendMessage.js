import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const data = new SlashCommandBuilder()
  .setName("msgdate")
  .setDescription(
    "Programmer un message avec une date et une image optionnelle"
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel où envoyer le message")
      .setRequired(true)
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("Rôle à mentionner dans le message")
      .setRequired(false)
  )
  .addAttachmentOption((option) =>
    option
      .setName("image")
      .setDescription("Image optionnelle à envoyer avec le message")
      .setRequired(false)
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel("channel");
  const attachment = interaction.options.getAttachment("image");
  const role = interaction.options.getRole("role");

  // Gestion de l’image Cloudinary si fournie
  let fileUrl = null;
  let publicId = null;

  if (attachment) {
    try {
      const upload = await cloudinary.uploader.upload(attachment.url, {
        folder: "discord_screens",
        public_id: `${interaction.user.id}_${Date.now()}`,
        overwrite: true,
      });
      fileUrl = upload.secure_url;
      publicId = upload.public_id;
    } catch (err) {
      console.error("Erreur Cloudinary :", err);
    }
  }

  // Sauvegarde temporaire des infos dans le client (salon + image)
  if (!interaction.client.tempData) interaction.client.tempData = new Map();
  interaction.client.tempData.set(interaction.user.id, {
    channelId: channel.id,
    fileUrl,
    publicId,
    roleId: role ? role.id : null,
  });

  // Création de la modale
  const modal = new ModalBuilder()
    .setCustomId("msgdate_modal")
    .setTitle("Programmer un message");

  const messageInput = new TextInputBuilder()
    .setCustomId("message_content")
    .setLabel("Contenu du message")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Texte Discord (titres, sauts de ligne, gras, etc.)")
    .setRequired(true);

  const dateInput = new TextInputBuilder()
    .setCustomId("message_date")
    .setLabel("Date d’envoi (YYYY-MM-DD)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(dateInput)
  );

  await interaction.showModal(modal);
}
