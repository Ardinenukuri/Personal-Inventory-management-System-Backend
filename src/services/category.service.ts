import pool from '../config/db';

export const CategoryService = {
    create: async (name: string) => {
        const { rows } = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
        return rows[0];
    }
};