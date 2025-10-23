import { SlashCommandBuilder } from "discord.js";
import { scheduleMessage } from "../utils/autoSend.js";

export const data = new SlashCommandBuilder()
  .setName("schedule")
  .setDescription("Programmer un message")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel à envoyer")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Message à envoyer")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true)
  );

export async function execute(interaction, pool) {
  const channel = interaction.options.getChannel("channel");
  const content = interaction.options.getString("message");
  const date = interaction.options.getString("date");

  await scheduleMessage(channel.id, content, date, pool);

  await interaction.reply({
    content: `Message programmé pour le ${date} à 00:01.`,
    ephemeral: true,
  });
}
