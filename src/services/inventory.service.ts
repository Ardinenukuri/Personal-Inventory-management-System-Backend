import pool  from '../config/db';

export const InventoryService = {
  stockIn: async (data: {
    productId: number;
    quantity: number;
    supplier: string;
    purchasePrice: number;
    notes?: string;
    userId: number; 
  }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); 

      await client.query(
        `INSERT INTO stock_in_history (product_id, quantity, supplier, purchase_price, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [data.productId, data.quantity, data.supplier, data.purchasePrice, data.notes, data.userId]
      );


      const updatedProduct = await client.query(
        `UPDATE products SET quantity = quantity + $1 WHERE id = $2 RETURNING *`,
        [data.quantity, data.productId]
      );

      if (updatedProduct.rows.length === 0) {
        throw new Error('Product not found for stock update.');
      }

      await client.query('COMMIT'); 
      return updatedProduct.rows[0];

    } catch (error) {
      await client.query('ROLLBACK'); 
      throw error;
    } finally {
      client.release(); 
    }
  },

  stockOut: async (data: {
    productId: number;
    quantity: number;
    reason: string;
    userId: number;
  }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); 

      
      const currentStockResult = await client.query(
        'SELECT quantity FROM products WHERE id = $1 FOR UPDATE', 
        [data.productId]
      );
      
      if (currentStockResult.rows.length === 0) {
        throw new Error('Product not found.');
      }
      
      const currentStock = currentStockResult.rows[0].quantity;
      if (currentStock < data.quantity) {
        throw new Error(`Insufficient stock. Only ${currentStock} units available.`);
      }

    
      await client.query(
        `INSERT INTO stock_out_history (product_id, quantity, reason, user_id)
         VALUES ($1, $2, $3, $4)`,
        [data.productId, data.quantity, data.reason, data.userId]
      );

      
      const updatedProduct = await client.query(
        `UPDATE products SET quantity = quantity - $1 WHERE id = $2 RETURNING *`,
        [data.quantity, data.productId]
      );

      await client.query('COMMIT'); 
      return updatedProduct.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

};