import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

export const InventoryController = {
  stockIn: async (req: Request, res: Response) => {
    try {
      const { productId, quantity, supplier, purchasePrice, notes } = req.body;
      const userId = req.user!.id; 

      const updatedProduct = await InventoryService.stockIn({
        productId, quantity, supplier, purchasePrice, notes, userId
      });
      res.status(200).json(updatedProduct);
    } catch (error: any) {
      res.status(500).json({ message: 'Error processing stock-in', error: error.message });
    }
  },

  stockOut: async (req: Request, res: Response) => {
  try {
    const { productId, quantity, reason } = req.body;
    const userId = req.user!.id;

    const updatedProduct = await InventoryService.stockOut({
      productId, quantity, reason, userId
    });
    res.status(200).json(updatedProduct);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error processing stock-out' });
  }
},
};