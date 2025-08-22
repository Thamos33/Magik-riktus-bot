/*
 * COMMANDES ECRITES
 * - solde
 * - ajout d'argent
 * - retrait d'argent
 * - classement
 */
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Vérifier le solde
  if (command === "!solde") {
    const userId = message.author.id;
    const balance = balances[userId] || 0;
    const embed = new EmbedBuilder()
      .setTitle(`Mon solde`)
      .setDescription(`Tu as **${balance}** ${CURRENCY}`) // contenu
      .setColor("#165416");

    message.channel.send({ embeds: [embed] });
  }

  // Ajouter de l'argent (admin only)
  if (command === "!addcoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!addcoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) + amount;
    saveBalances();
    const member = message.guild.members.cache.get(mention.id);
    const embed = new EmbedBuilder()
      .setTitle(`Gain ${CURRENCY}`)
      .setDescription(
        `**${amount}** ${CURRENCY} ajoutés à **${
          member.displayName
        }**. \n\nSolde : **${balances[mention.id]}** ${CURRENCY}`
      ) // contenu
      .setColor("#5CA25F");

    message.channel.send({ embeds: [embed] });
  }

  // Retirer de l'argent (admin only)
  if (command === "!removecoin") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 Tu n'as pas la permission.");
    }

    const mention = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!mention || isNaN(amount)) {
      return message.reply("Usage : `!removecoin @user 50`");
    }

    balances[mention.id] = (balances[mention.id] || 0) - amount;
    saveBalances();
    const member = message.guild.members.cache.get(mention.id);

    const embed = new EmbedBuilder()
      .setTitle(`Perte ${CURRENCY}`)
      .setDescription(
        `**${amount}** ${CURRENCY} retirés à **${
          member.displayName
        }**. \n\nSolde : **${balances[mention.id]}** ${CURRENCY}`
      ) // contenu
      .setColor("#9e0e40");

    message.channel.send({ embeds: [embed] });
  }

  // Classement
  if (command === "!classement") {
    let ranking = Object.entries(balances).sort((a, b) => b[1] - a[1]);
    rankingTopTen = ranking.slice(0, 10);

    // On récupère l'index du joueur qui a demandé le classement
    const myIndex = ranking.findIndex(
      ([userId]) => userId === message.author.id
    );
    const myBalance = balances[message.author.id] || 0;

    if (ranking.length === 0) {
      return message.reply("Personne n’a encore de monnaie !");
    }

    let msg = "";
    if (myBalance !== 0) {
      msg += `**Ta place :** ${
        myIndex + 1
      }ᵉ avec **${myBalance}** ${CURRENCY}\n\n`;
    } else {
      msg += `**Ta place :** Vous n'avez pas encore de ${CURRENCY}\n\n`;
    }
    msg += `**Top 10 :**\n`;
    rankingTopTen.forEach(([userId, balance], index) => {
      const member = message.guild.members.cache.get(userId);
      if (balance !== 0) {
        msg += `**${index + 1}.** ${
          member ? member.displayName : "Utilisateur inconnu"
        } — **${balance}** ${CURRENCY}\n`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Classement 🏆")
      .setDescription(msg) // contenu
      .setColor("#FFD700");

    message.channel.send({ embeds: [embed] });
  }
});
