import cron from "node-cron";
import { v2 as cloudinary } from "cloudinary";

export function startScheduler(client, pool) {
  cron.schedule(
    "* * * * *",
    async () => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const { rows } = await pool.query(
        `SELECT * FROM scheduled_messages WHERE sent = FALSE AND send_at <= $1`,
        [today]
      );

      for (const msg of rows) {
        try {
          const channel = await client.channels.fetch(msg.channel_id);
          await channel.send({
            content: msg.role_id
              ? `<@&${msg.role_id}>\u200B\n${msg.content}`
              : msg.content,
            allowedMentions: { parse: ["users", "roles", "everyone"] },
            files: msg.file_path ? [msg.file_path] : [],
          });

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
