import { isCeaPending, isPendingTask, isPrPending } from "./dashboardConfig";

// A request is a pending task only when CEA, PR and PO numbers all exist
// and at least one of them is not yet approved.
const request = (overrides = {}) => ({
  cea_number: "CEA-1", cea_status: "Approved",
  pr_number: "PR-1", pr_approval_status: "Approved",
  po_number: "PO-1", po_approval_status: "Approved",
  ...overrides,
});

describe("isPendingTask", () => {
  it("is pending when every number exists but one stage is not approved", () => {
    expect(isPendingTask(request({ pr_approval_status: "Under Approval" }))).toBe(true);
  });

  it("is not pending once all three stages are approved", () => {
    expect(isPendingTask(request())).toBe(false);
  });

  it("is not pending while any number is missing, even if unapproved", () => {
    expect(isPendingTask(request({ pr_number: "", pr_approval_status: "" }))).toBe(false);
    expect(isPendingTask(request({ po_number: undefined, po_approval_status: "Pending" }))).toBe(false);
  });

  it("falls back to the first line item's numbers and statuses", () => {
    const multi = {
      items: [{ cea_number: "C", cea_status: "Approved", pr_number: "P", pr_status: "Pending", po_number: "O", po_status: "Approved" }],
    };
    expect(isPendingTask(multi)).toBe(true);
  });
});

describe("per-stage pending flags", () => {
  it("CEA is never pending when the request does not need a CEA", () => {
    expect(isCeaPending(request({ cea_status: "CFO", cea_required: false }))).toBe(false);
    expect(isCeaPending(request({ cea_status: "CFO" }))).toBe(true);
  });

  it("PR is not pending without a PR number", () => {
    expect(isPrPending(request({ pr_number: "", pr_approval_status: "Pending" }))).toBe(false);
  });
});
