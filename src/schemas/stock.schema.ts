import { z } from 'zod';

export const stockOutSchema = z.object({
    body: z.object({
        productId: z.number().int().positive('Product ID must be a positive integer.'),
        quantityOut: z.number().int().positive('Quantity must be a positive integer.'),
        reason: z.string().min(1).optional(),
    }),
});