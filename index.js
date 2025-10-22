import fs from "fs";
import path from "path";
import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import pkg from "pg";
import { REST, Routes } from "discord.js";

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
// Charger les commandes
// ---------------------------
client.commands = new Collection();
const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const commandsData = client.commands.map((cmd) => cmd.data.toJSON());

// Enregistrement automatique global (ou pour un serveur spécifique)
try {
  console.log("🔄 Enregistrement des commandes slash...");
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID), // ou applicationGuildCommands pour test
    { body: commandsData }
  );
  console.log("✅ Commandes enregistrées avec succès !");
} catch (err) {
  console.error("❌ Erreur lors de l'enregistrement :", err);
}

// ---------------------------
// Événement ready
// ---------------------------
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ---------------------------
// Interaction handler
// ---------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, pool);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Une erreur est survenue.",
      ephemeral: true,
    });
  }
});

// ---------------------------
// Connexion
// ---------------------------
client.login(process.env.TOKEN);
