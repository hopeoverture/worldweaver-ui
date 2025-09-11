const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('OK', res.rows[0]);
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await pool.end();
  }
})();
