import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
} : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'web_kutubxona',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
};

const pool = new Pool(poolConfig);

const checkDb = async () => {
    try {
        console.log('🔍 Checking Database...');

        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('✅ Tables found:', res.rows.map(r => r.table_name).join(', '));

        const roles = await pool.query('SELECT * FROM roles');
        console.log('✅ Roles:', roles.rows.map(r => r.name).join(', '));

        const users = await pool.query('SELECT count(*) FROM users');
        console.log('✅ Total users:', users.rows[0].count);

    } catch (e) {
        console.error('❌ Database check failed:', e.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

checkDb();
