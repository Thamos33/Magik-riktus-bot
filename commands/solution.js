import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('solution')
  .setDescription('Répondre à l’énigme')
  .addStringOption((option) =>
    option.setName('reponse').setDescription('Votre réponse').setRequired(true),
  );

export async function execute(interaction, client, pool) {
  const res = await pool.query('SELECT * FROM enigmes LIMIT 1');
  if (res.rows.length === 0) {
    return interaction.reply({
      content: '❌ Il n’y a pas d’énigme en cours.',
      ephemeral: true,
    });
  }

  const correctAnswer = res.rows[0].reponse.trim().toLowerCase();
  const userAnswer = interaction.options
    .getString('reponse')
    .trim()
    .toLowerCase();

  if (userAnswer === correctAnswer) {
    // Supprimer l'énigme
    await pool.query('DELETE FROM enigmes WHERE id = $1', [res.rows[0].id]);
    return interaction.reply({
      content: `🎉 Félicitations ${interaction.user.username} ! La réponse était bien : ${res.rows[0].reponse}`,
    });
  } else {
    return interaction.reply({
      content: '❌ Mauvaise réponse, essayez encore !',
      ephemeral: true,
    });
  }
}
