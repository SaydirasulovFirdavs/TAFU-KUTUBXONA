import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Use the same connection logic as the app
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

const seedAdmin = async () => {
    try {
        console.log('🚀 Seeding super admin...');

        // 1. Get role ID
        const roleRes = await pool.query(`SELECT id FROM roles WHERE name = 'super_admin'`);
        if (roleRes.rows.length === 0) {
            console.error('❌ super_admin role not found!');
            process.exit(1);
        }
        const roleId = roleRes.rows[0].id;

        // 2. Hash password
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insert user
        const res = await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role_id, status, email_verified)
            VALUES ($1, $2, $3, $4, 'active', true)
            ON CONFLICT (email) DO UPDATE 
            SET role_id = $4, status = 'active', email_verified = true
            RETURNING id, email;
        `, ['admin@webkutubxona.uz', passwordHash, 'Super Admin', roleId]);

        console.log('✅ Super Admin seeding complete!');
        console.log('📧 Email:', res.rows[0].email);
        console.log('🔑 Password:', password);

    } catch (e) {
        console.error('❌ Seeding error:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

seedAdmin();
