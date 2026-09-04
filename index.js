import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { startHealthCheckServer } from './utils/server.js';

startHealthCheckServer();

console.log('--- TEST DE CONNEXION ---');
console.log('TOKEN PRÉSENT ? :', Boolean(process.env.TOKEN));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`✅ TEST RÉUSSI : Connecté en tant que ${client.user.tag}`);
});

console.log('Tentative de connexion à Discord...');
client.login(process.env.TOKEN).catch((err) => {
  console.error('❌ ERREUR DE LOGIN DISCORD :', err.message);
});
