import { Router } from 'express';
import { MedicationController } from './medication.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new MedicationController();

router.use(requireAuth);

router.post('/', controller.addMedication);
router.get('/', controller.getActiveMedications);
router.get('/today', controller.getTodaySchedule);
router.get('/adherence/summary', controller.getAdherenceSummary);
router.get('/range', controller.getRangeSummary);
router.get('/:id', controller.getMedicationById);
router.patch('/:id', controller.updateMedication);
router.delete('/:id', controller.deleteMedication);
router.post('/:id/doses/record', controller.recordDose);

export const medicationRoutes = router;

