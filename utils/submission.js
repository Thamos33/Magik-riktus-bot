import fs from "fs/promises";
import path from "path";

export async function updateSubmissions(
  userId,
  username,
  filePath,
  fileName,
  pool
) {
  await pool.query(
    `INSERT INTO submissions (user_id, username, file_path, file_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET 
       username = EXCLUDED.username, 
       file_path = EXCLUDED.file_path, 
       file_name = EXCLUDED.file_name`,
    [userId, username, filePath, fileName]
  );
}

export async function getSubmissions(pool) {
  const res = await pool.query(
    "SELECT id, user_id, username, file_path, file_name FROM submissions ORDER BY id ASC"
  );
  return res.rows;
}

export async function getSubmissionByUser(userId, pool) {
  const res = await pool.query(
    "SELECT file_path FROM submissions WHERE user_id = $1",
    [userId]
  );
  return res.rows[0];
}
