import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("magik-rusher")
  .setDescription("Affiche les règles du Magik-Rusher");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🍀 Magik-Rusher 🍀")
    .setDescription(
      `Chaque semaine un nouveau donjon est à réaliser, du Lundi 00h00 au Dimanche 23h59 (UTC+1). Aucune limite de personnes par donjon.\n\n🔸Attribution des ${CURRENCY} : \n🔹 10 ${CURRENCY} pour la 1ère réalisation du donjon.\n🔹 +1 ${CURRENCY} par personnage unique dans le combat n’ayant jamais fait le donjon.\n🔹 Réaliser le donjon seul ou uniquement avec ses mules = 5 ${CURRENCY}.\n🔹 À partir de deux participants uniques (ou plus) = 10 ${CURRENCY} et les règles de base s’appliquent.\n🔹 Screens de victoire + pseudo obligatoires pour valider, à poster dans le channel associé https://discord.com/channels/297322268961538048/1360338547827282262.\n\n🔸Classement \n🔹Un classement est établi, vous pouvez le consulter en effectuant les commandes dans le salon https://discord.com/channels/297322268961538048/1360338547827282262: \n🔹/solde pour afficher votre nombre de ${CURRENCY} ou celui d'une personne en utilisant son @.\n🔹/classement pour afficher le top 10 du serveur, et votre position.\n🔹/classementgeneral pour afficher le classement du serveur.\n\n🔸 Gains\n🔹Un total de 260 cosmétiques ont étés emballés dans des cadeaux, vous pourrez obtenir un cadeau aléatoire pour 50 ${CURRENCY} par cadeau.\n🔹L'estimation des cosmétiques vont de 440 kamas jusqu'à 8M unité.`
    )
    .setColor("#165416");

  await interaction.reply({ embeds: [embed] });
}
