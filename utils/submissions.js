export async function updateSubmissions(
  userId,
  username,
  fileUrl, // URL Cloudinary
  publicId, // identifiant Cloudinary
  pool,
) {
  await pool.query(
    `INSERT INTO submissions (user_id, username, file_path, public_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET
       username = EXCLUDED.username,
       file_path = EXCLUDED.file_path,
       public_id = EXCLUDED.public_id`,
    [userId, username, fileUrl, publicId],
  );
}

export async function getSubmissions(pool) {
  const res = await pool.query(
    'SELECT id, user_id, username, file_path, public_id FROM submissions ORDER BY id ASC',
  );
  return res.rows;
}

export async function getSubmissionByUser(userId, pool) {
  const res = await pool.query(
    'SELECT file_path, public_id FROM submissions WHERE user_id = $1',
    [userId],
  );
  return res.rows[0];
}
