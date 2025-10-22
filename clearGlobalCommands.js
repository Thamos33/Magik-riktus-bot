// clearGlobalCommands.js
import { REST, Routes } from "discord.js";

if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error("❌ TOKEN ou CLIENT_ID manquant !");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function clearGlobal() {
  try {
    console.log("🧹 Suppression des commandes globales...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });
    console.log("✅ Commandes globales supprimées !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  }
}

clearGlobal();
