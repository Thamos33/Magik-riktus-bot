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
 * DATABASE
 * COMMANDES ECRITES
 * FONCTIONS AUTOMATIQUES
 */

import "./database.js";

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
 */
import "./commands.js";

/*
 * FONCTIONS AUTOMATIQUES
 */
import "./auto-functions.js";

client.login(process.env.TOKEN); // token bot discord
