import pkg from "pg";
import fs from "fs/promises";
import path from "path";
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";

const { Pool } = pkg;

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

// Connexion à Postgres via Railway (les variables PG* sont déjà fournies)
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }, // Railway nécessite SSL
});

// Vérifier la connexion et créer la table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS balances (
        userId TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0
      )
    `);
    await pool.query(`
      TRUNCATE TABLE submissions RESTART IDENTITY
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL
)
    `);
    console.log("✅ DB Postgres prête !");
  } catch (err) {
    console.error("❌ Erreur DB:", err.message);
  }
})();

// ----------------------
// Fonctions utilitaires
// ----------------------

// Récupérer le solde d'un utilisateur
async function getBalance(userId) {
  try {
    const res = await pool.query(
      "SELECT balance FROM balances WHERE userId = $1",
      [userId]
    );
    return res.rows.length > 0 ? res.rows[0].balance : 0;
  } catch (err) {
    console.error("❌ Erreur getBalance:", err.message);
    return 0;
  }
}
const res = await pool.query(
  "SELECT * FROM submissions ORDER BY submitted_at ASC"
);

// Récupérer toutes les submissions
async function getSubmissions() {
  try {
    const res = await pool.query(
      "SELECT id, user_id, username, file_path, file_name FROM submissions ORDER BY id ASC"
    );
    return res;
  } catch (err) {
    console.error("❌ Erreur getSubmissions:", err.message);
    return 0;
  }
}

// Mettre a jour une submissions
async function updateSubmissions(userId, userName, filePath, fileName) {
  try {
    await pool.query(
      `INSERT INTO submissions (user_id, username, file_path, file_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET 
         username = EXCLUDED.username, 
         file_path = EXCLUDED.file_path, 
         file_name = EXCLUDED.file_name`,
      [userId, userName, filePath, fileName]
    );
  } catch (err) {
    console.error("❌ Erreur updateSubmissions:", err.message);
  }
}

// Récupérer une submission particulière
async function getSubmissionsById(userId) {
  try {
    const res = await pool.query(
      `SELECT file_path FROM submissions WHERE user_id = $1`,
      [userId]
    );
    return res;
  } catch (err) {
    console.error("❌ Erreur getSubmissionsById:", err.message);
    return 0;
  }
}

// Ajouter de l'argent
async function addBalance(userId, amount) {
  try {
    await pool.query(
      `INSERT INTO balances (userId, balance)
       VALUES ($1, $2)
       ON CONFLICT (userId) DO UPDATE SET balance = balances.balance + $2`,
      [userId, amount]
    );
  } catch (err) {
    console.error("❌ Erreur addBalance:", err.message);
  }
}

// Retirer de l'argent
async function removeBalance(userId, amount) {
  try {
    await pool.query(
      `INSERT INTO balances (userId, balance)
       VALUES ($1, $2)
       ON CONFLICT (userId) DO UPDATE SET balance = balances.balance - $2`,
      [userId, amount]
    );
  } catch (err) {
    console.error("❌ Erreur removeBalance:", err.message);
  }
}

// Récupérer le classement complet
async function getRanking() {
  try {
    const res = await pool.query(
      "SELECT userId, balance FROM balances ORDER BY balance DESC"
    );
    return res.rows;
  } catch (err) {
    console.error("❌ Erreur getRanking:", err.message);
    return [];
  }
}

// Fonction pour envoyer une image
async function handleSend(message, pool) {
  const att = message.attachments.first();
  if (
    !att ||
    !(
      att.contentType?.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp)$/i.test(att.name ?? "")
    )
  ) {
    await message.reply("⚠️ Envoie une image avec la commande !");
    return;
  }

  const res = await fetch(att.url);
  if (!res.ok) {
    await message.reply("❌ Impossible de télécharger l'image.");
    return;
  }

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const ext = path.extname(att.name || new URL(att.url).pathname) || ".png";
  const dir = path.join(process.cwd(), "screens");
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${message.author.id}_${Date.now()}${ext}`;
  const filePath = path.join(dir, fileName);

  // Supprimer l'ancien fichier s'il existe déjà pour cet utilisateur
  const prev = await getSubmissionsById(message.author.id);

  await fs.writeFile(filePath, buffer);

  await updateSubmissions(
    message.author.id,
    message.author.username,
    filePath,
    fileName
  );

  if (prev.rowCount > 0) {
    const oldPath = prev.rows[0].file_path;
    if (oldPath && oldPath !== filePath) {
      fs.unlink(oldPath).catch(() => {}); // on ignore si déjà supprimé
    }
  }

  // Supprimer le message d’origine pour la surprise
  await message.delete().catch(() => {});
  // Confirmer en MP
  message.channel.send("✅ Ton screen a bien été enregistré !").catch(() => {});
}

async function handleSendUs(message, pool) {
  // Optionnel: permission
  if (!message.member.roles.cache.has("1271882131848822836")) {
    await message.reply(
      "⚠️ Tu n’as pas la permission d’utiliser cette commande."
    );
    return;
  }

  const { rows } = await getSubmissions();

  if (rows.length === 0) {
    await message.reply("⚠️ Aucune image enregistrée.");
    return;
  }

  rows.forEach(async (row, index) => {
    try {
      await fs.access(row.file_path);

      await message.channel.send({
        content: `👗 Skin #${row.id}`,
        files: [{ attachment: row.file_path, name: row.file_name }],
      });
    } catch (e) {
      console.error("Envoi échoué pour", row.user_id, e);
      await message.channel.send(
        `⚠️ Impossible d’envoyer le screen #${row.id} de <@${row.username}> (fichier manquant).`
      );
    }
  });
}

export {
  getBalance,
  addBalance,
  removeBalance,
  getRanking,
  updateSubmissions,
  getSubmissions,
  getSubmissionsById,
};

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
 * - cadeaux
 * - classement
 * - magik-rusher
 * - liste des commandes
 * - classement général
 * - send
 * - sendus
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Vérifier le solde
  if (command === "!solde") {
    const mention = message.mentions.users.first();
    const target = mention || message.author;
    const member = message.guild.members.cache.get(target.id);
    const balance = await getBalance(target.id);

    const embed = new EmbedBuilder()
      .setTitle(
        target.id === message.author.id
          ? "Mon solde"
          : `Le solde de ${member.displayName}`
      )
      .setDescription(
        target.id === message.author.id
          ? `Tu as **${balance}** ${CURRENCY}.`
          : `<@${target.id}> a **${balance}** ${CURRENCY}.`
      )
      .setColor("#165416");

    message.channel.send({ embeds: [embed] });
  }

  // Ajouter de l'argent (admin only)
  if (command === "!addcoin") {
    if (!message.member.roles.cache.has("1271882131848822836")) {
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
        `**${amount}** ${CURRENCY} ajoutés à ${`<@${member.id}>`}. \n\nSolde : **${balance}** ${CURRENCY}.`
      ) // contenu
      .setColor("#5CA25F");

    message.channel.send({ embeds: [embed] });
  }

  // Retirer de l'argent (admin only)
  if (command === "!removecoin") {
    if (!message.member.roles.cache.has("1271882131848822836")) {
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
        `**${amount}** ${CURRENCY} retirés à ${`<@${member.id}>`}. \n\nSolde : **${balance}** ${CURRENCY}.`
      ) // contenu
      .setColor("#9e0e40");

    message.channel.send({ embeds: [embed] });
  }

  // give gift (admin only)
  if (command === "!kdo") {
    if (!message.member.roles.cache.has("1271882131848822836")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!kdo @user 1`");
    }

    await removeBalance(mention.id, amount * 50);
    const balance = await getBalance(mention.id);
    const member = message.guild.members.cache.get(mention.id);

    const embed = new EmbedBuilder()
      .setTitle(`🎁 Cadeaux ! 🎁`)
      .setDescription(
        `**${
          amount * 50
        }** ${CURRENCY} retirés à ${`<@${member.id}>`} pour récupéré ${amount} cadeaux ! 🎁. \n\nSolde : **${balance}** ${CURRENCY}.`
      ) // contenu
      .setColor("#9e0e40");

    message.channel.send({ embeds: [embed] });
  }

  // classement
  if (command === "!classement") {
    const ranking = await getRanking(); // rows: [{ userId, balance }, ...] déjà triés DESC
    const nonZero = ranking.filter((r) => r.balance !== 0);

    if (nonZero.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    const top10 = nonZero.slice(0, 10);

    // Position et solde de l'auteur
    const myBalance = await getBalance(message.author.id);
    const myIndex = nonZero.findIndex((r) => r.userid === message.author.id);

    let msg = "";
    if (myBalance > 0 && myIndex !== -1) {
      msg += `**Ta place :** ${
        myIndex + 1
      }ᵉ avec **${myBalance}** ${CURRENCY}.\n\n`;
    } else {
      msg += `**Ta place :** Vous n'avez pas encore de ${CURRENCY}.\n\n`;
    }

    msg += `**Top 10 :**\n`;
    top10.forEach((row, index) => {
      const member = message.guild.members.cache.get(String(row.userid));
      msg += `**${index + 1}.** ${`<@${row.userid}>`} — **${
        row.balance
      }** ${CURRENCY}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Classement 🏆")
      .setDescription(msg)
      .setColor("#FFD700");

    message.channel.send({ embeds: [embed] });
  }

  // classement general
  if (command === "!classementgeneral") {
    const ranking = await getRanking(); // [{ userid, balance }, ...] triés DESC
    const nonZero = ranking.filter((r) => r.balance !== 0);

    if (nonZero.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    // utilitaire
    function chunkArray(arr, size) {
      const out = [];
      for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
      return out;
    }

    const chunks = chunkArray(nonZero, 30);

    for (let c = 0; c < chunks.length; c++) {
      const page = chunks[c];
      let msg = "";

      // 1) tentative de fetch groupé des membres de la page (si on est en guild)
      let membersById = new Map();
      if (message.guild) {
        try {
          const ids = page.map((r) => r.userid);
          const fetched = await message.guild.members.fetch({ user: ids }); // Collection
          fetched.forEach((m, id) => membersById.set(id, m));
        } catch (_) {
          /* si ça échoue, on tombera sur le fallback par user */
        }
      }

      // 2) construit le message avec fallback robuste
      for (let i = 0; i < page.length; i++) {
        const row = page[i];
        const rank = c * 30 + i + 1;

        let name;
        const m = membersById.get(row.userid);
        if (m) {
          name =
            m.displayName ??
            m.user?.globalName ??
            m.user?.username ??
            `Utilisateur ${row.userid}`;
        } else {
          name = await resolveDisplayName(
            message.client,
            message.guild,
            row.userid
          );
        }

        msg += `**${rank}.** **${name}** — **${row.balance}** ${CURRENCY}\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle(
          "🏆 Classement 🏆" + (chunks.length > 1 ? ` (page ${c + 1})` : "")
        )
        .setDescription(msg)
        .setColor("#FFD700");

      await message.channel.send({ embeds: [embed] });
    }
  }

  // règle du magik-rusher
  if (command === "!magik-rusher") {
    const embed = new EmbedBuilder()
      .setTitle("🍀 Magik-Rusher 🍀")
      .setDescription(
        `Chaque semaine un nouveau donjon est à réaliser, du Lundi 00h00 au Dimanche 23h59 (UTC+1). Aucune limite de personnes par donjon.\n\n🔸Attribution des ${CURRENCY} : \n🔹 10 ${CURRENCY} pour la 1ère réalisation du donjon.\n🔹 +1 ${CURRENCY} par personnage unique dans le combat n’ayant jamais fait le donjon.\n🔹 Réaliser le donjon seul ou uniquement avec ses mules = 5 ${CURRENCY}.\n🔹 À partir de deux participants uniques (ou plus) = 10 ${CURRENCY} et les règles de base s’appliquent.\n🔹 Screens de victoire + pseudo obligatoires pour valider, à poster dans le channel associé https://discord.com/channels/297322268961538048/1360338547827282262.\n\n🔸Classement \n🔹Un classement est établi, vous pouvez le consulter en effectuant les commandes dans le salon https://discord.com/channels/297322268961538048/1360338547827282262: \n🔹!solde pour afficher votre nombre de ${CURRENCY} ou celui d'une personne en utilisant son @.\n🔹!classement pour afficher le top 10 du serveur, et votre position.\n🔹!classementgeneral pour afficher le classement du serveur.\n\n🔸 Gains\n🔹Un total de 260 cosmétiques ont étés emballés dans des cadeaux, vous pourrez obtenir un cadeau aléatoire pour 50 ${CURRENCY} par cadeau.\n🔹L'estimation des cosmétiques vont de 440 kamas jusqu'à 8M unité.`
      )
      .setColor("#165416");

    message.channel.send({ embeds: [embed] });
  }

  // règle du fashion-riktus
  if (command === "!fashion-riktus") {
    const embed = new EmbedBuilder()
      .setTitle("🌸 Fashion-Riktus 🌸")
      .setDescription(
        `Toutes les deux semaines, nous allons alterner entre une semaine pour envoyer vos créations, et une semaine de vote. Un thème sera donné et à respecter.\n\n🔸 Attribution des points :\n🔹 30 ${CURRENCY} pour le 1er.\n🔹 20 ${CURRENCY} pour le 2ème.\n🔹 10 ${CURRENCY} le 3ème.\n\n🔸 Fonctionnement\n🔹 Durant la 1ere semaine, avec la commande **!send**, en y ajoutant une image, dans le salon https://discord.com/channels/297322268961538048/1412175010935607347 Votre skin sera envoyé, et instantanément supprimé, pour garder la surprise et l'anonymat pour les votes.\n🔹 Le lundi suivant, pour la 2ème semaine, tous les skins seront affichés par le bot de guilde, il ne vous restera plus qu'à voter ! Pour cela, réagissez aux images qui vous plaisent avec un :thumbsup: . Vous pouvez voter pour plusieurs skins.\n🔹 Les skins sont à réaliser en jeu ou via des outils en ligne.\n🔹 Si vous envoyez deux fois un skin, le 2ème écrasera le 1er.\n🔹 Pour le respect de l'évènement on vous demandera de ne pas copier des skins déjà faits, si une triche a lieu, nous procéderons à des sanctions sur les participations.`
      )
      .setColor("#b419a7");

    message.channel.send({ embeds: [embed] });
  }

  // liste des commandes
  if (command === "!commandes") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Les commandes 🤖")
      .setDescription(
        `🔹**!magik-rusher**: explique les différentes règles de l'évenement hebdomadaire Magik-Rusher.\n🔹**!fashion-riktus**: explique les différentes règles de l'évenement hebdomadaire Fashion-Riktus.\n🔹**!solde**: donne votre nombre de ${CURRENCY} ou celui d'une personne en ajoutant son @.\n🔹**!classement**: affiche le top 10 des ${CURRENCY} et votre placement.\n🔹**!classementgeneral**: affiche le classement complet des ${CURRENCY}.\n🔹**!send**: Permet d'envoyer une image lors des evenements.\n\n🔸Commandes admin :\n🔹**!addcoin @user value**: ajout de ${CURRENCY}.\n🔹**!removecoin @user value**: retrait de ${CURRENCY}.\n🔹**!kdo @user value**: don de cadeaux en échange de ${CURRENCY}.\n🔹**!resultat**: Affiche les messages des participants aux events mysteres.`
      )
      .setColor("#165416");

    message.channel.send({ embeds: [embed] });
  }

  // --- Commande !send ---
  if (command === "!send") {
    await handleSend(message, pool);
  }

  // --- Commande !resultat ---
  if (command === "!resultat") {
    await handleSendUs(message, pool);
  }
});

/*
 * FONCTIONS AUTOMATIQUES
 * - rules
 * - suppression des balances quand quitte le serveur
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

// Quand un membre quitte le serveur, on supprime ses balances
client.on("guildMemberRemove", async (member) => {
  try {
    await pool.query("DELETE FROM balances WHERE userid = $1", [member.id]);
    console.log(`✅ Ligne supprimée pour ${member.id}`);
  } catch (err) {
    console.error("Erreur suppression :", err);
  }
});

client.login(process.env.TOKEN); // token bot discord
