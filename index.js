import fs from "fs";
import sqlite3 from "sqlite3";
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from "discord.js";

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

const DATA_DIR = "./data";
const DB_FILE = `${DATA_DIR}/balances.sqlite`;

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log("📁 Dossier data créé");
}

// Initialiser SQLite
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_FILE, (err) => {
  if (err) return console.error("❌ Erreur DB:", err.message);
  console.log("✅ DB prête !");
});

// Créer la table si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS balances (
    userId TEXT PRIMARY KEY,
    balance INTEGER
  )
`);

// Récupérer le solde d'un utilisateur
function getBalance(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT balance FROM balances WHERE userId = ?",
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.balance : 0);
      }
    );
  });
}

// Ajouter de l'argent
function addBalance(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO balances(userId, balance) VALUES(?, ?)
       ON CONFLICT(userId) DO UPDATE SET balance = balance + ?`,
      [userId, amount, amount],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

// Retirer de l'argent
function removeBalance(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO balances(userId, balance) VALUES(?, ?)
       ON CONFLICT(userId) DO UPDATE SET balance = balance - ?`,
      [userId, -amount, amount],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

// Récupérer le classement complet
function getRanking() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT userId, balance FROM balances ORDER BY balance DESC",
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Nom de la monnaie
const CURRENCY = "🪙 Magik Coins";

// Quand le bot est prêt
client.once("clientReady", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

/*
 * COMMANDES ECRITES
 * - solde
 * - ajout d'argent
 * - retrait d'argent
 * - classement
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Vérifier le solde
  if (command === "!solde") {
    const userId = message.author.id;
    const balance = await getBalance(userId); // <--- await

    const embed = new EmbedBuilder()
      .setTitle(`Mon solde`)
      .setDescription(`Tu as **${balance}** ${CURRENCY}`)
      .setColor("#165416");

    message.channel.send({ embeds: [embed] });
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

    await addBalance(mention.id, amount);
    const balance = await getBalance(mention.id);
    const member = message.guild.members.cache.get(mention.id);
    const embed = new EmbedBuilder()
      .setTitle(`Gain ${CURRENCY}`)
      .setDescription(
        `**${amount}** ${CURRENCY} ajoutés à **${member.displayName}**. \n\nSolde : **${balance}** ${CURRENCY}`
      ) // contenu
      .setColor("#5CA25F");

    message.channel.send({ embeds: [embed] });
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

    await removeBalance(mention.id, amount);
    const balance = await getBalance(mention.id);
    const member = message.guild.members.cache.get(mention.id);

    const embed = new EmbedBuilder()
      .setTitle(`Perte ${CURRENCY}`)
      .setDescription(
        `**${amount}** ${CURRENCY} retirés à **${member.displayName}**. \n\nSolde : **${balance}** ${CURRENCY}`
      ) // contenu
      .setColor("#9e0e40");

    message.channel.send({ embeds: [embed] });
  }

  //classement
  if (command === "!classement") {
    const ranking = await getRanking();
    let rankingTopTen = ranking.slice(0, 10);

    // index de l’utilisateur
    const myIndex = ranking.findIndex((r) => r.userId === message.author.id);
    const myBalance = await getBalance(message.author.id);

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
      const member = message.guild.members.cache.get(String(userId));
      if (balance !== 0) {
        msg += `**${index + 1}.** ${
          member ? member.displayName : "Utilisateur inconnu"
        } — **${balance}** ${CURRENCY}\n`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Classement 🏆")
      .setDescription(msg)
      .setColor("#FFD700");

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
