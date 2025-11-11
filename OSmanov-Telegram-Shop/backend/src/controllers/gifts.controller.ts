import { Request, Response } from 'express';
import { giftsApiService } from '../services/giftsApi.service';

export class GiftsController {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const categories = await giftsApiService.getCategories(token);
      
      res.json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories'
      });
    }
  }

  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const services = await giftsApiService.getAllServices(token);
      
      res.json({
        status: 'success',
        data: services
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch services'
      });
    }
  }

  async getAuthToken(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      
      res.json({
        status: 'success',
        data: { token }
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get auth token'
      });
    }
  }

  async getServicesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category_id } = req.query;
      
      if (!category_id) {
        res.status(400).json({
          status: 'error',
          message: 'Category ID is required'
        });
        return;
      }

      const token = await giftsApiService.getAuthToken();
      const services = await giftsApiService.getServicesByCategory(
        token, 
        parseInt(category_id as string)
      );
      
      res.json({
        status: 'success',
        data: services
      });
    } catch (error) {
      console.error('Error fetching services by category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch services by category'
      });
    }
  }
}

export const giftsController = new GiftsController();