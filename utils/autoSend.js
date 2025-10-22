export async function scheduleMessage(channelId, content, date, pool) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Si la date est aujourd'hui ou passée, le message sera envoyé immédiatement
  const sendDate = date <= today ? today : date;

  await pool.query(
    `INSERT INTO scheduled_messages (channel_id, content, send_at)
     VALUES ($1, $2, $3)`,
    [channelId, content, sendDate]
  );
}
