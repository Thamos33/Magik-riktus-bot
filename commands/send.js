import { SlashCommandBuilder } from "discord.js";
import cloudinary from "../utils/cloudinary.js";
import {
  updateSubmissions,
  getSubmissionByUser,
} from "../utils/submissions.js";

export const data = new SlashCommandBuilder()
  .setName("send")
  .setDescription("Envoie une image pour les événements")
  .addAttachmentOption((option) =>
    option.setName("image").setDescription("Image à envoyer").setRequired(true)
  );

export async function execute(interaction, pool) {
  const attachment = interaction.options.getAttachment("image");
  if (!attachment.contentType?.startsWith("image/"))
    return interaction.reply({
      content: "⚠️ Ce n’est pas une image.",
      ephemeral: true,
    });

  await interaction.deferReply();

  // Upload direct via URL Discord
  const upload = await cloudinary.uploader.upload(attachment.url, {
    folder: "discord_screens",
    public_id: `${interaction.user.id}_${Date.now()}`,
    overwrite: true,
  });

  const prev = await getSubmissionByUser(interaction.user.id, pool);

  await updateSubmissions(
    interaction.user.id,
    interaction.user.username,
    upload.secure_url, // file_path
    upload.public_id, // public_id
    pool
  );

  if (prev?.public_id && prev.public_id !== upload.public_id) {
    await cloudinary.uploader.destroy(prev.public_id).catch(() => {});
  }

  await interaction.editReply("✅ Ton screen a bien été enregistré !");
}
