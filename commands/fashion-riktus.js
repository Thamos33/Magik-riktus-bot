import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('fashion-riktus')
  .setDescription('Affiche les règles du Fashion-Riktus');

export async function execute(interaction) {
  const CURRENCY = 'Magik-Coins🪙';
  const embed = new EmbedBuilder()
    .setTitle('🌸 Fashion-Riktus 🌸')
    .setDescription(
      `Toutes les deux semaines, nous allons alterner entre une semaine pour envoyer vos créations, et une semaine de vote. Un thème sera donné et à respecter.\n\n🔸 Attribution des points :\n🔹 30 ${CURRENCY} pour le 1er.\n🔹 20 ${CURRENCY} pour le 2ème.\n🔹 10 ${CURRENCY} le 3ème.\n\n🔸 Fonctionnement\n🔹 Durant la 1ere semaine, avec la commande **/send**, en y ajoutant une image, dans le salon https://discord.com/channels/297322268961538048/1412175010935607347 Votre skin sera envoyé, et instantanément supprimé, pour garder la surprise et l'anonymat pour les votes.\n🔹 Le lundi suivant, pour la 2ème semaine, tous les skins seront affichés par le bot de guilde, il ne vous restera plus qu'à voter ! Pour cela, réagissez aux images qui vous plaisent avec un :thumbsup: . Vous pouvez voter pour plusieurs skins.\n🔹 Les skins sont à réaliser en jeu ou via des outils en ligne.\n🔹 Si vous envoyez deux fois un skin, le 2ème écrasera le 1er.\n🔹 Pour le respect de l'évènement on vous demandera de ne pas copier des skins déjà faits, si une triche a lieu, nous procéderons à des sanctions sur les participations.`,
    )
    .setColor('#b419a7');

  await interaction.reply({ embeds: [embed] });
}
