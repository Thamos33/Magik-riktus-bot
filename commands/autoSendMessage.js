import { SlashCommandBuilder } from "discord.js";
import { scheduleMessage } from "../utils/auto-send.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    option
      .setName("message")
      .setDescription("Message à envoyer")
      .setRequired(true)
  )
  .addAttachmentOption((option) =>
    option.setName("image").setDescription("Image à envoyer").setRequired(false)
  )
  .addStringOption((option) =>
    option.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true)
  );

export async function execute(interaction, pool) {
  const channel = interaction.options.getChannel("channel");
  const content = interaction.options.getString("message");
  const date = interaction.options.getString("date");
  const attachment = interaction.options.getAttachment("image");

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

  await scheduleMessage(channel.id, content, date, fileUrl, publicId, pool);

  await interaction.reply({
    content: `✅ Message programmé pour le ${date} à 00:01.`,
    ephemeral: true,
  });
}
