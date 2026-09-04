import {
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545128700985614336>';

export const data = new SlashCommandBuilder()
  .setName('roulette')
  .setDescription(
    'Joue à la roulette européenne / française et tente ta chance !',
  )
  .addIntegerOption((option) =>
    option
      .setName('mise')
      .setDescription('Le montant de coins à miser')
      .setRequired(true)
      .setMinValue(1),
  )
  .addIntegerOption((option) =>
    option
      .setName('numero')
      .setDescription(
        'Optionnel : Choisissez un numéro précis (0 à 36) si vous pariez sur un chiffre',
      )
      .setRequired(false)
      .setMinValue(0)
      .setMaxValue(36),
  );

export async function execute(interaction, pool) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const betAmount = interaction.options.getInteger('mise');
  const chosenNumber = interaction.options.getInteger('numero');
  const userBalance = await getBalance(interaction.user.id, pool);

  if (userBalance < betAmount) {
    return interaction.editReply(
      `❌ Solde insuffisant ! Tu as **${userBalance}** ${EMOJI_COIN} mais tu veux miser **${betAmount}** ${EMOJI_COIN}.`,
    );
  }

  // Stockage temporaire des données de la partie
  interaction.client.tempData.set(`roulette_${interaction.user.id}`, {
    bet: betAmount,
    chosenNumber: chosenNumber,
  });

  // Construction du menu de sélection
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('roulette_type')
    .setPlaceholder('Choisis ton type de pari...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('🔴 Rouge (Ratio 1:1)')
        .setDescription('Gagne si la bille tombe sur une case rouge')
        .setValue('red'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⚫ Noir (Ratio 1:1)')
        .setDescription('Gagne si la bille tombe sur une case noire')
        .setValue('black'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔢 Pair (Ratio 1:1)')
        .setDescription('Gagne si le numéro tiré est pair (hors 0)')
        .setValue('even'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔢 Impair (Ratio 1:1)')
        .setDescription('Gagne si le numéro tiré est impair')
        .setValue('odd'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔽 Manque 1-18 (Ratio 1:1)')
        .setDescription('Gagne si le numéro est entre 1 et 18')
        .setValue('low'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔼 Passe 19-36 (Ratio 1:1)')
        .setDescription('Gagne si le numéro est entre 19 et 36')
        .setValue('high'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎯 Numéro Plein (Ratio 35:1)')
        .setDescription(
          chosenNumber !== null
            ? `Pari fixé sur le numéro ${chosenNumber}`
            : '⚠️ Nécessite de spécifier le numéro dans l’option du /roulette',
        )
        .setValue('number'),
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setTitle('🎡 Table de Roulette Française')
    .setDescription(
      `Mise engagée : **${betAmount}** ${EMOJI_COIN}\n` +
        (chosenNumber !== null
          ? `Numéro sélectionné : **${chosenNumber}**\n\n`
          : '\n') +
        'Choisis ton type de pari dans le menu ci-dessous pour lancer la roulette !',
    )
    .setColor('#2F3136');

  return interaction.editReply({ embeds: [embed], components: [row] });
}
