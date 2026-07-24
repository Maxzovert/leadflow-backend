const express = require('express');
const leadController = require('../controllers/leadController');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  validate,
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  assignLeadSchema,
  addNoteSchema,
} = require('../validators/schemas');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Public lead capture
router.post('/', validate(createLeadSchema), leadController.createLead);

router.use(requireAuth);

router.get('/', leadController.listLeads);
router.get('/:id', leadController.getLead);
router.patch('/:id', requireRole(USER_ROLES.ADMIN), validate(updateLeadSchema), leadController.updateLead);
router.delete('/:id', requireRole(USER_ROLES.ADMIN), leadController.deleteLead);
router.patch('/:id/status', validate(updateStatusSchema), leadController.updateStatus);
router.patch(
  '/:id/assign',
  requireRole(USER_ROLES.ADMIN),
  validate(assignLeadSchema),
  leadController.assignLead
);
router.post('/:id/notes', validate(addNoteSchema), leadController.addNote);
router.get('/:id/activity', leadController.getActivity);

module.exports = router;
