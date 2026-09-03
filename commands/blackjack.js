import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription(
    'Joue une partie de Blackjack et tente de multiplier tes Magik-Coins 🪙',
  );

/**
 * Exécute la commande /blackjack
 * Déclenche une Modale pour demander la mise
 */
export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('blackjack_bet_modal')
    .setTitle('🎰 Casino - Blackjack');

  const betInput = new TextInputBuilder()
    .setCustomId('blackjack_bet_amount')
    .setLabel('Combien veux-tu miser ?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Exemple: 50')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(6);

  const row = new ActionRowBuilder().addComponents(betInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}
