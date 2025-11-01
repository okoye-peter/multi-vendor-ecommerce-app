import express from 'express';
import { getCountries, getCountryStates, getStateLgas } from '../controllers/state.controller.ts';


const router = express.Router();

router.get('/countries', getCountries);
router.get('/:countryId/states', getCountryStates);
router.get('/:stateId/lgas', getCountryStates);

export default router;
