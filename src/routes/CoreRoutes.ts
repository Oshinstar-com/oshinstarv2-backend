

import { Router } from 'express';
import CoreController from '../controllers/CoreController';

const router = Router();



router.get('/industries', CoreController.getIndustries);


export default router;
