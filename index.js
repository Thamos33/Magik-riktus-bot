const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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

// Nom de ta monnaie
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
  if (command === "!balance") {
    const userId = message.author.id;
    const balance = balances[userId] || 0;
    message.reply(`Tu as ${balance} ${CURRENCY}`);
  }

  // Ajouter de l'argent (admin only)
  if (command === "!addmoney") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!addmoney @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) + amount;
    saveBalances();
    message.reply(`${amount} ${CURRENCY} ajoutés à ${mention.username}`);
  }

  // Classement
  if (command === "!leaderboard") {
    let ranking = Object.entries(balances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (ranking.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    let msg = "🏆 **Leaderboard** 🏆\n";
    ranking.forEach(([userId, balance], index) => {
      const user = message.guild.members.cache.get(userId);
      msg += `**${index + 1}.** ${
        user ? user.user.username : "Utilisateur inconnu"
      } — ${balance} ${CURRENCY}\n`;
    });

    message.channel.send(msg);
  }
});

client.login(process.env.TOKEN); // 🔑 Remplace par ton token Discord
