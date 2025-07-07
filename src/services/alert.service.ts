import pool from '../config/db';

export const AlertService = {
  
  generateStockAlerts: async () => {
    await pool.query(`
      INSERT INTO alerts (type, title, message, severity, product_id)
      SELECT
        'low_stock',
        CASE WHEN p.quantity = 0 THEN 'Out of Stock' ELSE 'Low Stock Alert' END,
        p.name || ' is running low. Current stock: ' || p.quantity,
        CASE
          WHEN p.quantity = 0 THEN 'critical'
          WHEN p.quantity <= (p.low_stock_threshold * 0.5) THEN 'high'
          WHEN p.quantity <= p.low_stock_threshold THEN 'medium'
          ELSE 'low'
        END,
        p.id
      FROM products p
      WHERE 
        p.quantity <= p.low_stock_threshold
        -- THIS IS THE CRITICAL PART THAT PREVENTS DUPLICATES
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.product_id = p.id AND a.type = 'low_stock' AND a.is_read = FALSE
        )
    `);
  },

  getAllAlerts: async () => {
    const { rows } = await pool.query(`
      SELECT 
        a.id, a.type, a.title, a.message, a.severity, a.is_read, a.created_at,
        p.id as "productId", p.name as "productName", p.quantity as "currentStock", p.low_stock_threshold as "minStock"
      FROM alerts a
      LEFT JOIN products p ON a.product_id = p.id
      ORDER BY a.is_read ASC, a.created_at DESC;
    `);
    return rows;
  },

  markAsRead: (alertId: number) => pool.query('UPDATE alerts SET is_read = TRUE WHERE id = $1', [alertId]),
  markAllAsRead: () => pool.query('UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE'),
  delete: (alertId: number) => pool.query('DELETE FROM alerts WHERE id = $1', [alertId]),
};