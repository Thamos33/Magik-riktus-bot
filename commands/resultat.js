import { SlashCommandBuilder } from "discord.js";
import { getSubmissions } from "../utils/submissions.js";
import fs from "fs/promises";

export const data = new SlashCommandBuilder()
  .setName("resultat")
  .setDescription("Affiche les soumissions des participants (admin)");

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has(process.env.ADMINID))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  const submissions = await getSubmissions(pool);
  if (!submissions.length)
    return interaction.reply("⚠️ Aucune image enregistrée.");

  for (const sub of submissions) {
    try {
      await interaction.channel.send({
        content: `👗 [Skin #${sub.id}](${sub.file_path})`,
      });
    } catch {
      await interaction.channel.send(
        `⚠️ Impossible d’envoyer le skin #${sub.id}`
      );
    }
  }

  await interaction.reply({
    content: "✅ Tous les résultats envoyés.",
    ephemeral: true,
  });
}
