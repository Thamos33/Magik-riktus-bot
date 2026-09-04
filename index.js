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

// Timeout de sécurité au bout de 10 secondes si la Gateway ne répond pas
const loginTimeout = setTimeout(() => {
  console.error(
    '❌ ERREUR : La connexion à Discord prend trop de temps (Blocage réseau IP/Gateway).',
  );
}, 10000);

client
  .login(process.env.TOKEN)
  .then(() => clearTimeout(loginTimeout))
  .catch((err) => {
    clearTimeout(loginTimeout);
    console.error('❌ ERREUR DE LOGIN DISCORD :', err.message);
  });
