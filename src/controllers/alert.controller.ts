import { Request, Response } from 'express';
import { AlertService } from '../services/alert.service';

export const AlertController = {
  getAlerts: async (req: Request, res: Response) => {
    try {
      const alerts = await AlertService.getAllAlerts();
      res.status(200).json(alerts);
    } catch (e) { res.status(500).json({ message: 'Error fetching alerts' }); }
  },

  markRead: async (req: Request, res: Response) => {
    try {
      await AlertService.markAsRead(parseInt(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Error updating alert' }); }
  },
  markAllRead: async (req: Request, res: Response) => {
    try {
      await AlertService.markAllAsRead();
      res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Error updating alerts' }); }
  },
  deleteAlert: async (req: Request, res: Response) => {
    try {
      await AlertService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Error deleting alert' }); }
  },
};