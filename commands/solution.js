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

  function normalizeString(str) {
    return str
      .normalize('NFD') // sépare les lettres et les accents
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .toLowerCase() // tout en minuscules
      .trim(); // supprime les espaces début/fin
  }

  const userAnswer = normalizeString(interaction.options.getString('reponse'));
  const correctAnswer = normalizeString(enigme.reponse);

  if (userAnswer === correctAnswer) {
    await deleteEnigme(pool);

    var pseudoServeur =
      interaction.member?.displayName || interaction.user.username;

    return interaction.reply({
      content: `🎉 Félicitations ${pseudoServeur} ! La réponse était bien : ${enigme.reponse}`,
    });
  } else {
    return interaction.reply({
      content: `❌ Mauvaise réponse ${pseudoServeur}, essaye encore !`,
    });
  }
}
