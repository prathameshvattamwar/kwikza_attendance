const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.use(authorize('super_admin', 'org_admin', 'hr_manager'));

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

module.exports = router;
