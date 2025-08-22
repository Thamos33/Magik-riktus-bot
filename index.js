const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

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
const CURRENCY = "🪙 Magik Coin";

// Quand le bot est prêt
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// Commandes simples
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Vérifier le solde
  if (command === "!solde") {
    const userId = message.author.id;
    const balance = balances[userId] || 0;
    message.reply(`Tu as ${balance} ${CURRENCY}`);
  }

  // Ajouter de l'argent (admin only)
  if (command === "!Acoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!addmagikcoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) + amount;
    saveBalances();
    message.reply(`${amount} ${CURRENCY} ajoutés à ${mention.username}`);
  }

  // Retirer de l'argent (admin only)
  if (command === "!Rcoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!removemagikcoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) - amount;
    saveBalances();
    message.reply(`${amount} ${CURRENCY} retirés à ${mention.username}`);
  }

  // Classement
  if (command === "!classement") {
    let ranking = Object.entries(balances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (ranking.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    let msg = "🏆 **Classement** 🏆\n";
    ranking.forEach(([userId, balance], index) => {
      const user = message.guild.members.cache.get(userId);
      msg += `**${index + 1}.** ${
        user ? user.user.username : "Utilisateur inconnu"
      } — ${balance} ${CURRENCY}\n`;
    });

    message.channel.send(msg);
  }
});

// rules
// ID du message et des rôles
const MESSAGE_ID = process.env.rulesMessage; // remplace par l'ID du message
const ROLE_A = process.env.roleReincarnee; // rôle à donner
const ROLE_B = process.env.roleGuildeux; // rôle à vérifier avant

// Quand un utilisateur ajoute la réaction
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.id !== MESSAGE_ID) return; // seulement ce message
  if (user.bot) return; // ignore les bots

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);

  // Vérifie si l'utilisateur n'a pas déjà le rôle B
  if (!member.roles.cache.has(ROLE_B)) {
    await member.roles.add(ROLE_A);
    console.log(`🎉 Ajout du rôle Ame réincarnée à ${user.username}`);
  }
});

client.login(process.env.TOKEN); // token bot discord
