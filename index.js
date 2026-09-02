import {
  Client,
  Collection,
  EmbedBuilder,
  GatewayIntentBits,
  MessageType,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import fs from 'fs';
import http from 'http'; // <--- Ajouté pour le serveur HTTP
import path from 'path';
import pkg from 'pg';
import { deleteBalance } from './utils/balance.js';
import { startScheduler } from './utils/scheduler.js';

// ---------------------------
// Serveur HTTP pour Render (Health Check)
// ---------------------------
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Discord OK');
  })
  .listen(PORT, () => {
    console.log(`🌐 Serveur Web en écoute sur le port ${PORT}`);
  });

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

// ---------------------------
// Connexion à la base
// ---------------------------
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false },
});

// ---------------------------
// Variables
// ---------------------------
// Channels où les messages sont filtrés
const AUTO_CLEAN_CHANNELS_IMG = [
  '1350937297142419558', // salon "screens"
  '1360338547827282262', // salon "Magik-Rusher"
];

const COMMAND_PREFIX = '/';

// ---------------------------
// Charger les commandes
// ---------------------------
client.commands = new Collection();
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, {
    data: command.data,
    execute: command.execute,
  });
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const commandsData = client.commands.map((cmd) => cmd.data.toJSON());
console.log(
  'Commandes détectées :',
  commandsData.map((c) => c.name),
);

try {
  console.log('🔄 Enregistrement des commandes slash...');
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID,
    ),
    { body: commandsData },
  );
  console.log('✅ Commandes enregistrées avec succès !');
} catch (err) {
  console.error("❌ Erreur lors de l'enregistrement :", err);
}

// ---------------------------
// Charger les événements
// ---------------------------
import interactionCreate from './events/interactionCreate.js';

client.on(interactionCreate.name, (...args) =>
  interactionCreate.execute(...args, client, pool),
);

// ---------------------------
// Événement ready
// ---------------------------
client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  startScheduler(client, pool); // Démarrage du cron pour les messages programmés
});

// ---------------------------
// Connexion
// ---------------------------
client.login(process.env.TOKEN);

// ---------------------------
// messageCreate handler
// ---------------------------

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!AUTO_CLEAN_CHANNELS_IMG.includes(message.channel.id)) return;

  try {
    if (message.type !== MessageType.Default) {
      await message.delete().catch(() => {});
      return;
    }

    if (
      message.channel.isThread() ||
      message.content.trim().startsWith(COMMAND_PREFIX)
    )
      return;

    const hasImage = message.attachments.some(
      (a) =>
        a.contentType?.startsWith('image/') ||
        /\.(png|jpe?g|gif|webp)$/i.test(a.name ?? ''),
    );

    if (!hasImage) {
      await message.delete().catch(() => {});
      await message.author
        .send(
          `👋 Salut ${message.author.username}, ton message dans **#${message.channel.name}** a été supprimé car il ne contenait pas d’image ou n'a pas été envoyé dans un fil.`,
        )
        .catch(() => {});
    }
  } catch (err) {
    console.error('❌ Erreur nettoyage:', err.message);
  }
});

// ---------------------------
// Guildeux qui part
// ---------------------------
client.on('guildMemberRemove', async (member) => {
  try {
    // --- Suppression balance ---
    await deleteBalance(member.id, pool);
    console.log(`🧹 Balance supprimée pour ${member.user?.tag || member.id}`);

    // --- Channel ---
    const channel = await member.guild.channels.fetch('1195801619070210058');
    if (!channel) return;

    const username = member.user.tag;
    const serverName = member.displayName; // pseudo serveur + fallback automatique
    const avatar = member.user.displayAvatarURL({ dynamic: true });

    const joinedTimestamp = member.joinedAt
      ? Math.floor(member.joinedAt.getTime() / 1000)
      : null;

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setColor('#ff4d4d')
      .setTitle('👋 Membre parti')
      .setThumbnail(avatar)
      .addFields(
        { name: 'Pseudo Discord', value: username, inline: true },
        { name: 'Pseudo serveur', value: serverName, inline: true },
        {
          name: 'Arrivé le',
          value: joinedTimestamp ? `<t:${joinedTimestamp}:F>` : 'Inconnu',
          inline: false,
        },
      )
      .setFooter({ text: `ID : ${member.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(
      `❌ Erreur suppression balance (${member.id}) :`,
      err.message,
    );
  }
});
