import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const poolConfig = {
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:SJWrTPtujbcagghRbJYkFXMRSykjurDm@centerbeam.proxy.rlwy.net:14292/railway",
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(poolConfig);

const restore = async () => {
    try {
        console.log('🚀 Starting Production Database Restoration...');

        console.log('🧹 Wiping existing schema...');
        await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        console.log('✅ Schema wiped!');

        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const testDataPath = path.join(__dirname, '..', 'database', 'test_data.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const testDataSql = fs.readFileSync(testDataPath, 'utf8');

        console.log('📝 Running Schema...');
        // Split by semicolon to run individually or use a single query if simple
        // For schema.sql, running it as a single block is usually fine if it doesn't have complex control flow
        await pool.query(schemaSql);
        console.log('✅ Schema restored!');

        console.log('📝 Running Test Data...');
        await pool.query(testDataSql);
        console.log('✅ Test Data restored!');

        console.log('🎉 Restoration COMPLETE!');

    } catch (e) {
        console.error('❌ Restoration FAILED:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

restore();
