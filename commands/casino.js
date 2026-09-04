import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { addBalance, getBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545128700985614336>';

export const data = new SlashCommandBuilder()
  .setName('casino')
  .setDescription(
    'Découvre les jeux du casino et récupère ton bonus de bienvenue !',
  );

export async function execute(interaction, pool) {
  // 1. On diffère immédiatement la réponse en éphémère (comme sur les autres jeux)
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const userId = interaction.user.id;

  try {
    // 2. Une seule vérification du solde au lieu de deux requêtes réseau
    let currentBalance = await getBalance(userId, pool);
    let bonusGiven = false;

    // Si le solde renvoie 0, on vérifie si l'utilisateur existe vraiment
    const result = await pool.query(
      'SELECT 1 FROM balances WHERE user_id = $1',
      [userId],
    );

    if (result.rows.length === 0) {
      // Premier passage : Création du compte + attribution des 1000 coins
      await addBalance(userId, 1000, pool, interaction.user.username);
      bonusGiven = true;
      currentBalance = 1000;
    }

    // 3. Construction de l'embed
    const embed = new EmbedBuilder()
      .setTitle('🎰 Bienvenue au Casino !')
      .setDescription(
        bonusGiven
          ? `🎉 **C'est ta première visite !** Un bonus de bienvenue de **1 000** ${EMOJI_COIN} t'a été crédité.\n`
          : 'Retrouve ci-dessous tous les jeux disponibles sur le serveur pour tenter de multiplier tes coins !\n',
      )
      .setColor('#FFD700')
      .addFields(
        {
          name: '🃏 1. Le Blackjack (`/blackjack <mise>`)',
          value:
            'Affronte le croupier ! Le but est de vous rapprocher le plus possible de **21** sans jamais le dépasser.\n' +
            '• **Mise classique :** Doubler sa mise en cas de victoire.\n' +
            '• **Bouton Doubler :** Multiplie la mise par 2 mais ne donne qu’une seule carte supplémentaire.\n' +
            '• **Blackjack naturel (21 au tirage) :** Payé 3:2 (×2,5) !',
          inline: false,
        },
        {
          name: '🎡 2. La Roulette Française (`/roulette <mise> [numero]`)',
          value:
            'Choisis ton type de pari dans le menu déroulant après avoir lancé la commande :\n' +
            '• **Rouge / Noir / Pair / Impair / Manque / Passe :** Gains ×2.\n' +
            '• **Numéro Plein (0 à 36) :** Gains ×36 ! *(Nécessite d’indiquer l’option `numero` dans le /roulette)*.',
          inline: false,
        },
        {
          name: '🎟️ 3. La Loterie Instantanée (`/loterie <mise>`)',
          value:
            'Achète un ticket à gratter instantané et tente de décrocher le **Jackpot (×5)** !\n' +
            '• Contient 7 niveaux de prix allant du Jackpot jusqu’à la perte totale.',
          inline: false,
        },
        {
          name: '💳 Ton Solde Actuel',
          value: `**${currentBalance}** ${EMOJI_COIN}`,
          inline: false,
        },
      )
      .setFooter({
        text: `Bonne chance ${interaction.user.displayName} !`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    return await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erreur lors de l’exécution de /casino :', error);
    return await interaction.editReply({
      content: '❌ Une erreur est survenue lors de l’accès au Casino.',
    });
  }
}
