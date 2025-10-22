import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("fashion-riktus")
  .setDescription("Affiche les règles du Fashion-Riktus");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🌸 Fashion-Riktus 🌸")
    .setDescription(
      `Toutes les deux semaines :
1️⃣ Envoi de créations avec /send
2️⃣ Vote sur les créations affichées\n
🔸 Points :
🔹 30 🪙 pour le 1er
🔹 20 🪙 pour le 2ème
🔹 10 🪙 pour le 3ème\n
⚠️ Respect des règles et anonymat des votes obligatoire.`
    )
    .setColor("#b419a7");

  await interaction.reply({ embeds: [embed] });
}
