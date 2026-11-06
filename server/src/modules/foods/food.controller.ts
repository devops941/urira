import { Request, Response, NextFunction } from 'express';
import { FoodService } from './food.service.js';
import { SearchFoodsSchema } from './food.validation.js';

export class FoodController {
  private foodService: FoodService;

  constructor() {
    this.foodService = new FoodService();
  }

  getFoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = SearchFoodsSchema.parse(req.query);
      const result = await this.foodService.getFoods(validated);

      res.status(200).json({
        success: true,
        data: result.foods,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  searchFoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = SearchFoodsSchema.parse(req.query);
      const result = await this.foodService.getFoods(validated);

      res.status(200).json({
        success: true,
        data: result.foods,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.foodService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  getFoodById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const food = await this.foodService.getFoodById(id);

      if (!food) {
        res.status(404).json({
          success: false,
          message: 'Food item not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: food,
      });
    } catch (error) {
      next(error);
    }
  };

  getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const favorites = await this.foodService.getFavorites(userId);

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const result = await this.foodService.toggleFavorite(id, userId);

      res.status(200).json({
        success: true,
        message: result.isFavorited ? 'Added to favorites' : 'Removed from favorites',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
