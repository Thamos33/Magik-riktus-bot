import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("fr-reset")
  .setDescription("Réinitialise l'événement Fashion-Riktus (admin)");

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has("1271882131848822836"))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  try {
    await pool.query(`TRUNCATE TABLE submissions RESTART IDENTITY`);
    await interaction.reply(
      "✅ Toutes les soumissions ont été réinitialisées !"
    );
  } catch (err) {
    console.error(err);
    await interaction.reply("❌ Une erreur est survenue lors du reset.");
  }
}
