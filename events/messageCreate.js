import { MessageType } from 'discord.js';

const AUTO_CLEAN_CHANNELS_IMG = [
  '1350937297142419558', // salon "screens"
  '1360338547827282262', // salon "Magik-Rusher"
];

const COMMAND_PREFIX = '/';

export default {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!AUTO_CLEAN_CHANNELS_IMG.includes(message.channel.id)) return;

    try {
      if (message.type !== MessageType.Default) {
        await message.delete().catch(() => {});
        return;
      }

      if (
        message.channel.isThread() ||
        message.content.trim().startsWith(COMMAND_PREFIX)
      ) {
        return;
      }

      const hasImage = message.attachments.some(
        (att) =>
          att.contentType?.startsWith('image/') ||
          /\.(png|jpe?g|gif|webp)$/i.test(att.name ?? ''),
      );

      if (!hasImage) {
        await message.delete().catch(() => {});
        await message.author
          .send(
            `👋 Salut ${message.author.username}, ton message dans **#${message.channel.name}** a été supprimé car ce salon est réservé aux images (screens, galeries).`,
          )
          .catch(() => {});
      }
    } catch (err) {
      console.error(
        '❌ Erreur lors de la modération automatique :',
        err.message,
      );
    }
  },
};
