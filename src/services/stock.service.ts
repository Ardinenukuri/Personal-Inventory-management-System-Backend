import pool from '../config/db';

export const StockService = {
    
    stockOut: async (productId: number, userId: number, quantityOut: number, reason?: string) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); 

            const productRes = await client.query(
                'SELECT quantity FROM products WHERE id = $1 FOR UPDATE', 
                [productId]
            );
            
            if (productRes.rows.length === 0) {
                throw new Error('Product not found');
            }
            
            const currentQuantity = productRes.rows[0].quantity;
            if (currentQuantity < quantityOut) {
                throw new Error('Insufficient stock');
            }
            

            const newQuantity = currentQuantity - quantityOut;
            const updatedProductRes = await client.query(
                'UPDATE products SET quantity = $1 WHERE id = $2 RETURNING *', 
                [newQuantity, productId]
            );
            

            await client.query(
                'INSERT INTO stock_out_history (product_id, user_id, quantity_out, reason) VALUES ($1, $2, $3, $4)', 
                [productId, userId, quantityOut, reason]
            );
            
            await client.query('COMMIT'); 


            return updatedProductRes.rows[0];

        } catch (error) {

            await client.query('ROLLBACK'); 
            throw error; 
        } finally {
            client.release();
        }
    }

};