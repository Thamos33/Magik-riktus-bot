import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  MessageFlags,
} from 'discord.js';
import { scheduleMessage } from '../utils/auto-send.js';
import {
  addBalance,
  getBalance,
  incrementGamesPlayed,
  removeBalance,
} from '../utils/balance.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMOJI_COIN = '<:magikcoin:1545128700985614336>';

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

      // Fonction utilitaire pour envoyer le bilan final publiquement
      const sendFinalResult = async (
        title,
        description,
        color,
        playerScore,
        dealerScore,
      ) => {
        client.tempData.delete(`bj_${interaction.user.id}`);

        // Récupération du solde actuel mis à jour
        const finalBalance = await getBalance(interaction.user.id, pool);

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .addFields(
            {
              name: '🃏 Cartes du joueur',
              value: `${formatHand(game.playerHand)} (Total : **${playerScore}**)`,
              inline: true,
            },
            {
              name: '🤖 Croupier',
              value: `${formatHand(game.dealerHand)} (Total : **${dealerScore}**)`,
              inline: true,
            },
            {
              name: '💳 Solde restant',
              value: `**${finalBalance}** ${EMOJI_COIN}`,
              inline: false,
            },
          )
          .setFooter({
            text: `Partie de ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        // 1. On nettoie l'interaction éphémère du joueur
        await interaction.editReply({
          content:
            '🏁 **Partie terminée !** Le résultat a été publié dans le salon.',
          embeds: [],
          components: [],
        });

        // 2. On publie le résultat dans le salon (visible par tous)
        await interaction.channel.send({
          content: `🎰 **Résultat du Blackjack de ${interaction.user}**`,
          embeds: [embed],
        });
      };

      // Action: Doubler la mise (Double Down)
      if (interaction.customId === 'bj_double') {
        await removeBalance(interaction.user.id, game.bet, pool);
        game.bet *= 2;

        game.playerHand.push(drawCard());
        const playerScore = calculateScore(game.playerHand);

        if (playerScore > 21) {
          const dealerScore = calculateScore(game.dealerHand);
          return sendFinalResult(
            '💥 Éliminé en doublant ! (Bust)',
            `Tu as tiré un \`${game.playerHand[game.playerHand.length - 1].name}\` et dépassé 21 avec un total de **${playerScore}** !\nTu perds ta mise doublée de **${game.bet}** ${EMOJI_COIN}.`,
            '#FF4D4D',
            playerScore,
            dealerScore,
          );
        }

        let dealerScore = calculateScore(game.dealerHand);
        while (dealerScore < 17) {
          game.dealerHand.push(drawCard());
          dealerScore = calculateScore(game.dealerHand);
        }

        if (dealerScore > 21 || playerScore > dealerScore) {
          const winnings = game.bet * 2;
          await addBalance(
            interaction.user.id,
            winnings,
            pool,
            interaction.user.username,
          );
          return sendFinalResult(
            '🎉 Victoire Doublée !',
            `Bravo ! Ton risque a payé, tu remportes **${winnings}** ${EMOJI_COIN} !`,
            '#4CAF50',
            playerScore,
            dealerScore,
          );
        } else if (playerScore === dealerScore) {
          await addBalance(
            interaction.user.id,
            game.bet,
            pool,
            interaction.user.username,
          );
          return sendFinalResult(
            '🤝 Égalité !',
            `Égalité ! Ta mise doublée de **${game.bet}** ${EMOJI_COIN} t'est restituée.`,
            '#FFC107',
            playerScore,
            dealerScore,
          );
        } else {
          return sendFinalResult(
            '💀 Défaite !',
            `Le croupier gagne avec ${dealerScore}. Tu perds ta mise doublée de **${game.bet}** ${EMOJI_COIN}.`,
            '#FF4D4D',
            playerScore,
            dealerScore,
          );
        }
      }

      // Action: Tirer une carte (Hit)
      if (interaction.customId === 'bj_hit') {
        game.playerHand.push(drawCard());
        const playerScore = calculateScore(game.playerHand);

        if (playerScore > 21) {
          const dealerScore = calculateScore(game.dealerHand);
          return sendFinalResult(
            '💥 Éliminé ! (Bust)',
            `Tu as dépassé 21 avec un score de **${playerScore}** !\nTu perds ta mise de **${game.bet}** ${EMOJI_COIN}.`,
            '#FF4D4D',
            playerScore,
            dealerScore,
          );
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
        let dealerScore = calculateScore(game.dealerHand);

        while (dealerScore < 17) {
          game.dealerHand.push(drawCard());
          dealerScore = calculateScore(game.dealerHand);
        }

        const playerScore = calculateScore(game.playerHand);

        if (dealerScore > 21 || playerScore > dealerScore) {
          const winnings = game.bet * 2;
          await addBalance(
            interaction.user.id,
            winnings,
            pool,
            interaction.user.username,
          );
          return sendFinalResult(
            '🎉 Victoire !',
            `Tu remportes la partie et gagne **${winnings}** ${EMOJI_COIN} !`,
            '#4CAF50',
            playerScore,
            dealerScore,
          );
        } else if (playerScore === dealerScore) {
          await addBalance(
            interaction.user.id,
            game.bet,
            pool,
            interaction.user.username,
          );
          return sendFinalResult(
            '🤝 Égalité !',
            `Égalité parfaite ! Ta mise de **${game.bet}** ${EMOJI_COIN} t'a été restituée.`,
            '#FFC107',
            playerScore,
            dealerScore,
          );
        } else {
          return sendFinalResult(
            '💀 Défaite !',
            `Le croupier l'emporte avec ${dealerScore}. Tu perds ta mise de **${game.bet}** ${EMOJI_COIN}.`,
            '#FF4D4D',
            playerScore,
            dealerScore,
          );
        }
      }
    }

    // --- 4. GESTION DE LA ROULETTE (Menu déroulant) ---
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'roulette_type'
    ) {
      const game = client.tempData.get(`roulette_${interaction.user.id}`);

      if (!game) {
        return interaction.reply({
          content:
            '❌ Aucune partie de roulette active trouvée ou le temps a expiré.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const betType = interaction.values[0];

      // Vérification si pari sur numéro plein sans numéro spécifié
      if (betType === 'number' && game.chosenNumber === null) {
        return interaction.reply({
          content:
            '❌ Tu dois spécifier le numéro sur lequel tu paries dans la commande : `/roulette mise:<montant> numero:<0-36>` !',
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferUpdate();

      // Incrémentation des parties jouées et mise à jour du nom
      await incrementGamesPlayed(
        interaction.user.id,
        pool,
        interaction.user.username,
      );

      // Déduction de la mise au moment de la validation du pari
      await removeBalance(interaction.user.id, game.bet, pool);
      client.tempData.delete(`roulette_${interaction.user.id}`);

      // --- TIRAGE DE LA ROULETTE (0 à 36) ---
      const winningNumber = Math.floor(Math.random() * 37);

      // Définition des cases rouges de la roulette européenne
      const RED_NUMBERS = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
      ];

      let isRed = RED_NUMBERS.includes(winningNumber);
      let isZero = winningNumber === 0;

      let colorEmoji = isZero ? '🟢' : isRed ? '🔴' : '⚫';
      let colorName = isZero ? 'Vert' : isRed ? 'Rouge' : 'Noir';

      // --- CALCUL DU GAIN ---
      let multiplier = 0;
      let won = false;
      let betLabel = '';

      switch (betType) {
        case 'red':
          betLabel = 'Couleur Rouge 🔴';
          if (isRed) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'black':
          betLabel = 'Couleur Noire ⚫';
          if (!isRed && !isZero) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'even':
          betLabel = 'Numéro Pair 🔢';
          if (winningNumber % 2 === 0 && !isZero) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'odd':
          betLabel = 'Numéro Impair 🔢';
          if (winningNumber % 2 !== 0) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'low':
          betLabel = 'Manque (1-18) 🔽';
          if (winningNumber >= 1 && winningNumber <= 18) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'high':
          betLabel = 'Passe (19-36) 🔼';
          if (winningNumber >= 19 && winningNumber <= 36) {
            won = true;
            multiplier = 2;
          }
          break;
        case 'number':
          betLabel = `Numéro Plein (${game.chosenNumber}) 🎯`;
          if (winningNumber === game.chosenNumber) {
            won = true;
            multiplier = 36;
          }
          break;
      }

      let resultTitle = '';
      let resultMsg = '';
      let embedColor = '';

      if (won) {
        const winnings = game.bet * multiplier;
        await addBalance(
          interaction.user.id,
          winnings,
          pool,
          interaction.user.username,
        );
        resultTitle = '🎉 Gagné !';
        embedColor = '#4CAF50';
        resultMsg = `Félicitations ! Ton pari **${betLabel}** est gagnant ! Tu remportes **${winnings}** ${EMOJI_COIN} !`;
      } else {
        resultTitle = '💀 Perdu !';
        embedColor = '#FF4D4D';
        resultMsg = `Dommage ! La bille est tombée sur le mauvais numéro. Tu perds ta mise de **${game.bet}** ${EMOJI_COIN}.`;
      }

      const finalBalance = await getBalance(interaction.user.id, pool);

      const embed = new EmbedBuilder()
        .setTitle(resultTitle)
        .setDescription(resultMsg)
        .setColor(embedColor)
        .addFields(
          {
            name: '🎰 Résultat du tirage',
            value: `${colorEmoji} **${winningNumber}** (${colorName})`,
            inline: true,
          },
          {
            name: '🎯 Ton pari',
            value: `${betLabel} (Mise : **${game.bet}** ${EMOJI_COIN})`,
            inline: true,
          },
          {
            name: '💳 Solde restant',
            value: `**${finalBalance}** ${EMOJI_COIN}`,
            inline: false,
          },
        )
        .setFooter({
          text: `Partie de ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      // Nettoyage de l'interaction éphémère
      await interaction.editReply({
        content:
          '🏁 **Tirage effectué !** Le résultat a été publié dans le salon.',
        embeds: [],
        components: [],
      });

      // Publication du bilan public
      return interaction.channel.send({
        content: `🎡 **Roulette de ${interaction.user}**`,
        embeds: [embed],
      });
    }
  },
};
