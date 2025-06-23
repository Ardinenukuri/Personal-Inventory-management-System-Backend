import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';

export const CategoryController = {
    createCategory: async (req: Request, res: Response) => {
        try {
            const { name } = req.body;
            if (!name) {
                res.status(400).json({ message: 'Category name is required.' });
                return;
            }
            const category = await CategoryService.create(name);
            res.status(201).json(category);
        } catch (error: any) {
             if (error.code === '23505') { 
                res.status(409).json({ message: 'A category with this name already exists.' });
                return; 
            }
            res.status(500).json({ message: 'Error creating category' });
        }
    }
};