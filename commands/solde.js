import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getBalance } from "../utils/balance.js";

export const data = new SlashCommandBuilder()
  .setName("solde")
  .setDescription("Affiche ton solde ou celui d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("Mentionner un utilisateur")
      .setRequired(false)
  );

export async function execute(interaction, pool) {
  const target = interaction.options.getUser("utilisateur") || interaction.user;
  const balance = await getBalance(target.id, pool);

  const embed = new EmbedBuilder()
    .setTitle(
      target.id === interaction.user.id
        ? "Mon solde"
        : `Le solde de ${target.username}`
    )
    .setDescription(`**${balance}** 🪙 Magik Coins`)
    .setColor("#165416");

  await interaction.reply({ embeds: [embed] });
}
