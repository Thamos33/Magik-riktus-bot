// events/interactionCreate.js
import { Events } from "discord.js";
import { handleModalSubmit } from "../utils/handleModalSubmit.js"; // <-- on va créer ce fichier juste après

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client, pool) {
    try {
      // 🎯 Si c'est une commande slash
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        await command.execute(interaction, pool);
      }

      // 📝 Si c'est une soumission de modale
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction, pool);
      }
    } catch (error) {
      console.error("Erreur dans interactionCreate :", error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "❌ Une erreur est survenue lors du traitement de la commande.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "❌ Une erreur est survenue lors du traitement de la commande.",
          ephemeral: true,
        });
      }
    }
  },
};
