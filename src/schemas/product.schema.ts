import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        price: z.number().positive('Price must be a positive number'),
        quantity: z.number().int().min(0, 'Quantity cannot be negative'),
        category_id: z.number().int().positive('Category ID is required'),
        low_stock_threshold: z.number().int().min(0).optional().default(10),
        image_url: z.string().url('Image must be a valid URL').optional(),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        quantity: z.number().int().min(0).optional(),
        category_id: z.number().int().positive().optional(),
        low_stock_threshold: z.number().int().min(0).optional(),
        image_url: z.string().url().optional(),
    }),
});