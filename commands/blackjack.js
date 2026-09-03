import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { getBalance, removeBalance } from '../utils/balance.js';

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
  data: new SlashCommandBuilder()
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
    ),

  async execute(interaction, pool) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const betAmount = interaction.options.getInteger('mise');
    const userBalance = await getBalance(interaction.user.id, pool);

    if (userBalance < betAmount) {
      return interaction.editReply(
        `❌ Solde insuffisant ! Tu as **${userBalance}** ${EMOJI_COIN} mais tu veux miser **${betAmount}** ${EMOJI_COIN}.`,
      );
    }

    // Déduction de la mise
    await removeBalance(interaction.user.id, betAmount, pool);

    // Distribution initiale
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];

    // Stockage de la partie en mémoire
    interaction.client.tempData.set(`bj_${interaction.user.id}`, {
      bet: betAmount,
      playerHand,
      dealerHand,
    });

    const playerScore = calculateScore(playerHand);

    const embed = new EmbedBuilder()
      .setTitle('🎰 Table de Blackjack')
      .setColor('#2F3136')
      .addFields(
        {
          name: '🃏 Tes cartes',
          value: `${playerHand.join(' - ')} (Total : **${playerScore}**)`,
          inline: true,
        },
        {
          name: '🤖 Croupier',
          value: `${dealerHand[0]} - ❓`,
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
        .setLabel('Tirer une carte 🃏')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Rester 🛑')
        .setStyle(ButtonStyle.Success),
    );

    return interaction.editReply({ embeds: [embed], components: [buttons] });
  },
};
