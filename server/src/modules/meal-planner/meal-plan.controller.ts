import { Request, Response, NextFunction } from 'express';
import { MealPlanService } from './meal-plan.service.js';
import { z } from 'zod';
import { MealPlanDuration } from './meal-plan.model.js';
import { MealType } from '../food-logs/food-log.model.js';

const GenerateMealPlanSchema = z.object({
  duration: z.nativeEnum(MealPlanDuration).default(MealPlanDuration.DAILY),
  title: z.string().optional(),
});

const SwapFoodSchema = z.object({
  dayIndex: z.number().int().min(1).default(1),
  mealType: z.nativeEnum(MealType),
  oldFoodId: z.string().min(1),
  newFoodId: z.string().min(1),
});

const LogMealSchema = z.object({
  dayIndex: z.number().int().min(1).default(1),
  mealType: z.nativeEnum(MealType),
});

export class MealPlanController {
  private service: MealPlanService;

  constructor() {
    this.service = new MealPlanService();
  }

  generateMealPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required. Please sign in.',
        });
        return;
      }
      const validated = GenerateMealPlanSchema.parse(req.body);
      const plan = await this.service.generateMealPlan(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Meal plan generated successfully',
        data: plan,
      });
    } catch (error: any) {
      console.error('MealPlan generation controller error:', error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate meal plan',
      });
    }
  };

  getUserMealPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const plans = await this.service.getUserMealPlans(userId);

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  };

  getMealPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const plan = await this.service.getMealPlanById(id, userId);

      if (!plan) {
        res.status(404).json({
          success: false,
          message: 'Meal plan not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  };

  approveMealPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const plan = await this.service.approveMealPlan(id, userId);

      res.status(200).json({
        success: true,
        message: 'Meal plan approved and saved',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  };

  swapFood = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = SwapFoodSchema.parse(req.body);
      const updated = await this.service.swapFood(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Food item swapped successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  logMeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = LogMealSchema.parse(req.body);
      const result = await this.service.logMealToFoodLog(
        id,
        userId,
        validated.dayIndex,
        validated.mealType
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  calculateSubstitutionDelta = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = SwapFoodSchema.parse(req.body);
      const delta = await this.service.calculateSubstitutionDelta(id, userId, validated);

      res.status(200).json({
        success: true,
        data: delta,
      });
    } catch (error) {
      next(error);
    }
  };

  rateMeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const { dayIndex, mealType, rating, comment } = req.body;
      const plan = await this.service.rateMeal(id, userId, {
        dayIndex: Number(dayIndex) || 1,
        mealType,
        rating,
        comment,
      });

      res.status(200).json({
        success: true,
        message: 'Meal feedback recorded successfully',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  };

  saveAsTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const { templateName } = req.body;
      const template = await this.service.saveAsTemplate(
        id,
        userId,
        templateName || 'Saved Template'
      );

      res.status(201).json({
        success: true,
        message: 'Meal plan saved as reusable template',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const templates = await this.service.getTemplates(userId);

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  };

  applyTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const plan = await this.service.applyTemplate(id, userId);

      res.status(201).json({
        success: true,
        message: 'Template applied as active meal plan',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMealPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const deleted = await this.service.deleteMealPlan(id, userId);

      res.status(200).json({
        success: true,
        message: deleted ? 'Meal plan deleted' : 'Meal plan not found',
      });
    } catch (error) {
      next(error);
    }
  };
}
