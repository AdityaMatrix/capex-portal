import {
  NONE_VALUE,
  canApproveDap,
  clearPlaceholders,
  getCompletionVariance,
  getDeliveryTimeliness,
  getItemPipelineStatus,
  getStageFields,
  mapItemUpdateToRequest,
  placeOrderWithSupplier,
  removeAt,
  toDateInput,
  updateAt,
} from "./requestDetail";

describe("mapItemUpdateToRequest", () => {
  it("renames item status fields to their request-level names", () => {
    expect(mapItemUpdateToRequest({ pr_status: "Approved", po_status: "Pending", installation_status: "Done" }))
      .toEqual({ pr_approval_status: "Approved", po_approval_status: "Pending", commissioning_status: "Done" });
  });

  it("passes through fields whose names match", () => {
    expect(mapItemUpdateToRequest({ pr_number: "PR-1", ordered_date: "2026-01-02" }))
      .toEqual({ pr_number: "PR-1", ordered_date: "2026-01-02" });
  });

  it("drops unknown keys so they never reach the API", () => {
    expect(mapItemUpdateToRequest({ pr_number: "PR-1", status: "Completed", random: 1 })).toEqual({ pr_number: "PR-1" });
  });

  it("keeps explicit nulls (clearing a field) but skips undefined", () => {
    expect(mapItemUpdateToRequest({ cea_status: null, cea_number: undefined })).toEqual({ cea_status: null });
  });
});

describe("clearPlaceholders", () => {
  it("turns the Select sentinel into null and leaves other values alone", () => {
    expect(clearPlaceholders({ pr_status: NONE_VALUE, pr_number: "PR-1", count: 0 }))
      .toEqual({ pr_status: null, pr_number: "PR-1", count: 0 });
  });
});

describe("getStageFields", () => {
  const request = {
    pr_number: "REQ-PR", pr_approval_status: "Approved", pr_available: true,
    po_number: "REQ-PO", po_approval_status: "Pending",
  };

  it("reads request-level fields for single-item requests", () => {
    const f = getStageFields(request, null, false);
    expect(f).toMatchObject({ prNumber: "REQ-PR", prStatus: "Approved", prAvailable: true, poNumber: "REQ-PO" });
    expect(f.dates).toBe(request);
  });

  it("reads only the selected item for multi-item requests, with no fallback to the request", () => {
    const item = { pr_number: "ITEM-PR", pr_status: "Pending" };
    const f = getStageFields(request, item, true);
    expect(f.prNumber).toBe("ITEM-PR");
    expect(f.prStatus).toBe("Pending");
    expect(f.poNumber).toBeUndefined(); // not REQ-PO
    expect(f.dates).toBe(item);
  });

  it("treats PO as created unless explicitly set to false", () => {
    expect(getStageFields({}, null, false).poAvailable).toBe(true);
    expect(getStageFields({ po_available: false }, null, false).poAvailable).toBe(false);
  });

  it("handles a missing selected item without crashing", () => {
    expect(getStageFields(request, undefined, true).prNumber).toBeUndefined();
  });
});

describe("getItemPipelineStatus", () => {
  it("prefers the item's status and falls back to the request's", () => {
    const status = getItemPipelineStatus(
      { pr_status: "Approved" },
      { cea_status: "CFO", pr_approval_status: "Pending", po_approval_status: "Pending" },
    );
    expect(status).toEqual({ cea: "CFO", pr: "Approved", po: "Pending" });
  });
});

describe("canApproveDap (sequential: Process Eng -> Dept Head -> User)", () => {
  const dap = (pe, dh, user) => ({
    process_engineer_approval_status: pe,
    dept_head_approval_status: dh,
    user_approval_status: user,
  });

  it("lets process engineering approve first", () => {
    expect(canApproveDap("process_engineering", dap("Pending", "Pending", "Pending"))).toBe(true);
  });

  it("blocks the department head until process engineering has approved", () => {
    expect(canApproveDap("department_head", dap("Pending", "Pending", "Pending"))).toBe(false);
    expect(canApproveDap("department_head", dap("Approved", "Pending", "Pending"))).toBe(true);
  });

  it("blocks the user until the department head has approved", () => {
    expect(canApproveDap("user", dap("Approved", "Pending", "Pending"))).toBe(false);
    expect(canApproveDap("user", dap("Approved", "Approved", "Pending"))).toBe(true);
  });

  it("does not offer approval twice or to unrelated roles", () => {
    expect(canApproveDap("process_engineering", dap("Approved", "Pending", "Pending"))).toBe(false);
    expect(canApproveDap("buyer", dap("Pending", "Pending", "Pending"))).toBe(false);
    expect(canApproveDap("user", null)).toBe(false);
  });
});

describe("getDeliveryTimeliness", () => {
  it("returns null until both dates are known", () => {
    expect(getDeliveryTimeliness("2026-01-10", null)).toBeNull();
    expect(getDeliveryTimeliness(undefined, "2026-01-10")).toBeNull();
  });

  it("is on time when delivered on or before the expected date", () => {
    expect(getDeliveryTimeliness("2026-01-10", "2026-01-10")).toEqual({ onTime: true, daysLate: 0 });
    expect(getDeliveryTimeliness("2026-01-10", "2026-01-05")).toEqual({ onTime: true, daysLate: 0 });
  });

  it("counts days late", () => {
    expect(getDeliveryTimeliness("2026-01-10", "2026-01-13")).toEqual({ onTime: false, daysLate: 3 });
  });
});

describe("getCompletionVariance", () => {
  it("returns null without a planned date or any completion date", () => {
    expect(getCompletionVariance({ actual_completion_date: "2026-02-01" })).toBeNull();
    expect(getCompletionVariance({ planned_completion_date: "2026-02-01" })).toBeNull();
  });

  it("is negative when early and positive when late", () => {
    expect(getCompletionVariance({ planned_completion_date: "2026-02-10", actual_completion_date: "2026-02-07" })).toBe(-3);
    expect(getCompletionVariance({ planned_completion_date: "2026-02-10", actual_completion_date: "2026-02-15" })).toBe(5);
  });

  it("falls back to commissioning date, then closure date", () => {
    expect(getCompletionVariance({ planned_completion_date: "2026-02-10", commissioning_date: "2026-02-12" })).toBe(2);
    expect(getCompletionVariance({ planned_completion_date: "2026-02-10", closure_date: "2026-02-11" })).toBe(1);
  });
});

describe("placeOrderWithSupplier", () => {
  it("marks exactly one supplier as ordered and clears the rest", () => {
    const suppliers = [{ name: "A", is_ordered: true, ordered_date: "2026-01-01" }, { name: "B" }, { name: "C" }];
    const result = placeOrderWithSupplier(suppliers, 1, "2026-03-01");
    expect(result.map((s) => s.is_ordered)).toEqual([false, true, false]);
    expect(result.map((s) => s.ordered_date)).toEqual([null, "2026-03-01", null]);
    expect(suppliers[0].is_ordered).toBe(true); // input not mutated
  });
});

describe("array helpers", () => {
  it("updateAt patches one element without mutating the input", () => {
    const list = [{ a: 1 }, { a: 2 }];
    expect(updateAt(list, 1, { b: 3 })).toEqual([{ a: 1 }, { a: 2, b: 3 }]);
    expect(list[1]).toEqual({ a: 2 });
  });

  it("removeAt removes by index and tolerates undefined lists", () => {
    expect(removeAt(["x", "y", "z"], 1)).toEqual(["x", "z"]);
    expect(removeAt(undefined, 0)).toEqual([]);
  });

  it("toDateInput trims ISO datetimes for date inputs", () => {
    expect(toDateInput("2026-05-04T10:20:30Z")).toBe("2026-05-04");
    expect(toDateInput(null)).toBe("");
  });
});
