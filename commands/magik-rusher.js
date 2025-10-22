import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("magik-rusher")
  .setDescription("Affiche les règles du Magik-Rusher");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🍀 Magik-Rusher 🍀")
    .setDescription(
      `Chaque semaine un nouveau donjon est à réaliser, du Lundi 00h00 au Dimanche 23h59 (UTC+1).\n
🔸 Gains :
🔹 10 🪙 pour la 1ère réalisation du donjon
🔹 +1 🪙 par personnage unique
🔹 Réaliser le donjon seul ou avec ses mules = 5 🪙
🔹 À partir de deux participants uniques = 10 🪙\n
🔸 Classement :
🔹 /solde pour ton solde
🔹 /classement pour le top 10
🔹 /classementgeneral pour le classement complet`
    )
    .setColor("#165416");

  await interaction.reply({ embeds: [embed] });
}
