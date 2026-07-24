const leadRepository = require('../repositories/leadRepository');
const noteRepository = require('../repositories/noteRepository');
const activityRepository = require('../repositories/activityRepository');
const userRepository = require('../repositories/userRepository');
const { withTransaction } = require('../database/pool');
const AppError = require('../utils/AppError');
const { LEAD_STATUSES, USER_ROLES, STATUS_LABELS } = require('../utils/constants');

function assertLeadAccess(lead, user) {
  if (user.role === USER_ROLES.ADMIN) {
    return;
  }
  if (lead.assigned_to !== user.id) {
    throw new AppError('You do not have access to this lead', 403);
  }
}

function parseListQuery(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const sort = query.sort === 'oldest' ? 'oldest' : 'newest';
  const status = query.status || undefined;
  const assignedTo = query.assignedTo || undefined;
  const search = query.search ? String(query.search).trim() : undefined;

  if (status && !LEAD_STATUSES.includes(status)) {
    throw new AppError('Invalid status filter', 400);
  }

  return { page, limit, sort, status, assignedTo, search };
}

async function listLeads(query, user) {
  const filters = parseListQuery(query);

  if (user.role === USER_ROLES.MEMBER) {
    filters.scopedUserId = user.id;
    delete filters.assignedTo;
  }

  const { rows, total } = await leadRepository.findAll(filters);

  return {
    leads: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
      sort: filters.sort,
    },
  };
}

async function getLeadById(id, user) {
  const lead = await leadRepository.findById(id);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertLeadAccess(lead, user);

  const [notes, activity] = await Promise.all([
    noteRepository.findByLeadId(id),
    activityRepository.findByLeadId(id),
  ]);

  return { ...lead, notes, activity };
}

async function createLead(payload, actor = null) {
  const lead = await withTransaction(async (client) => {
    const created = await leadRepository.create(payload, client);
    await activityRepository.create(
      {
        leadId: created.id,
        userId: actor?.id ?? null,
        action: 'Lead created',
      },
      client
    );
    return created;
  });
  return lead;
}

async function updateLead(id, payload, user) {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Only admins can update lead details', 403);
  }

  const existing = await leadRepository.findById(id);
  if (!existing) {
    throw new AppError('Lead not found', 404);
  }

  await leadRepository.update(id, {
    name: payload.name ?? existing.name,
    email: payload.email ?? existing.email,
    phone: payload.phone ?? existing.phone,
    budget: payload.budget !== undefined ? payload.budget : existing.budget,
    message: payload.message ?? existing.message,
  });

  return leadRepository.findById(id);
}

async function deleteLead(id, user) {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Only admins can delete leads', 403);
  }

  const deleted = await leadRepository.remove(id);
  if (!deleted) {
    throw new AppError('Lead not found', 404);
  }
  return deleted;
}

async function updateStatus(id, status, user) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new AppError('Invalid lead status', 400);
  }

  const lead = await leadRepository.findById(id);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertLeadAccess(lead, user);

  if (lead.status === status) {
    return lead;
  }

  await withTransaction(async (client) => {
    await leadRepository.updateStatus(id, status, client);
    await activityRepository.create(
      {
        leadId: id,
        userId: user.id,
        action: `Status changed from ${STATUS_LABELS[lead.status]} to ${STATUS_LABELS[status]}`,
      },
      client
    );
  });

  return leadRepository.findById(id);
}

async function assignLead(id, assignedTo, user) {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Only admins can assign leads', 403);
  }

  const lead = await leadRepository.findById(id);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  let assigneeName = 'Unassigned';
  if (assignedTo) {
    const assignee = await userRepository.findById(assignedTo);
    if (!assignee) {
      throw new AppError('Assignee not found', 404);
    }
    if (assignee.role !== USER_ROLES.MEMBER && assignee.role !== USER_ROLES.ADMIN) {
      throw new AppError('Invalid assignee', 400);
    }
    assigneeName = assignee.name;
  }

  await withTransaction(async (client) => {
    await leadRepository.assign(id, assignedTo || null, client);
    await activityRepository.create(
      {
        leadId: id,
        userId: user.id,
        action: assignedTo
          ? `Lead assigned to ${assigneeName}`
          : 'Lead unassigned',
      },
      client
    );
  });

  return leadRepository.findById(id);
}

async function addNote(id, note, user) {
  const lead = await leadRepository.findById(id);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertLeadAccess(lead, user);

  return withTransaction(async (client) => {
    const created = await noteRepository.create(
      { leadId: id, userId: user.id, note },
      client
    );
    await activityRepository.create(
      {
        leadId: id,
        userId: user.id,
        action: 'Note added',
      },
      client
    );
    return created;
  });
}

async function getActivity(id, user) {
  const lead = await leadRepository.findById(id);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertLeadAccess(lead, user);
  return activityRepository.findByLeadId(id);
}

module.exports = {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  updateStatus,
  assignLead,
  addNote,
  getActivity,
};
