import { SlashCommandBuilder } from 'discord.js';

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
  // Vérification rôle admin
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: '❌ Vous n’avez pas la permission.',
      ephemeral: true,
    });
  }

  // Vérifier si une énigme existe déjà
  const res = await pool.query('SELECT * FROM enigmes LIMIT 1');
  if (res.rows.length > 0) {
    return interaction.reply({
      content: '❌ Une énigme est déjà en cours.',
      ephemeral: true,
    });
  }

  const question = interaction.options.getString('question');
  const reponse = interaction.options.getString('reponse');

  await pool.query('INSERT INTO enigmes(question, reponse) VALUES($1, $2)', [
    question,
    reponse,
  ]);
  return interaction.reply({
    content: '✅ Énigme enregistrée !',
    ephemeral: true,
  });
}
