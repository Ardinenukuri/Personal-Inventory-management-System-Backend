import { z } from 'zod';

export const stockInSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be a positive number'),
    supplier: z.string().min(1, 'Supplier name is required'),
    purchasePrice: z.number().positive('Purchase price must be a positive number'),
    notes: z.string().optional(),
  }),
});

export const stockOutSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be a positive number'),
    reason: z.string().min(1, 'A reason for the stock-out is required'),
  }),
});