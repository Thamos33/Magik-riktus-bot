import { SlashCommandBuilder } from "discord.js";
import {
  updateSubmissions,
  getSubmissionByUser,
} from "../utils/submissions.js";
import fs from "fs/promises";
import path from "path";

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

  const res = await fetch(attachment.url);
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const ext =
    path.extname(attachment.name || new URL(attachment.url).pathname) || ".png";
  const dir = path.join(process.cwd(), "screens");
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${interaction.user.id}_${Date.now()}${ext}`;
  const filePath = path.join(dir, fileName);

  const prev = await getSubmissionByUser(interaction.user.id, pool);
  await fs.writeFile(filePath, buffer);

  await updateSubmissions(
    interaction.user.id,
    interaction.user.username,
    filePath,
    fileName,
    pool
  );

  if (prev?.file_path && prev.file_path !== filePath) {
    fs.unlink(prev.file_path).catch(() => {});
  }

  await interaction.reply({
    content: "✅ Ton screen a bien été enregistré !",
    ephemeral: true,
  });
}
