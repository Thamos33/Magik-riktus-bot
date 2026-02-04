import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getBalance, removeBalance } from '../utils/balance.js';

export const data = new SlashCommandBuilder()
  .setName('kdo')
  .setDescription('Donne des cadeaux en échange de Magik-Coins🪙 (admin)')
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription("L'utilisateur qui recevra les cadeaux")
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('quantite')
      .setDescription('Nombre de cadeaux à donner')
      .setRequired(true),
  );

export async function execute(interaction, pool) {
  if (!interaction.member.roles.cache.has(process.env.ADMINID))
    return interaction.reply({
      content: "🚫 Tu n'as pas la permission.",
      ephemeral: true,
    });

  const target = interaction.options.getUser('utilisateur');
  const quantity = interaction.options.getInteger('quantite');
  const cost = quantity * 50;

  await removeBalance(target.id, cost, pool);
  const balance = await getBalance(target.id, pool);

  const embed = new EmbedBuilder()
    .setTitle('🎁 Cadeaux ! 🎁')
    .setDescription(
      `**${cost}** Magik-Coins🪙 retirés à <@${target.id}> pour ${quantity} cadeaux.\nSolde : **${balance}** Magik-Coins🪙`,
    )
    .setColor('#9e0e40');

  await interaction.reply({ embeds: [embed] });
}
