import { REST, Routes } from 'discord.js';
import 'dotenv/config';

// Vérification de la présence des identifiants requis
if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error(
    '❌ Variables d’environnement manquantes : TOKEN et CLIENT_ID sont obligatoires.',
  );
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/**
 * Supprime l'intégralité des commandes Slash globales enregistrées pour ce bot
 *
 * @returns {Promise<void>}
 */
async function clearGlobalCommands() {
  try {
    console.log('🧹 Suppression de toutes les commandes globales en cours...');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });

    console.log(
      '✅ Toutes les commandes globales ont été supprimées avec succès !',
    );
  } catch (error) {
    console.error(
      '❌ Erreur lors de la suppression des commandes globales :',
      error,
    );
  }
}

clearGlobalCommands();
