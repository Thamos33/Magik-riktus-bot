import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { addBalance, getBalance } from '../utils/balance.js';

const EMOJI_COIN = '<:magikcoin:1545128700985614336>';

export const data = new SlashCommandBuilder()
  .setName('casino')
  .setDescription(
    'Découvre les jeux du casino et récupère ton bonus de bienvenue !',
  );

export async function execute(interaction, pool) {
  await interaction.deferReply();

  const userId = interaction.user.id;

  // 1. Vérification si le joueur existe déjà dans la base
  const currentBalance = await getBalance(userId, pool);

  let bonusGiven = false;
  let newBalance = currentBalance;

  // Syntaxe PostgreSQL : $1 au lieu de ? et result.rows au lieu de [rows]
  const result = await pool.query('SELECT * FROM balances WHERE user_id = $1', [
    userId,
  ]);

  if (result.rows.length === 0) {
    // Premier passage : Création du compte + attribution des 1000 coins + enregistrement du username
    await addBalance(userId, 1000, pool, interaction.user.username);
    bonusGiven = true;
    newBalance = 1000;
  }

  // 2. Construction du message de présentation des jeux
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
        value: `**${newBalance}** ${EMOJI_COIN}`,
        inline: false,
      },
    )
    .setFooter({
      text: `Bonne chance ${interaction.user.displayName} !`,
      iconURL: interaction.user.displayAvatarURL(),
    });

  return interaction.editReply({ embeds: [embed] });
}
