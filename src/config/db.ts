import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- DATABASE CONNECTION DETAILS ---');
console.log('User:', process.env.DB_USER);
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_name);
console.log('Port:', process.env.DB_PORT);
console.log('---------------------------------');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', () => {
    console.log('Connected to the Database!');
});

export default pool;