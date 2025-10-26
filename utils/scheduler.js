import cron from "node-cron";

export function startScheduler(client, pool) {
  cron.schedule(
    "1 0 * * *",
    async () => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const { rows } = await pool.query(
        `SELECT * FROM scheduled_messages WHERE sent = FALSE AND send_at <= $1`,
        [today]
      );

      for (const msg of rows) {
        try {
          const channel = await client.channels.fetch(msg.channel_id);
          if (msg.file_path) {
            await channel.send({
              content: msg.content,
              files: [msg.file_path],
            });
          } else {
            await channel.send(msg.content);
          }

          const publicIds = msg.public_id;

          const deleteResult = await cloudinary.api.delete_resources(publicIds);

          console.log(
            "🧹 Suppression Cloudinary terminée :",
            deleteResult.deleted
          );
          await pool.query(`DELETE FROM scheduled_messages WHERE id = $1`, [
            msg.id,
          ]);
        } catch (err) {
          console.error("Erreur en envoyant le message :", err);
        }
      }
    },
    {
      timezone: "Europe/Paris",
    }
  );
}
