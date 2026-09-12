import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { addBalance, getBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545128700985614336>';
const AMOUNT_GIVEN = 500;

export const data = new SlashCommandBuilder()
  .setName('renflouer')
  .setDescription('🧪 [BETA] Récupère 500 coins si ton solde est tombé à 0.');

export async function execute(interaction, pool) {
  // On répond en message éphémère (seul le joueur voit le message)
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const userId = interaction.user.id;

  try {
    // 1. Récupération du solde actuel
    const currentBalance = await getBalance(userId, pool);

    // 2. Vérification : le joueur doit avoir exactement 0 coin (ou moins en cas de bug)
    if (currentBalance > 0) {
      const embedRefused = new EmbedBuilder()
        .setTitle('⛔ Demande refusée')
        .setDescription(
          `Tu as encore **${currentBalance}** ${EMOJI_COIN} !\nCette commande ne fonctionne que lorsque ton solde est totalement épuisé (**0** ${EMOJI_COIN}).`,
        )
        .setColor('#FF0000');

      return await interaction.editReply({ embeds: [embedRefused] });
    }

    // 3. Attribution des 500 coins
    await addBalance(userId, AMOUNT_GIVEN, pool, interaction.user.username);

    const embedSuccess = new EmbedBuilder()
      .setTitle('💸 Renflouement réussi !')
      .setDescription(
        `Tes caisses étaient vides ! Tu as reçu **${AMOUNT_GIVEN}** ${EMOJI_COIN} de secours pour continuer à tester le casino.`,
      )
      .setColor('#00FF00')
      .setFooter({ text: 'Commande temporaire - Phase de test Beta' });

    return await interaction.editReply({ embeds: [embedSuccess] });
  } catch (error) {
    console.error('❌ Erreur lors de la commande /renflouer :', error);
    return await interaction.editReply({
      content: '❌ Une erreur est survenue lors du renflouement.',
    });
  }
}
