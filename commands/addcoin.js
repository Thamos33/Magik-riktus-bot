import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { addBalance, getBalance } from "../utils/balance.js";

export const data = new SlashCommandBuilder()
  .setName("addcoin")
  .setDescription("Ajoute des 🪙 Magik Coins à un utilisateur (admin)")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur qui recevra les coins")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("montant")
      .setDescription("Nombre de coins à ajouter")
      .setRequired(true)
  );

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has("1271882131848822836"))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  const target = interaction.options.getUser("utilisateur");
  const amount = interaction.options.getInteger("montant");

  await addBalance(target.id, amount, pool);
  const balance = await getBalance(target.id, pool);

  const embed = new EmbedBuilder()
    .setTitle(`Gain 🪙 Magik Coins`)
    .setDescription(
      `**${amount}** 🪙 ajoutés à <@${target.id}>.\nSolde : **${balance}** 🪙`
    )
    .setColor("#5CA25F");

  await interaction.reply({ embeds: [embed] });
}
