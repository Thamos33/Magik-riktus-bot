import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("commandes")
  .setDescription("Liste toutes les commandes du bot");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🤖 Les commandes 🤖")
    .setDescription(
      `🔹 /magik-rusher : règles de l'événement Magik-Rusher
🔹 /fashion-riktus : règles du Fashion-Riktus
🔹 /solde : affiche ton solde ou celui d'un utilisateur
🔹 /classement : top 10 des 🪙
🔹 /classementgeneral : classement complet
🔹 /send : envoyer une image pour un événement
🔹 /resultat : voir les soumissions pour Fashion-Riktus\n
🔸 Commandes admin :
🔹 /addcoin @user montant
🔹 /removecoin @user montant
🔹 /kdo @user quantité
🔹 /fr-reset : réinitialiser l'événement Fashion-Riktus`
    )
    .setColor("#165416");

  await interaction.reply({ embeds: [embed] });
}
