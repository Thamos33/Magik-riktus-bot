// utils/handleModalSubmit.js
import { v2 as cloudinary } from "cloudinary";
import { scheduleMessage } from "./auto-send.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function handleModalSubmit(interaction, pool) {
  if (!interaction.customId.startsWith("msgdateModal")) return;

  const [_, encoded] = interaction.customId.split("|");
  const { channelId, date, attachment } = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf-8")
  );

  const messageContent = interaction.fields.getTextInputValue("messageInput");

  let fileUrl = null;
  let publicId = null;

  if (attachment) {
    try {
      const upload = await cloudinary.uploader.upload(attachment, {
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

  await scheduleMessage(
    channelId,
    messageContent,
    date,
    fileUrl,
    publicId,
    pool
  );

  await interaction.reply({
    content: `✅ Message programmé pour le ${date} à 00:01.`,
    ephemeral: true,
  });
}
