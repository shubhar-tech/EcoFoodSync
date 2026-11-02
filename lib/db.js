import mysql from 'mysql2/promise';

// One pool per server process (survives Next.js hot reloads in dev).
// All credentials come from environment variables.
const g = globalThis;
export const pool =
  g._efsPool ??
  (g._efsPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true, // return DATETIME as plain strings, avoids timezone shifts
  }));

export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
