import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('push-enigme')
  .setDescription('Publier l’énigme actuelle dans ce salon');

export async function execute(interaction, client, pool) {
  const res = await pool.query('SELECT * FROM enigmes LIMIT 1');
  if (res.rows.length === 0) {
    return interaction.reply({
      content: '❌ Il n’y a pas d’énigme pour le moment.',
      ephemeral: true,
    });
  }

  const question = res.rows[0].question;
  return interaction.reply({ content: `🧩 Énigme : ${question}` });
}
