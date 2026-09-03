import { EmbedBuilder } from 'discord.js';
import { deleteBalance } from '../utils/balance.js';

const LOG_LEAVE_CHANNEL_ID = '1195801619070210058';

export default {
  name: 'guildMemberRemove',
  async execute(member, client, pool) {
    try {
      // Suppression du solde
      await deleteBalance(member.id, pool);
      console.log(
        `🧹 Solde supprimé pour le membre parti : ${member.user?.tag || member.id}`,
      );

      // Log dans le salon de départ
      const channel = await member.guild.channels
        .fetch(LOG_LEAVE_CHANNEL_ID)
        .catch(() => null);
      if (!channel) return;

      const username = member.user.tag;
      const serverName = member.displayName;
      const avatar = member.user.displayAvatarURL({ dynamic: true });

      const joinedTimestamp = member.joinedAt
        ? Math.floor(member.joinedAt.getTime() / 1000)
        : null;

      const embed = new EmbedBuilder()
        .setColor('#FF4D4D')
        .setTitle('👋 Membre parti')
        .setThumbnail(avatar)
        .addFields(
          { name: 'Pseudo Discord', value: username, inline: true },
          { name: 'Pseudo serveur', value: serverName, inline: true },
          {
            name: 'Arrivé le',
            value: joinedTimestamp ? `<t:${joinedTimestamp}:F>` : 'Inconnu',
            inline: false,
          },
        )
        .setFooter({ text: `ID Utilisateur : ${member.id}` })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(
        `❌ Erreur lors du traitement du départ du membre (${member.id}) :`,
        err.message,
      );
    }
  },
};
