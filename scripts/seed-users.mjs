// Creates demo users (bcrypt-hashed). Usage: npm run seed
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const pw = process.env.SEED_PASSWORD;
if (!pw || pw.length < 8) {
  console.error('Set SEED_PASSWORD (min 8 characters) in .env.local first.');
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

const users = [
  ['admin', 'admin@ecofoodsync.local', 'ADMIN'],
  ['donor1', 'donor1@ecofoodsync.local', 'DONOR'],
  ['charity1', 'charity1@ecofoodsync.local', 'CHARITY'],
  ['volunteer1', 'volunteer1@ecofoodsync.local', 'VOLUNTEER'],
];

const hash = await bcrypt.hash(pw, 12);
for (const [username, email, role] of users) {
  await conn.query(
    `INSERT INTO app_user (user_id, username, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
    [randomUUID(), username, email, hash, role]
  );
  console.log(`seeded ${username} (${role})`);
}
await conn.end();
console.log('Done. All demo users share the SEED_PASSWORD you set.');
