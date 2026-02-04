// commands/pushEnigme.js
import { SlashCommandBuilder } from 'discord.js';
import { getActiveEnigme } from '../utils/enigme.js';

export const data = new SlashCommandBuilder()
  .setName('push-enigme')
  .setDescription('Publier l’énigme actuelle dans ce salon');

export async function execute(interaction, pool) {
  const enigme = await getActiveEnigme(pool);
  if (!enigme) {
    return interaction.reply({
      content: '❌ Il n’y a pas d’énigme en cours.',
      ephemeral: true,
    });
  }

  return interaction.reply({
    content: `🧩 Énigme : ${enigme.question}\n\nPour tenter votre chance, utilisez la commande /solution !\n\nSi vous voulez que je répète la question, ça sera avec /push-enigme`,
  });
}
