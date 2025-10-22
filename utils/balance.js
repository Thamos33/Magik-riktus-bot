export async function getBalance(userId, pool) {
  const res = await pool.query(
    "SELECT balance FROM balances WHERE userId = $1",
    [userId]
  );
  return res.rows.length ? res.rows[0].balance : 0;
}

export async function addBalance(userId, amount, pool) {
  await pool.query(
    `INSERT INTO balances (userId, balance)
     VALUES ($1, $2)
     ON CONFLICT (userId) DO UPDATE SET balance = balances.balance + $2`,
    [userId, amount]
  );
}

export async function removeBalance(userId, amount, pool) {
  await pool.query(
    `INSERT INTO balances (userId, balance)
     VALUES ($1, $2)
     ON CONFLICT (userId) DO UPDATE SET balance = balances.balance - $2`,
    [userId, amount]
  );
}

export async function getRanking(pool) {
  const res = await pool.query(
    "SELECT userId, balance FROM balances ORDER BY balance DESC"
  );
  return res.rows;
}
