const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

/*
 * SOMMAIRE
 * COMMANDES ECRITES
 * FONCTIONS AUTOMATIQUES
 */

// Fichier JSON pour stocker la monnaie
const DATA_FILE = "./balances.json";
let balances = {};

// Charger les données au démarrage
if (fs.existsSync(DATA_FILE)) {
  balances = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Sauvegarder les données
function saveBalances() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(balances, null, 2));
}

// Nom de la monnaie
const CURRENCY = "🪙 Magik Coins";

// Quand le bot est prêt
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

/*
 * COMMANDES ECRITES
 * - solde
 * - ajout d'argent
 * - retrait d'argent
 * - classement
 */
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Vérifier le solde
  if (command === "!solde") {
    const userId = message.author.id;
    const balance = balances[userId] || 0;
    message.reply(`Tu as **${balance}** ${CURRENCY}`);
  }

  // Ajouter de l'argent (admin only)
  if (command === "!addcoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!addcoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) + amount;
    saveBalances();
    const member = message.guild.members.cache.get(mention.id);
    message.reply(
      `**${amount}** ${CURRENCY} ajoutés à **${
        member.displayName
      }**. \nSolde : **${balances[mention.id]}** ${CURRENCY}`
    );
  }

  // Retirer de l'argent (admin only)
  if (command === "!removecoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!removecoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) - amount;
    saveBalances();
    const member = message.guild.members.cache.get(mention.id);
    message.reply(
      `**${amount}** ${CURRENCY} retirés à **${
        member.displayName
      }**. \nSolde : **${balances[mention.id]}** ${CURRENCY}`
    );
  }

  // Classement
  if (command === "!classement") {
    let ranking = Object.entries(balances).sort((a, b) => b[1] - a[1]);
    rankingTopTen = ranking.slice(0, 10);

    // On récupère l'index du joueur qui a demandé le classement
    const myIndex = ranking.findIndex(
      ([userId]) => userId === message.author.id
    );
    const myBalance = balances[message.author.id] || 0;

    if (ranking.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    let msg = "";
    if (myBalance !== 0) {
      msg += `**Ta place :** ${
        myIndex + 1
      }ᵉ avec **${myBalance}** ${CURRENCY}\n\n`;
    } else {
      msg += `**Ta place :** Vous n'avez pas encore de ${CURRENCY}\n\n`;
    }
    msg += `**Top 10 :**\n`;
    rankingTopTen.forEach(([userId, balance], index) => {
      const member = message.guild.members.cache.get(userId);
      if (balance !== 0) {
        msg += `**${index + 1}.** ${
          member ? member.displayName : "Utilisateur inconnu"
        } — **${balance}** ${CURRENCY}\n`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("\u2003\u2003🏆 Classement 🏆")
      .setDescription(msg) // ton texte du top ici
      .setColor("#FFD700"); // doré

    message.channel.send({ embeds: [embed] });
  }
});

/*
 * FONCTIONS AUTOMATIQUES
 * - rules
 */
// rules
// 🔧 Variables d'environnement
const MESSAGE_ID = process.env.RULES_MESSAGE;
const ROLE_A = process.env.ROLE_REINCARNEE;
const ROLE_B = process.env.ROLE_GUILDEUX;

const RULES_EMOJI = process.env.RULES_EMOJI || "✅";

client.on("messageReactionAdd", async (reaction, user) => {
  try {
    // Assurer les données complètes
    if (reaction.partial) await reaction.fetch();
    if (user.partial) await user.fetch();

    const msg = reaction.message;
    if (!msg.guild) return;
    if (user.bot) return;

    // Filtrer par message + emoji
    if (msg.id !== MESSAGE_ID) return;
    if (reaction.emoji.id) {
      if (RULES_EMOJI && RULES_EMOJI === "✅") {
      } else if (RULES_EMOJI && reaction.emoji.id !== RULES_EMOJI) {
        return;
      }
    } else {
      if (RULES_EMOJI && reaction.emoji.name !== RULES_EMOJI) return;
    }

    const member = await msg.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // Si l'utilisateur n'a PAS déjà le rôle B, on lui donne A
    if (!member.roles.cache.has(ROLE_B)) {
      await member.roles.add(ROLE_A, "Validation des règles");
      console.log(`🎉 Rôle donné à ${member.displayName}`);
    }
  } catch (err) {
    console.error("Erreur réaction (add):", err);
  }
});

// Retirer le rôle si la réaction est retirée
client.on("messageReactionRemove", async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    if (user.partial) await user.fetch();

    const msg = reaction.message;
    if (!msg.guild) return;
    if (user.bot) return;
    if (msg.id !== MESSAGE_ID) return;

    const member = await msg.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // Si tu veux retirer le rôle A quand on retire la réaction :
    if (member.roles.cache.has(ROLE_A)) {
      await member.roles.remove(ROLE_A, "Réaction retirée");
      console.log(`♻️ Rôle retiré à ${member.displayName}`);
    }
  } catch (err) {
    console.error("Erreur réaction (remove):", err);
  }
});

client.login(process.env.TOKEN); // token bot discord
