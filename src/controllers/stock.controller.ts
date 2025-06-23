import { Request, Response } from 'express';
import { StockService } from '../services/stock.service';
import { stockOutSchema } from '../schemas/stock.schema';

export const StockController = {
    stockOut: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized.' });
            return;
        }

        try {
            const parsedBody = stockOutSchema.shape.body.parse(req.body);
            const { productId, quantityOut, reason } = parsedBody;
            
            const updatedProduct = await StockService.stockOut(productId, userId, quantityOut, reason);
            
            res.status(200).json(updatedProduct);

        } catch (error: any) {
            if (error.message === 'Product not found') {
                res.status(404).json({ message: error.message });
                return;
            }
            if (error.message === 'Insufficient stock') {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error(error);
            res.status(500).json({ message: 'Server error during stock out operation.' });
        }
    }
};