import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { removeBalance, getBalance } from "../utils/balance.js";

export const data = new SlashCommandBuilder()
  .setName("removecoin")
  .setDescription("Retire des 🪙 Magik Coins d'un utilisateur (admin)")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur qui perdra les coins")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("montant")
      .setDescription("Nombre de coins à retirer")
      .setRequired(true)
  );

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has(process.env.ADMINID))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  const target = interaction.options.getUser("utilisateur");
  const amount = interaction.options.getInteger("montant");

  await removeBalance(target.id, amount, pool);
  const balance = await getBalance(target.id, pool);

  const embed = new EmbedBuilder()
    .setTitle(`Perte 🪙 Magik Coins`)
    .setDescription(
      `**${amount}** 🪙 retirés à <@${target.id}>.\nSolde : **${balance}** 🪙`
    )
    .setColor("#9e0e40");

  await interaction.reply({ embeds: [embed] });
}
