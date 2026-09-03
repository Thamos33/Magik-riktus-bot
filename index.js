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
    // Chargeur de commandes
    const commandsPath = path.join(process.cwd(), 'commands');
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of commandFiles) {
        const command = await import(`file://${path.join(commandsPath, file)}`);
        if (command?.data && command?.execute) {
          client.commands.set(command.data.name, {
            data: command.data,
            execute: command.execute,
          });
        }
      }
    }

    // Déploiement des commandes Slash
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

    // Chargeur d'événements automatique (events/ interactionCreate, messageCreate, guildMemberRemove)
    const eventsPath = path.join(process.cwd(), 'events');
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of eventFiles) {
        const eventModule = await import(
          `file://${path.join(eventsPath, file)}`
        );
        const event = eventModule.default || eventModule;

        if (event?.name && event?.execute) {
          client.on(event.name, (...args) =>
            event.execute(...args, client, pool),
          );
        }
      }
    }

    // Événement d'initialisation ready
    client.once('ready', () => {
      console.log(`✅ Connecté en tant que ${client.user.tag}`);
      startScheduler(client, pool);
    });

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('❌ Erreur critique au démarrage :', error);
    process.exit(1);
  }
}

bootstrap();
