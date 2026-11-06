import { Router } from 'express';
import { FoodController } from './food.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new FoodController();

// Public/Authenticated Food Catalog Endpoints
router.get('/categories', controller.getCategories);
router.get('/search', controller.searchFoods);
router.get('/favorites', requireAuth, controller.getFavorites);
router.get('/', controller.getFoods);
router.get('/:id', controller.getFoodById);

// Favorites toggle
router.post('/:id/favorite', requireAuth, controller.toggleFavorite);
router.delete('/:id/favorite', requireAuth, controller.toggleFavorite);

export const foodRoutes = router;
