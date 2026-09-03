import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { addBalance, getBalance, removeBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545128700985614336>';

// Table des tirages avec tes probabilités exactes
const PRIZE_TABLE = [
  { label: '🎉 JACKPOT !', multiplier: 10, chance: 1, color: '#FFD700' },
  { label: '🔥 Super Gain !', multiplier: 2, chance: 9, color: '#4CAF50' },
  { label: '✨ Beau Gain !', multiplier: 1.4, chance: 10, color: '#8BC34A' },
  { label: '👍 Petit Gain', multiplier: 1.2, chance: 15, color: '#CDDC39' },
  { label: '🤝 Mise Remboursée', multiplier: 1, chance: 30, color: '#FFC107' },
  {
    label: '📉 Perte Partielle',
    multiplier: 0.5,
    chance: 15,
    color: '#FF9800',
  },
  {
    label: '💀 Un incroyable rien !',
    multiplier: 0,
    chance: 20,
    color: '#FF4D4D',
  },
];

function drawPrize() {
  const rand = Math.random() * 100; // Tirage entre 0 et 100
  let cumulative = 0;

  for (const prize of PRIZE_TABLE) {
    cumulative += prize.chance;
    if (rand < cumulative) {
      return prize;
    }
  }
  return PRIZE_TABLE[PRIZE_TABLE.length - 1];
}

export const data = new SlashCommandBuilder()
  .setName('loterie')
  .setDescription(
    'Achète un ticket de loterie instantané et tente de décrocher le Jackpot !',
  )
  .addIntegerOption((option) =>
    option
      .setName('mise')
      .setDescription('Le prix du ticket de loterie')
      .setRequired(true)
      .setMinValue(1),
  );

export async function execute(interaction, pool) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const betAmount = interaction.options.getInteger('mise');
  const userBalance = await getBalance(interaction.user.id, pool);

  if (userBalance < betAmount) {
    return interaction.editReply(
      `❌ Solde insuffisant ! Tu as **${userBalance}** ${EMOJI_COIN} mais le ticket coûte **${betAmount}** ${EMOJI_COIN}.`,
    );
  }

  // Déduction du prix du ticket
  await removeBalance(interaction.user.id, betAmount, pool);

  // Tirage au sort
  const prize = drawPrize();
  const winnings = Math.floor(betAmount * prize.multiplier);

  // Distribution des gains si > 0
  if (winnings > 0) {
    await addBalance(interaction.user.id, winnings, pool);
  }

  const finalBalance = await getBalance(interaction.user.id, pool);

  const embed = new EmbedBuilder()
    .setTitle(`🎟️ Loterie : ${prize.label}`)
    .setColor(prize.color)
    .addFields(
      {
        name: '🎫 Prix du ticket',
        value: `**${betAmount}** ${EMOJI_COIN}`,
        inline: true,
      },
      {
        name: '💰 Multiplicateur',
        value: `**×${prize.multiplier}**`,
        inline: true,
      },
      {
        name: '🎁 Gain final',
        value: `**${winnings}** ${EMOJI_COIN}`,
        inline: true,
      },
      {
        name: '💳 Solde restant',
        value: `**${finalBalance}** ${EMOJI_COIN}`,
        inline: false,
      },
    )
    .setFooter({
      text: `Ticket gratté par ${interaction.user.displayName}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

  // Message éphémère de confirmation pour le joueur
  await interaction.editReply({
    content:
      '🎟️ **Ticket gratté !** Le résultat de ta loterie a été publié dans le salon.',
  });

  // Publication publique du résultat dans le salon
  return interaction.channel.send({
    content: `🎟️ **Loterie de ${interaction.user}**`,
    embeds: [embed],
  });
}
