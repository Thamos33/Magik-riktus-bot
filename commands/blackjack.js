import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { addBalance, getBalance, removeBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545124652383469719>';

// Tirage d'une carte réaliste (valeur + symbole d'affichage)
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

export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription(
    'Joue une partie de Blackjack et tente de doubler tes coins !',
  )
  .addIntegerOption((option) =>
    option
      .setName('mise')
      .setDescription('Le montant de coins à miser')
      .setRequired(true)
      .setMinValue(1),
  );

export async function execute(interaction, pool) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const betAmount = interaction.options.getInteger('mise');
  const userBalance = await getBalance(interaction.user.id, pool);

  if (userBalance < betAmount) {
    return interaction.editReply(
      `❌ Solde insuffisant ! Tu as **${userBalance}** ${EMOJI_COIN} mais tu veux miser **${betAmount}** ${EMOJI_COIN}.`,
    );
  }

  // Déduction de la mise initiale
  await removeBalance(interaction.user.id, betAmount, pool);

  // Distribution initiale
  const playerHand = [drawCard(), drawCard()];
  const dealerHand = [drawCard(), drawCard()];

  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);

  // --- VÉRIFICATION DU BLACKJACK NATUREL (21 direct) ---
  if (playerScore === 21) {
    if (dealerScore === 21) {
      // Égalité Blackjack
      await addBalance(interaction.user.id, betAmount, pool);
      const embed = new EmbedBuilder()
        .setTitle('🤝 Égalité (Double Blackjack !)')
        .setDescription(
          `Vous avez tous les deux un Blackjack naturel ! Ta mise de **${betAmount}** ${EMOJI_COIN} t'est restituée.`,
        )
        .setColor('#FFC107')
        .addFields(
          {
            name: '🃏 Tes cartes',
            value: `${formatHand(playerHand)} (21)`,
            inline: true,
          },
          {
            name: '🤖 Croupier',
            value: `${formatHand(dealerHand)} (21)`,
            inline: true,
          },
        );
      return interaction.editReply({ embeds: [embed] });
    }

    // Victoire Blackjack naturel (Payé 3:2 -> mise x 2.5)
    const winnings = Math.floor(betAmount * 2.5);
    await addBalance(interaction.user.id, winnings, pool);

    const embed = new EmbedBuilder()
      .setTitle('🔥 BLACKJACK !')
      .setDescription(
        `Tu as un Blackjack naturel ! Tu remportes **${winnings}** ${EMOJI_COIN} (Payé 3:2) !`,
      )
      .setColor('#4CAF50')
      .addFields(
        {
          name: '🃏 Tes cartes',
          value: `${formatHand(playerHand)} (21)`,
          inline: true,
        },
        {
          name: '🤖 Croupier',
          value: `${formatHand(dealerHand)} (Total: ${dealerScore})`,
          inline: true,
        },
      );
    return interaction.editReply({ embeds: [embed] });
  }

  // Stockage de la partie en mémoire
  interaction.client.tempData.set(`bj_${interaction.user.id}`, {
    bet: betAmount,
    playerHand,
    dealerHand,
  });

  const embed = new EmbedBuilder()
    .setTitle('🎰 Table de Blackjack')
    .setColor('#2F3136')
    .addFields(
      {
        name: '🃏 Tes cartes',
        value: `${formatHand(playerHand)} (Total : **${playerScore}**)`,
        inline: true,
      },
      {
        name: '🤖 Croupier',
        value: `\`${dealerHand[0].name}\` ❓`,
        inline: true,
      },
      {
        name: '💰 Mise en jeu',
        value: `**${betAmount}** ${EMOJI_COIN}`,
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
    new ButtonBuilder()
      .setCustomId('bj_double')
      .setLabel('Doubler ✖️2')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(userBalance < betAmount * 2), // Désactivé si pas assez de coins pour doubler
  );

  return interaction.editReply({ embeds: [embed], components: [buttons] });
}
