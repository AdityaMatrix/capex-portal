// Pure helpers for the Capex request detail page. No React, no network:
// everything here is unit-tested in requestDetail.test.js.

export const STATUS_COLORS = {
  "Pending Approval": "bg-amber-100 text-amber-800",
  "Approved": "bg-emerald-100 text-emerald-800",
  "Rejected": "bg-rose-100 text-rose-800",
  "CEA Processing": "bg-blue-100 text-blue-800",
  "PR Processing": "bg-blue-100 text-blue-800",
  "PO Processing": "bg-indigo-100 text-indigo-800",
  "DAP Approval Pending": "bg-violet-100 text-violet-800",
  "Sample Requested": "bg-cyan-100 text-cyan-800",
  "Sample Ready for Dispatch": "bg-cyan-100 text-cyan-800",
  "PDI": "bg-purple-100 text-purple-800",
  "Under Dispatch": "bg-orange-100 text-orange-800",
  "Dispatched": "bg-orange-100 text-orange-800",
  "Delivery": "bg-teal-100 text-teal-800",
  "Installation in Progress": "bg-pink-100 text-pink-800",
  "Completed": "bg-slate-800 text-white",
};

export const DEFAULT_STATUS_COLOR = "bg-slate-100 text-slate-800";

export const CEA_APPROVAL_STAGES = [
  "Capex Head", "Department Head", "CTO", "Manufacturing Head",
  "Operation Head", "Budget", "CFO", "Approved",
];

/** Sentinel used by <Select> for "no value", since Radix disallows "". */
export const NONE_VALUE = "__none__";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** ISO datetime -> "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(value) {
  return value?.split("T")[0] || "";
}

export function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from, to) {
  return Math.floor((new Date(to) - new Date(from)) / MS_PER_DAY);
}

/** Replace the Select placeholder sentinel with null. */
export function clearPlaceholders(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === NONE_VALUE ? null : value]),
  );
}

// Requirement-item field -> request-level field, for single-item requests.
// Most names match; status fields are named differently on the request.
const ITEM_TO_REQUEST_FIELD = {
  cea_number: "cea_number",
  cea_status: "cea_status",
  wbs_number: "wbs_number",
  pr_number: "pr_number",
  pr_status: "pr_approval_status",
  po_number: "po_number",
  po_status: "po_approval_status",
  delivery_status: "delivery_status",
  installation_status: "commissioning_status",
  cea_created_date: "cea_created_date",
  cea_approved_date: "cea_approved_date",
  pr_created_date: "pr_created_date",
  pr_approved_date: "pr_approved_date",
  po_created_date: "po_created_date",
  po_approved_date: "po_approved_date",
  ordered_date: "ordered_date",
};

/**
 * Translate an item-shaped update into a request-shaped update.
 * Unknown keys are dropped so stray fields never reach the API.
 */
export function mapItemUpdateToRequest(itemUpdate) {
  const requestUpdate = {};
  for (const [itemKey, requestKey] of Object.entries(ITEM_TO_REQUEST_FIELD)) {
    if (itemUpdate[itemKey] !== undefined) requestUpdate[requestKey] = itemUpdate[itemKey];
  }
  return requestUpdate;
}

/**
 * Read the CEA / PR / PO fields shown in the processing card.
 * Multi-item requests track these per item (no fallback to the request);
 * single-item requests store them on the request itself.
 */
export function getStageFields(request, selectedItem, isMultiItem) {
  if (isMultiItem) {
    const item = selectedItem || {};
    return {
      ceaNumber: item.cea_number,
      ceaStatus: item.cea_status,
      wbsNumber: item.wbs_number,
      prNumber: item.pr_number,
      prStatus: item.pr_status,
      prAvailable: item.pr_available || false,
      poNumber: item.po_number,
      poStatus: item.po_status,
      poAvailable: item.po_available !== false,
      dates: item,
    };
  }
  return {
    ceaNumber: request.cea_number,
    ceaStatus: request.cea_status,
    wbsNumber: request.wbs_number,
    prNumber: request.pr_number,
    prStatus: request.pr_approval_status,
    prAvailable: request.pr_available || false,
    poNumber: request.po_number,
    poStatus: request.po_approval_status,
    poAvailable: request.po_available !== false,
    dates: request,
  };
}

/** Status pill shown per requirement item: item value wins, request is the fallback. */
export function getItemPipelineStatus(item, request) {
  return {
    cea: item.cea_status || request.cea_status,
    pr: item.pr_status || request.pr_approval_status,
    po: item.po_status || request.po_approval_status,
  };
}

/** null until both dates exist; otherwise on-time flag and days late. */
export function getDeliveryTimeliness(expectedDate, actualDate) {
  if (!expectedDate || !actualDate) return null;
  const daysLate = daysBetween(expectedDate, actualDate);
  return { onTime: daysLate <= 0, daysLate: Math.max(daysLate, 0) };
}

/**
 * Days between planned and actual completion (negative = early).
 * Actual completion falls back to commissioning, then closure date.
 */
export function getCompletionVariance(request) {
  const actual = request.actual_completion_date || request.commissioning_date || request.closure_date;
  if (!request.planned_completion_date || !actual) return null;
  return daysBetween(request.planned_completion_date, actual);
}

/**
 * DAP approvals are sequential: Process Engineering -> Dept Head -> User.
 * The backend rejects out-of-order approvals, so only offer the action
 * to the role whose turn it is.
 */
export function canApproveDap(role, dap) {
  if (!dap) return false;
  const pe = dap.process_engineer_approval_status;
  const dh = dap.dept_head_approval_status;
  const user = dap.user_approval_status;
  switch (role) {
    case "process_engineering":
      return pe === "Pending";
    case "department_head":
      return pe === "Approved" && dh === "Pending";
    case "user":
      return dh === "Approved" && user === "Pending";
    default:
      return false;
  }
}

/** Mark one supplier as ordered (and every other one as not ordered). */
export function placeOrderWithSupplier(suppliers, index, orderedDate = todayISODate()) {
  return suppliers.map((supplier, i) => ({
    ...supplier,
    is_ordered: i === index,
    ordered_date: i === index ? orderedDate : null,
  }));
}

/** Immutable "update one element of an array" helper. */
export function updateAt(list, index, patch) {
  const next = [...(list || [])];
  next[index] = { ...next[index], ...patch };
  return next;
}

export function removeAt(list, index) {
  return (list || []).filter((_, i) => i !== index);
}
