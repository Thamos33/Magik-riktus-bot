export async function scheduleMessage(channelId, content, date, pool) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const sendDate = date <= today ? today : date;

  await pool.query(
    `INSERT INTO scheduled_messages (channel_id, content, send_at)
     VALUES ($1, $2, $3)`,
    [channelId, content, sendDate]
  );
}
