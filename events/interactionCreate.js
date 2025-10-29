import { Events } from "discord.js";
import { scheduleMessage } from "../utils/auto-send.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client, pool) {
    // --- Soumission de la modale ---
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "msgdate_modal"
    ) {
      const content = interaction.fields.getTextInputValue("message_content");
      const date = interaction.fields.getTextInputValue("message_date");

      const temp = client.tempData?.get(interaction.user.id);
      if (!temp) {
        return interaction.reply({
          content:
            "❌ Impossible de retrouver les informations du message. Réessaie.",
          ephemeral: true,
        });
      }

      const { channelId, fileUrl, publicId } = temp;

      try {
        await scheduleMessage(
          channelId,
          content,
          date,
          fileUrl,
          publicId,
          pool
        );

        client.tempData.delete(interaction.user.id); // nettoyage

        await interaction.reply({
          content: `✅ Message programmé pour le ${date} à 00:01.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("Erreur en sauvegardant le message :", err);
        await interaction.reply({
          content:
            "❌ Une erreur est survenue lors de la programmation du message.",
          ephemeral: true,
        });
      }
    }

    // --- Slash commands classiques ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, pool);
      } catch (err) {
        console.error("Erreur commande :", err);
        await interaction.reply({
          content:
            "❌ Une erreur est survenue lors du traitement de la commande.",
          ephemeral: true,
        });
      }
    }
  },
};
