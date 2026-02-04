export async function scheduleMessage(
  channelId,
  content,
  date,
  fileUrl,
  publicId,
  roleId,
  pool,
) {
  const today = new Date().toISOString().split('T')[0];
  const sendDate = date < today ? today : date;

  await pool.query(
    `INSERT INTO scheduled_messages (channel_id, content, send_at, file_path, public_id, role_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [channelId, content, sendDate, fileUrl, publicId, roleId],
  );
}
