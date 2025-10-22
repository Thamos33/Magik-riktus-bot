import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getRanking, getBalance } from "../utils/balance.js";

export const data = new SlashCommandBuilder()
  .setName("classement")
  .setDescription("Affiche le top 10 des 🪙 Magik Coins");

export async function execute(interaction, pool) {
  const ranking = await getRanking(pool);
  const nonZero = ranking.filter((r) => r.balance !== 0);

  if (!nonZero.length)
    return interaction.reply("Personne n’a encore de monnaie !");

  const top10 = nonZero.slice(0, 10);
  const myBalance = await getBalance(interaction.user.id, pool);
  const myIndex = nonZero.findIndex((r) => r.userid === interaction.user.id);

  let msg = "";
  if (myBalance > 0 && myIndex !== -1) {
    msg += `**Ta place :** ${myIndex + 1}ᵉ avec **${myBalance}** 🪙.\n\n`;
  } else {
    msg += "**Ta place :** Vous n'avez pas encore de 🪙 Magik Coins.\n\n";
  }

  msg += "**Top 10 :**\n";
  top10.forEach((row, index) => {
    msg += `**${index + 1}.** <@${row.userid}> — **${row.balance}** 🪙\n`;
  });

  const embed = new EmbedBuilder()
    .setTitle("🏆 Classement 🏆")
    .setDescription(msg)
    .setColor("#FFD700");

  await interaction.reply({ embeds: [embed] });
}
