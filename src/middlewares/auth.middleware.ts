import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; role: 'user' | 'admin' };
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

            const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
            
            if (rows.length === 0) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return; 
            }

            req.user = rows[0];
            next();

        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};