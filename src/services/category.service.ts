import pool from '../config/db';

export const CategoryService = {
    create: async (name: string) => {
        const { rows } = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
        return rows[0];
    },

    findAll: async () => {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
    return result.rows;
  },

  

};