import pool from '../config/db';
import sendEmail from '../utils/email'
import crypto from 'crypto';

interface PaginationOptions {
    page: number;
    limit: number;
}

export const AdminService = {

    getAllUsers: async ({ page, limit }: PaginationOptions) => {
        const offset = (page - 1) * limit;

    
        const totalUsersQuery = pool.query('SELECT COUNT(*) FROM users');
        
        const usersQuery = pool.query(
            `SELECT id, username, email, first_name, last_name, role, is_verified, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const [totalResult, usersResult] = await Promise.all([totalUsersQuery, usersQuery]);
        
        const total = parseInt(totalResult.rows[0].count, 10);
        return {
            data: usersResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },


    deleteUser: async (userId: number) => {
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        return (rowCount ?? 0) > 0;
    },


    getAllStockOuts: async ({ page, limit }: PaginationOptions) => {
        const offset = (page - 1) * limit;

        const totalQuery = pool.query('SELECT COUNT(*) FROM stock_out_history');
        const historyQuery = pool.query(
            `SELECT 
                soh.id, soh.quantity_out, soh.reason, soh.created_at,
                p.id as product_id, p.name as product_name,
                u.id as user_id, u.username as user_username
             FROM stock_out_history soh
             LEFT JOIN products p ON soh.product_id = p.id
             LEFT JOIN users u ON soh.user_id = u.id
             ORDER BY soh.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const [totalResult, historyResult] = await Promise.all([totalQuery, historyQuery]);

        const total = parseInt(totalResult.rows[0].count, 10);
        return {
            data: historyResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },


    getInventoryValue: async () => {
        const { rows } = await pool.query(
            `SELECT SUM(price * quantity) as total_value FROM products`
        );

        const totalValue = parseFloat(rows[0].total_value || 0);
        return { total_inventory_value: totalValue };
    },


    getDashboardStats: async () => {
        const totalUsersQuery = pool.query('SELECT COUNT(*) FROM users');
        const totalProductsQuery = pool.query('SELECT COUNT(*) FROM products');
        const totalCategoriesQuery = pool.query('SELECT COUNT(*) FROM categories');
        const inventoryValueQuery = pool.query('SELECT SUM(price * quantity) as total_value FROM products');
        const lowStockQuery = pool.query('SELECT COUNT(*) FROM products WHERE quantity <= low_stock_threshold');

        const [
            userResult,
            productResult,
            categoryResult,
            inventoryValueResult,
            lowStockResult,
        ] = await Promise.all([
            totalUsersQuery,
            totalProductsQuery,
            totalCategoriesQuery,
            inventoryValueQuery,
            lowStockQuery,
        ]);

        return {
            total_users: parseInt(userResult.rows[0].count, 10),
            total_products: parseInt(productResult.rows[0].count, 10),
            total_categories: parseInt(categoryResult.rows[0].count, 10),
            total_inventory_value: parseFloat(inventoryValueResult.rows[0].total_value || 0),
            low_stock_alerts: parseInt(lowStockResult.rows[0].count, 10),
        };
    },

    inviteUser: async (email: string, protocol: string, host: string) => {
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(invitationToken).digest('hex');

        const { rows } = await pool.query(
            'INSERT INTO users (email, verification_token) VALUES ($1, $2) RETURNING *',
            [email, hashedToken]
        );
        const newUser = rows[0];
        const frontendUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
        const completeRegistrationURL = `${frontendUrl}/complete-registration/${invitationToken}`;

        const message = `
            <h1>You've been invited!</h1>
            <p>You have been invited to join the Inventory Management Platform. Please click the link below to complete your registration and set your password:</p>
            <a href="${completeRegistrationURL}" style="background-color: #008CBA; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px;">Complete Your Registration</a>
            <p>This link is valid for a limited time.</p>
        `;

        await sendEmail({
            to: newUser.email,
            subject: 'Invitation to Join the Inventory Platform',
            text: `Complete your registration by visiting this URL: ${completeRegistrationURL}`,
            html: message,
        });

        return newUser;
    },

    updateUser: async (userId: number, updateData: { role?: string, status?: string }) => {
    const { role, status } = updateData;

    const { rows: existingUsers } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (existingUsers.length === 0) {
      return null; 
    }
    const currentUser = existingUsers[0];
    const finalRole = role || currentUser.role;
    const finalStatus = status || currentUser.status;

    const { rows } = await pool.query(
        'UPDATE users SET role = $1, status = $2 WHERE id = $3 RETURNING *',
        [finalRole, finalStatus, userId]
    );
    return rows[0];
  },

    

};