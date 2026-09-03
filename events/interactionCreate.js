import { EmbedBuilder, Events, MessageFlags } from 'discord.js';
import { scheduleMessage } from '../utils/auto-send.js';
import { addBalance } from '../utils/balance.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMOJI_COIN = '<:magikcoin:1545124652383469719>';

function drawCard() {
  const cards = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
  return cards[Math.floor(Math.random() * cards.length)];
}

function calculateScore(cards) {
  let score = cards.reduce((a, b) => a + b, 0);
  let aces = cards.filter((c) => c === 11).length;

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

export default {
  name: Events.InteractionCreate,

  async execute(interaction, client, pool) {
    // --- 1. GESTION DES COMMANDES SLASH ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, pool);
      } catch (err) {
        console.error(
          `❌ Erreur lors de l'exécution de /${interaction.commandName} :`,
          err,
        );

        const errorMessage =
          '❌ Une erreur est survenue lors du traitement de la commande.';

        if (interaction.replied || interaction.deferred) {
          await interaction
            .followUp({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        } else {
          await interaction
            .reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        }
      }
      return;
    }

    // --- 2. GESTION DES MODALES ---
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'msgdate_modal') {
        const content = interaction.fields.getTextInputValue('message_content');
        const date = interaction.fields
          .getTextInputValue('message_date')
          .trim();

        if (!DATE_REGEX.test(date)) {
          return interaction.reply({
            content:
              '❌ Format de date invalide. Utilise le format YYYY-MM-DD (ex: 2026-12-31).',
            flags: MessageFlags.Ephemeral,
          });
        }

        const temp = client.tempData?.get(interaction.user.id);

        if (!temp) {
          return interaction.reply({
            content:
              '❌ Impossible de retrouver les données associées. Réessaie la commande /msgdate.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const { channelId, fileUrl, publicId, roleId } = temp;

        try {
          await scheduleMessage(
            channelId,
            content,
            date,
            fileUrl,
            publicId,
            roleId,
            pool,
          );

          client.tempData.delete(interaction.user.id);

          await interaction.reply({
            content: `✅ Message programmé pour le **${date}** à 00:01.`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (err) {
          console.error('❌ Erreur lors de la programmation du message :', err);
          await interaction.reply({
            content:
              '❌ Une erreur est survenue lors de la programmation du message en base de données.',
            flags: MessageFlags.Ephemeral,
          });
        }
        return;
      }
      return;
    }

    // --- 3. GESTION DES BOUTONS (BLACKJACK) ---
    if (interaction.isButton() && interaction.customId.startsWith('bj_')) {
      const game = client.tempData.get(`bj_${interaction.user.id}`);

      if (!game) {
        return interaction.reply({
          content: '❌ Aucune partie active trouvée ou la partie a expiré.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferUpdate();

      // Action: Tirer une carte
      if (interaction.customId === 'bj_hit') {
        game.playerHand.push(drawCard());
        const playerScore = calculateScore(game.playerHand);

        if (playerScore > 21) {
          client.tempData.delete(`bj_${interaction.user.id}`);

          const embed = new EmbedBuilder()
            .setTitle('💥 Éliminé ! (Bust)')
            .setDescription(
              `Tu as dépassé 21 avec un score de **${playerScore}** !\nTu perds ta mise de **${game.bet}** ${EMOJI_COIN}.`,
            )
            .setColor('#FF4D4D')
            .addFields(
              {
                name: 'Tes cartes',
                value: game.playerHand.join(' - '),
                inline: true,
              },
              {
                name: 'Croupier',
                value: game.dealerHand.join(' - '),
                inline: true,
              },
            );

          return interaction.editReply({ embeds: [embed], components: [] });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎰 Table de Blackjack')
          .setColor('#2F3136')
          .addFields(
            {
              name: '🃏 Tes cartes',
              value: `${game.playerHand.join(' - ')} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `${game.dealerHand[0]} - ❓`,
              inline: true,
            },
            {
              name: '💰 Mise en jeu',
              value: `**${game.bet}** ${EMOJI_COIN}`,
              inline: false,
            },
          );

        return interaction.editReply({ embeds: [embed] });
      }

      // Action: Rester
      if (interaction.customId === 'bj_stand') {
        client.tempData.delete(`bj_${interaction.user.id}`);

        let dealerScore = calculateScore(game.dealerHand);

        while (dealerScore < 17) {
          game.dealerHand.push(drawCard());
          dealerScore = calculateScore(game.dealerHand);
        }

        const playerScore = calculateScore(game.playerHand);
        let resultTitle = '';
        let resultColor = '';
        let resultMsg = '';

        if (dealerScore > 21 || playerScore > dealerScore) {
          const winnings = Math.floor(game.bet * 1.5);
          await addBalance(interaction.user.id, winnings, pool);

          resultTitle = '🎉 Victoire !';
          resultColor = '#4CAF50';
          resultMsg = `Tu remportes la partie ! Tu récupères ta mise + 50 % soit **${winnings}** ${EMOJI_COIN} !`;
        } else if (playerScore === dealerScore) {
          await addBalance(interaction.user.id, game.bet, pool);

          resultTitle = '🤝 Égalité !';
          resultColor = '#FFC107';
          resultMsg = `Égalité parfaite ! Ta mise de **${game.bet}** ${EMOJI_COIN} t'a été restituée.`;
        } else {
          resultTitle = '💀 Défaite !';
          resultColor = '#FF4D4D';
          resultMsg = `Le croupier l'emporte avec ${dealerScore}. Tu perds ta mise de **${game.bet}** ${EMOJI_COIN}.`;
        }

        const embed = new EmbedBuilder()
          .setTitle(resultTitle)
          .setDescription(resultMsg)
          .setColor(resultColor)
          .addFields(
            {
              name: '🃏 Tes cartes',
              value: `${game.playerHand.join(' - ')} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `${game.dealerHand.join(' - ')} (Total : **${dealerScore}**)`,
              inline: true,
            },
          );

        return interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
};
