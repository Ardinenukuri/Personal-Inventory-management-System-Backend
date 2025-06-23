import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // When everything is good, we call next() and can return.
            return next();
        } catch (error) {
            // When there's an error, we send a response but DO NOT return it.
            res.status(400).json(error);
        }
    };