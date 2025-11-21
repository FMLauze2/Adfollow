const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgre',
  database: 'adfollow',
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL (adfollow)'))
  .catch(err => console.error('Connection error:', err.stack));

module.exports = pool;
