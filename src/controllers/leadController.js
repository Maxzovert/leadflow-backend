const leadService = require('../services/leadService');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const listLeads = asyncHandler(async (req, res) => {
  const { leads, meta } = await leadService.listLeads(req.query, req.user);
  return success(res, { data: { leads }, meta });
});

const createLead = asyncHandler(async (req, res) => {
  const actor = req.user || null;
  const lead = await leadService.createLead(req.body, actor);
  return success(res, {
    statusCode: 201,
    message: 'Lead submitted successfully',
    data: { lead },
  });
});

const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  return success(res, { data: { lead } });
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.body, req.user);
  return success(res, { message: 'Lead updated successfully', data: { lead } });
});

const deleteLead = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.params.id, req.user);
  return success(res, { message: 'Lead deleted successfully' });
});

const updateStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateStatus(req.params.id, req.body.status, req.user);
  return success(res, { message: 'Lead status updated', data: { lead } });
});

const assignLead = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLead(req.params.id, req.body.assignedTo, req.user);
  return success(res, { message: 'Lead assignment updated', data: { lead } });
});

const addNote = asyncHandler(async (req, res) => {
  const note = await leadService.addNote(req.params.id, req.body.note, req.user);
  return success(res, {
    statusCode: 201,
    message: 'Note added successfully',
    data: { note },
  });
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await leadService.getActivity(req.params.id, req.user);
  return success(res, { data: { activity } });
});

module.exports = {
  listLeads,
  createLead,
  getLead,
  updateLead,
  deleteLead,
  updateStatus,
  assignLead,
  addNote,
  getActivity,
};
