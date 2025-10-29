// commands/autoSendMessage.js
import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { scheduleMessage } from "../utils/auto-send.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------------
// 1. Définition de la commande
// ----------------------
export const data = new SlashCommandBuilder()
  .setName("msgdate")
  .setDescription("Programmer un message")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel où envoyer")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true)
  )
  .addAttachmentOption((option) =>
    option.setName("image").setDescription("Image à envoyer").setRequired(false)
  );

// ----------------------
// 2. Quand l'utilisateur exécute /msgdate
// ----------------------
export async function execute(interaction) {
  const channel = interaction.options.getChannel("channel");
  const date = interaction.options.getString("date");
  const attachment = interaction.options.getAttachment("image");

  // On encode les infos (channel/date/image) dans le customId de la modale
  const payload = {
    channelId: channel.id,
    date,
    attachment: attachment ? attachment.url : null,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");

  // Création de la modale
  const modal = new ModalBuilder()
    .setCustomId(`msgdateModal|${encoded}`)
    .setTitle("Programmer un message");

  const messageInput = new TextInputBuilder()
    .setCustomId("messageInput")
    .setLabel("Message à envoyer")
    .setStyle(TextInputStyle.Paragraph) // Multi-ligne
    .setPlaceholder("Ex : **Titre**\\n__Texte sous-ligné__\\nNouvelle ligne…")
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(messageInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}
