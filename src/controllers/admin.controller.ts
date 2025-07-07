import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';

export const AdminController = {
    getAllUsers: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const users = await AdminService.getAllUsers({ page, limit });
            res.status(200).json(users);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching users', error: error.message });
        }
    },

    deleteUser: async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.id, 10);

            if (userId === req.user?.id) {
                res.status(400).json({ message: "You cannot delete your own account." });
                return;
            }

            const success = await AdminService.deleteUser(userId);
            if (!success) {
                res.status(404).json({ message: 'User not found.' });
                return; 
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting user', error: error.message });
        }
    },

    getAllStockOuts: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const history = await AdminService.getAllStockOuts({ page, limit });
            res.status(200).json(history);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching stock out history', error: error.message });
        }
    },

    getInventoryValue: async (req: Request, res: Response) => {
        try {
            const value = await AdminService.getInventoryValue();
            res.status(200).json(value);
        } catch (error: any) {
            res.status(500).json({ message: 'Error calculating inventory value', error: error.message });
        }
    },

    
    getDashboardStats: async (req: Request, res: Response) => {
        try {
            const stats = await AdminService.getDashboardStats();
            res.status(200).json(stats);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
        }
    },

    inviteUser: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: 'Email is required.' });
                return;
            }

            
            await AdminService.inviteUser(email, req.protocol, req.get('host')!);
            
            res.status(200).json({ message: `Invitation sent to ${email}.` });
        } catch (error: any) {
            if (error.code === '23505') {
                res.status(409).json({ message: 'A user with this email already exists.' });
                return;
            }
            res.status(500).json({ message: 'Error inviting user', error: error.message });
        }
    },

    updateUser: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const updateData = req.body; 

      const updatedUser = await AdminService.updateUser(userId, updateData);
      
      if (!updatedUser) {

        res.status(404).json({ message: 'User not found.' });
        return; 
      }
      res.status(200).json(updatedUser);

    } catch (error: any) {
      res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  },

};