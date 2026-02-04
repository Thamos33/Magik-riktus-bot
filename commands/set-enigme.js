// commands/setEnigme.js
import { SlashCommandBuilder } from 'discord.js';
import { createEnigme } from '../utils/enigme.js';

export const data = new SlashCommandBuilder()
  .setName('set-enigme')
  .setDescription('Créer une énigme (admin uniquement)')
  .addStringOption((option) =>
    option
      .setName('question')
      .setDescription('La question de l’énigme')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('reponse')
      .setDescription('La réponse de l’énigme')
      .setRequired(true),
  );

export async function execute(interaction, client, pool) {
  const member = await interaction.member.roles.cache.has(process.env.ADMINID);
  if (!member.roles.cache.some((r) => r.name.toLowerCase() === 'admin')) {
    return interaction.reply({
      content: '❌ Vous n’avez pas la permission.',
      ephemeral: true,
    });
  }

  const question = interaction.options.getString('question');
  const reponse = interaction.options.getString('reponse');

  try {
    await createEnigme(question, reponse, pool);
    return interaction.reply({
      content: '✅ Énigme enregistrée !',
      ephemeral: true,
    });
  } catch (err) {
    return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
