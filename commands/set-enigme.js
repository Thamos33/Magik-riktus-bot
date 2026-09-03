import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createEnigme } from '../utils/enigme.js';

/**
 * Configuration de la commande Slash /set-enigme
 */
export const data = new SlashCommandBuilder()
  .setName('set-enigme')
  .setDescription('Créer une nouvelle énigme (Admin uniquement)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName('question')
      .setDescription('La question ou l’énoncé de l’énigme')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('reponse')
      .setDescription('La réponse attendue pour valider l’énigme')
      .setRequired(true),
  );

/**
 * Exécute la commande /set-enigme
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @param {import('pg').Pool} pool - Le pool de connexion PostgreSQL
 * @returns {Promise<void>}
 */
export async function execute(interaction, pool) {
  // Vérification de la permission via le rôle administrateur
  if (!interaction.member.roles.cache.has(process.env.ADMINID)) {
    return interaction.reply({
      content: '❌ Tu n’as pas la permission d’utiliser cette commande.',
      flags: 64,
    });
  }

  const question = interaction.options.getString('question');
  const reponse = interaction.options.getString('reponse');

  // Réponse éphémère différée pour prévenir les timeouts
  await interaction.deferReply({ flags: 64 });

  try {
    await createEnigme(question, reponse, pool);

    await interaction.editReply({
      content: '✅ L’énigme a été enregistrée avec succès !',
    });
  } catch (err) {
    console.error('❌ Erreur lors de la création de l’énigme :', err);
    await interaction.editReply({
      content: `❌ Erreur : ${err.message || 'Impossible d’enregistrer l’énigme.'}`,
    });
  }
}
