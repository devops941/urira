import { Request, Response, NextFunction } from 'express';
import { DietSuggestionService } from './diet-suggestion.service.js';

export class DietSuggestionController {
  private service: DietSuggestionService;

  constructor() {
    this.service = new DietSuggestionService();
  }

  getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const suggestions = await this.service.generateSuggestions(userId);

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  };
}
