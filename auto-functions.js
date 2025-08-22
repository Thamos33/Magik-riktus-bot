/*
 * FONCTIONS AUTOMATIQUES
 * - rules
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
