const express = require('express');
const router = express.Router();

const auditLogController = require('../controllers/auditLog.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.use(authorize('super_admin', 'org_admin', 'hr_manager'));

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
