import express from 'express';
import { getCountries, getCountryStates, getStateLgas } from '../controllers/state.controller.js';


const router = express.Router();

router.get('/countries', getCountries);
router.get('/countries/:countryId/states', getCountryStates);
router.get('states/:stateId/lgas', getCountryStates);

export default router;
