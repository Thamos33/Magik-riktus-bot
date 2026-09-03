import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  MessageFlags,
} from 'discord.js';
import { scheduleMessage } from '../utils/auto-send.js';
import { addBalance, removeBalance } from '../utils/balance.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMOJI_COIN = '<:magikcoin:1545124652383469719>';

// Tirage d'une carte réaliste
function drawCard() {
  const cards = [
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 },
    { name: 'A', value: 11 },
  ];
  return cards[Math.floor(Math.random() * cards.length)];
}

function calculateScore(cards) {
  let score = cards.reduce((sum, card) => sum + card.value, 0);
  let aces = cards.filter((card) => card.name === 'A').length;

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

function formatHand(cards) {
  return cards.map((c) => `\`${c.name}\``).join(' ');
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

      // Action: Doubler la mise (Double Down)
      if (interaction.customId === 'bj_double') {
        // Retirer la seconde mise
        await removeBalance(interaction.user.id, game.bet, pool);
        game.bet *= 2;

        // Tirer UNE SEULE carte supplémentaire
        game.playerHand.push(drawCard());
        const playerScore = calculateScore(game.playerHand);

        client.tempData.delete(`bj_${interaction.user.id}`);

        if (playerScore > 21) {
          const embed = new EmbedBuilder()
            .setTitle('💥 Éliminé en doublant ! (Bust)')
            .setDescription(
              `Tu as tiré un \`${game.playerHand[game.playerHand.length - 1].name}\` et dépassé 21 avec un total de **${playerScore}** !\nTu perds ta mise doublée de **${game.bet}** ${EMOJI_COIN}.`,
            )
            .setColor('#FF4D4D')
            .addFields(
              {
                name: 'Tes cartes',
                value: `${formatHand(game.playerHand)} (Total: ${playerScore})`,
                inline: true,
              },
              {
                name: 'Croupier',
                value: `${formatHand(game.dealerHand)}`,
                inline: true,
              },
            );
          return interaction.editReply({ embeds: [embed], components: [] });
        }

        // Si pas de bust, le croupier tire ses cartes
        let dealerScore = calculateScore(game.dealerHand);
        while (dealerScore < 17) {
          game.dealerHand.push(drawCard());
          dealerScore = calculateScore(game.dealerHand);
        }

        let resultTitle = '';
        let resultColor = '';
        let resultMsg = '';

        if (dealerScore > 21 || playerScore > dealerScore) {
          const winnings = game.bet * 2;
          await addBalance(interaction.user.id, winnings, pool);

          resultTitle = '🎉 Victoire Doublée !';
          resultColor = '#4CAF50';
          resultMsg = `Bravo ! Ton risque a payé, tu remportes **${winnings}** ${EMOJI_COIN} !`;
        } else if (playerScore === dealerScore) {
          await addBalance(interaction.user.id, game.bet, pool);

          resultTitle = '🤝 Égalité !';
          resultColor = '#FFC107';
          resultMsg = `Égalité ! Ta mise doublée de **${game.bet}** ${EMOJI_COIN} t'est restituée.`;
        } else {
          resultTitle = '💀 Défaite !';
          resultColor = '#FF4D4D';
          resultMsg = `Le croupier gagne avec ${dealerScore}. Tu perds ta mise doublée de **${game.bet}** ${EMOJI_COIN}.`;
        }

        const embed = new EmbedBuilder()
          .setTitle(resultTitle)
          .setDescription(resultMsg)
          .setColor(resultColor)
          .addFields(
            {
              name: '🃏 Tes cartes',
              value: `${formatHand(game.playerHand)} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `${formatHand(game.dealerHand)} (Total : **${dealerScore}**)`,
              inline: true,
            },
          );

        return interaction.editReply({ embeds: [embed], components: [] });
      }

      // Action: Tirer une carte (Hit)
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
                value: `${formatHand(game.playerHand)} (Total: ${playerScore})`,
                inline: true,
              },
              {
                name: 'Croupier',
                value: `${formatHand(game.dealerHand)}`,
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
              value: `${formatHand(game.playerHand)} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `\`${game.dealerHand[0].name}\` ❓`,
              inline: true,
            },
            {
              name: '💰 Mise en jeu',
              value: `**${game.bet}** ${EMOJI_COIN}`,
              inline: false,
            },
          );

        // Retrait de l'option "Doubler" dès le premier tirage
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('bj_hit')
            .setLabel('Tirer 🃏')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('bj_stand')
            .setLabel('Rester 🛑')
            .setStyle(ButtonStyle.Success),
        );

        return interaction.editReply({
          embeds: [embed],
          components: [buttons],
        });
      }

      // Action: Rester (Stand)
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
          const winnings = game.bet * 2;
          await addBalance(interaction.user.id, winnings, pool);

          resultTitle = '🎉 Victoire !';
          resultColor = '#4CAF50';
          resultMsg = `Tu remportes la partie et gagne **${winnings}** ${EMOJI_COIN} !`;
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
              value: `${formatHand(game.playerHand)} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `${formatHand(game.dealerHand)} (Total : **${dealerScore}**)`,
              inline: true,
            },
          );

        return interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
};
