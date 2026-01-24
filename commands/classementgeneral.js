import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getRanking, getBalance } from "../utils/balance.js";

export const data = new SlashCommandBuilder()
  .setName("classementgeneral")
  .setDescription("Affiche le classement complet des Magik-Coins 🪙");

export async function execute(interaction, pool) {
  const ranking = await getRanking(pool);
  const nonZero = ranking.filter((r) => r.balance !== 0);
  if (!nonZero.length)
    return interaction.reply("Personne n’a encore de monnaie !");

  function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  const chunks = chunkArray(nonZero, 30);

  for (let c = 0; c < chunks.length; c++) {
    const page = chunks[c];
    let msg = "";
    let membersById = new Map();
    if (interaction.guild) {
      try {
        const ids = page.map((r) => r.userid);
        const fetched = await interaction.guild.members.fetch({ user: ids });
        fetched.forEach((m, id) => membersById.set(id, m));
      } catch (_) {}
    }

    for (let i = 0; i < page.length; i++) {
      const row = page[i];
      const rank = c * 30 + i + 1;
      const member = membersById.get(row.userid);
      const name = member
        ? member.displayName || member.user.username
        : `Utilisateur ${row.userid}`;
      msg += `**${rank}.** **${name}** — **${row.balance}** Magik-Coins🪙\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(
        "🏆 Classement 🏆" + (chunks.length > 1 ? ` (page ${c + 1})` : "")
      )
      .setDescription(msg)
      .setColor("#FFD700");

    if (c === 0) await interaction.reply({ embeds: [embed] });
    else await interaction.followUp({ embeds: [embed] });
  }
}
