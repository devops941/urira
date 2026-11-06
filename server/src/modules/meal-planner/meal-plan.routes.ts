import { Router } from 'express';
import { MealPlanController } from './meal-plan.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new MealPlanController();

router.use(requireAuth);

router.post('/generate', controller.generateMealPlan);
router.post('/generate-meal-plan', controller.generateMealPlan);
router.post('/create', controller.generateMealPlan);
router.get('/templates/list', controller.getTemplates);
router.get('/', controller.getUserMealPlans);
router.get('/:id', controller.getMealPlanById);
router.post('/:id/approve', controller.approveMealPlan);
router.post('/:id/swap-food', controller.swapFood);
router.post('/:id/substitute-delta', controller.calculateSubstitutionDelta);
router.post('/:id/feedback', controller.rateMeal);
router.post('/:id/save-template', controller.saveAsTemplate);
router.post('/:id/apply-template', controller.applyTemplate);
router.post('/:id/log-meal', controller.logMeal);
router.delete('/:id', controller.deleteMealPlan);

export const mealPlanRoutes = router;
