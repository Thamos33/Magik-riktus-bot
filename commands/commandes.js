import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

/**
 * Configuration de la commande Slash /commandes
 */
export const data = new SlashCommandBuilder()
  .setName('commandes')
  .setDescription('Liste l’ensemble des commandes disponibles sur le bot');

/**
 * Exécute la commande /commandes
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - L'interaction Discord
 * @returns {Promise<void>}
 */
export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const publicCommands = [
      '🔹 **/magik-rusher** : Règles de l’événement Magik-Rusher',
      '🔹 **/fashion-riktus** : Règles du Fashion-Riktus',
      '🔹 **/solde** : Affiche ton solde ou celui d’un utilisateur',
      '🔹 **/classement** : Top 10 des <:magikcoin:1545124652383469719>',
      '🔹 **/classementgeneral** : Classement complet des <:magikcoin:1545124652383469719>',
      '🔹 **/send** : Envoyer une participation à un événement',
      '🔹 **/msgdate** : Programmer un message à envoyer ultérieurement',
    ].join('\n');

    const adminCommands = [
      '🔹 **/addcoin** `@user` `montant` : Ajouter des <:magikcoin:1545124652383469719>',
      '🔹 **/removecoin** `@user` `montant` : Retirer des <:magikcoin:1545124652383469719>',
      '🔹 **/kdo** `@user` `quantité` : Échanger des coins contre des cadeaux',
      '🔹 **/resultat** : Consulter les soumissions du Fashion-Riktus',
      '🔹 **/fr-reset** : Réinitialiser l’événement Fashion-Riktus',
    ].join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🤖 Liste des Commandes 🤖')
      .setDescription(
        'Voici la liste des commandes Slash disponibles sur le serveur :',
      )
      .addFields(
        { name: '🌐 Commandes Publiques', value: publicCommands },
        { name: '🛠️ Commandes Administrateur', value: adminCommands },
      )
      .setColor('#165416')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande commandes :', error);
    await interaction.editReply({
      content:
        '❌ Une erreur est survenue lors de l’affichage du menu des commandes.',
    });
  }
}
