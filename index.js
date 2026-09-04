import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; // 👈 Import indispensable pour Render/Linux
import { pool } from './utils/database.js';
import { startScheduler } from './utils/scheduler.js';
import { startHealthCheckServer } from './utils/server.js';

// Démarrer le serveur HTTP de Keep-Alive / Health Check
startHealthCheckServer();

// Initialisation du client
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

client.commands = new Collection();
client.tempData = new Map();

async function bootstrap() {
  try {
    // 1. Chargeur de commandes
    const commandsPath = path.join(process.cwd(), 'commands');
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href); // 👈 Correct pour Linux

        if (command?.data && command?.execute) {
          client.commands.set(command.data.name, {
            data: command.data,
            execute: command.execute,
          });
        }
      }
    }

    // 2. Déploiement des commandes Slash
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const commandsData = client.commands.map((cmd) => cmd.data.toJSON());

    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID,
        ),
        { body: commandsData },
      );
      console.log('✅ Commandes Slash enregistrées avec succès !');
    }

    // 3. Chargeur d'événements automatique
    const eventsPath = path.join(process.cwd(), 'events');
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(pathToFileURL(filePath).href); // 👈 Correct pour Linux
        const event = eventModule.default || eventModule;

        if (event?.name && event?.execute) {
          client.on(event.name, (...args) =>
            event.execute(...args, client, pool),
          );
        }
      }
    }

    // 4. Événement d'initialisation ready
    client.once('ready', () => {
      console.log(`✅ Connecté en tant que ${client.user.tag}`);
      startScheduler(client, pool);
    });

    // 5. Connexion à Discord
    async function connectWithRetry(retries = 5, delay = 5000) {
      for (let i = 0; i < retries; i++) {
        try {
          await client.login(process.env.TOKEN);
          return;
        } catch (err) {
          console.error(
            `⚠️ Échec de connexion Gateway (${i + 1}/${retries}) : ${err.message}`,
          );
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }
    }

    await connectWithRetry();
  } catch (error) {
    console.error('❌ Erreur critique au démarrage :', error);
    process.exit(1);
  }
}

bootstrap();
