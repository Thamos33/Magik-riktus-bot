// commands/solution.js
import { SlashCommandBuilder } from 'discord.js';
import { deleteEnigme, getActiveEnigme } from '../utils/enigme.js';

export const data = new SlashCommandBuilder()
  .setName('solution')
  .setDescription('Répondre à l’énigme')
  .addStringOption((option) =>
    option.setName('reponse').setDescription('Votre réponse').setRequired(true),
  );

export async function execute(interaction, pool) {
  const enigme = await getActiveEnigme(pool);
  if (!enigme) {
    return interaction.reply({
      content: '❌ Il n’y a pas d’énigme en cours.',
      ephemeral: true,
    });
  }

  const userAnswer = interaction.options
    .getString('reponse')
    .trim()
    .toLowerCase();
  const correctAnswer = enigme.reponse.trim().toLowerCase();

  if (userAnswer === correctAnswer) {
    await deleteEnigme(pool);

    const member = await interaction.guild.members.fetch(interaction.user.id);
    var pseudoServeur = member.displayName;

    return interaction.reply({
      content: `🎉 Félicitations ${pseudoServeur} ! La réponse était bien : ${enigme.reponse}`,
    });
  } else {
    return interaction.reply({
      content: `❌ Mauvaise réponse ${pseudoServeur}, essayez encore !`,
    });
  }
}
