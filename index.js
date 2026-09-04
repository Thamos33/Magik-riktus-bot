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
import { pathToFileURL } from 'url';
import { pool } from './utils/database.js';
import { startScheduler } from './utils/scheduler.js';
import { startHealthCheckServer } from './utils/server.js';

startHealthCheckServer();

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
    // 1. Événement Ready de base
    client.once('ready', () => {
      console.log(`✅ Connecté en tant que ${client.user.tag}`);
      startScheduler(client, pool);
    });

    // 2. Chargeur de commandes
    const commandsPath = path.join(process.cwd(), 'commands');
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href);
        if (command?.data && command?.execute) {
          client.commands.set(command.data.name, {
            data: command.data,
            execute: command.execute,
          });
        }
      }
      console.log(`📂 ${client.commands.size} commandes chargées.`);
    }

    // 3. Déploiement des commandes Slash auprès de Discord
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

    // 4. Chargeur d'événements automatique
    const eventsPath = path.join(process.cwd(), 'events');
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((f) => f.endsWith('.js'));
      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(pathToFileURL(filePath).href);
        const event = eventModule.default || eventModule;

        if (event?.name && event?.execute) {
          // Évite de doubler le listener 'ready' s'il existe déjà dans events/
          if (event.name === 'ready') continue;

          client.on(event.name, async (...args) => {
            try {
              await event.execute(...args, client, pool);
            } catch (err) {
              console.error(`❌ Erreur dans l'événement ${event.name} :`, err);
            }
          });
        }
      }
    }

    // 5. Connexion à Discord
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('❌ Erreur critique au démarrage :', error);
    process.exit(1);
  }
}

bootstrap();
