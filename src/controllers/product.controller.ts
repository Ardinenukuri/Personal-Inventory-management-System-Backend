import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

export const ProductController = {
    createProduct: async (req: Request, res: Response) => {
        try {
            const parsedBody = createProductSchema.shape.body.parse(req.body);

            const product = await ProductService.create(parsedBody);
            
            res.status(201).json(product);
        } catch (error: any) {
            if (error.code === '23503') {
                res.status(400).json({ message: 'Error: The specified category does not exist.' });
                return;
            }
            res.status(500).json({ message: 'Error creating product', error: error.message });
        }
    },

    getAllProducts: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const products = await ProductService.findAll({ page, limit });
            res.status(200).json(products);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching products', error: error.message });
        }
    },

    getProductById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            const product = await ProductService.findById(id);
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.status(200).json(product);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching product', error: error.message });
        }
    },
    
    updateProduct: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);

            const parsedBody = updateProductSchema.shape.body.parse(req.body);

            const product = await ProductService.update(id, parsedBody);
            
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.status(200).json(product);
        } catch (error: any) {
            res.status(500).json({ message: 'Error updating product', error: error.message });
        }
    },

    
    deleteProduct: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            const success = await ProductService.remove(id);
            if (!success) {
                // FIX: Removed 'return'
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting product', error: error.message });
        }
    },
};