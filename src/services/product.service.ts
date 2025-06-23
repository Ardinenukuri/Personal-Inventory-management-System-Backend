import pool from '../config/db';
import { ProductCreationData } from '../types/product.types';

interface ProductData {
    name: string;
    price: number;
    quantity: number;
    categoryId: string;
    lowStockThreshold: number;
    imageUrl?: string;
}

interface PaginationOptions {
    page: number;
    limit: number;
}

export const ProductService = {

    create: async (data: ProductCreationData) => {
        const { name, price, quantity, category_id, low_stock_threshold, image_url } = data;
        const { rows } = await pool.query(
            `INSERT INTO products (name, price, quantity, category_id, low_stock_threshold, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [name, price, quantity, category_id, low_stock_threshold, image_url]
        );
        return rows[0];
    },

    findAll: async ({ page, limit }: PaginationOptions) => {
        const offset = (page - 1) * limit;

        const totalProductsQuery = pool.query('SELECT COUNT(*) FROM products');
        const productsQuery = pool.query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             ORDER BY p.created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const [totalResult, productsResult] = await Promise.all([totalProductsQuery, productsQuery]);
        
        const total = parseInt(totalResult.rows[0].count, 10);
        return {
            data: productsResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },
    

    findById: async (id: number) => {
        const { rows } = await pool.query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.id = $1`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    
    update: async (id: number, data: Partial<ProductCreationData>) => {
        const product = await ProductService.findById(id);
        if (!product) {
            return null; 
        }

        const updatedProduct = { ...product, ...data };

        const { rows } = await pool.query(
            `UPDATE products SET 
                name = $1, price = $2, quantity = $3, category_id = $4, 
                low_stock_threshold = $5, image_url = $6
             WHERE id = $7 RETURNING *`,
            [
                updatedProduct.name,
                updatedProduct.price,
                updatedProduct.quantity,
                updatedProduct.category_id,
                updatedProduct.low_stock_threshold,
                updatedProduct.image_url,
                id
            ]
        );
        return rows[0];
    },


    remove: async (id: number) => {
        const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
        
        return (rowCount ?? 0) > 0;
    },
};


export const StockService = {
    stockOut: async (productId: string, userId: string, quantityOut: number) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); 
            const productRes = await client.query('SELECT quantity FROM products WHERE id = $1 FOR UPDATE', [productId]);
            if (productRes.rows.length === 0) throw new Error('Product not found');
            
            const currentQuantity = productRes.rows[0].quantity;
            if (currentQuantity < quantityOut) throw new Error('Insufficient stock');
            

            const newQuantity = currentQuantity - quantityOut;
            await client.query('UPDATE products SET quantity = $1 WHERE id = $2', [newQuantity, productId]);
            

            await client.query('INSERT INTO stock_out_history (product_id, user_id, quantity_out) VALUES ($1, $2, $3)', [productId, userId, quantityOut]);
            
            await client.query('COMMIT'); 
            return { success: true, newQuantity };
        } catch (error) {
            await client.query('ROLLBACK'); 
            throw error; 
        } finally {
            client.release(); 
        }
    }
}