const router = require('express').Router();
const LocationController = require('../controllers').LocationController;
const locationController = new LocationController();

/* Location Management */
router.get('/countries', locationController.getCountries);
router.get('/states/:country_id', locationController.getStatesByCountryId);
router.get('/cities/:state_id', locationController.getCitiesByStateId);


module.exports = router;
