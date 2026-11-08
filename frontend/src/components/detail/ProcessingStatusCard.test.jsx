import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProcessingStatusCard } from "./ProcessingStatusCard";

const baseRequest = {
  id: "CR-1",
  cea_required: false,
  pr_available: true,
  pr_number: "PR-100",
  pr_approval_status: "Under Approval",
  po_number: "",
  workflow_status: "PR Processing",
};

function renderCard(props = {}) {
  const handlers = { onStageUpdate: jest.fn(), onAvailabilityChange: jest.fn() };
  render(
    <ProcessingStatusCard
      request={baseRequest}
      selectedItem={null}
      selectedIndex={0}
      isMultiItem={false}
      canProcess
      prStages={["Under Approval", "Approved"]}
      poStages={["Under Approval", "Approved"]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("ProcessingStatusCard", () => {
  it("keeps PO locked until the PR is approved", () => {
    renderCard();
    expect(screen.getByText("Locked - PR Pending")).toBeInTheDocument();
    expect(screen.queryByTestId("po-number-input")).not.toBeInTheDocument();
  });

  it("unlocks PO editing once the PR is approved", () => {
    renderCard({ request: { ...baseRequest, pr_approval_status: "Approved" } });
    expect(screen.queryByText("Locked - PR Pending")).not.toBeInTheDocument();
    expect(screen.getByTestId("po-number-input")).toBeInTheDocument();
  });

  it("locks PR behind an unapproved CEA when a CEA is required", () => {
    renderCard({ request: { ...baseRequest, cea_required: true, cea_status: "CFO" } });
    expect(screen.getByText("Locked - CEA Pending")).toBeInTheDocument();
    expect(screen.queryByTestId("pr-number-input")).not.toBeInTheDocument();
  });

  it("saves the PR number on blur", async () => {
    const user = userEvent.setup();
    const { onStageUpdate } = renderCard();

    const input = screen.getByTestId("pr-number-input");
    await user.clear(input);
    await user.type(input, "PR-200");
    await user.tab();

    expect(onStageUpdate).toHaveBeenCalledWith({ pr_number: "PR-200" });
  });

  it("sends availability toggles through their own handler", async () => {
    const user = userEvent.setup();
    const { onAvailabilityChange } = renderCard();

    await user.click(screen.getByTestId("pr-toggle-buyer"));
    expect(onAvailabilityChange).toHaveBeenCalledWith({ pr_available: false });
  });

  it("is read-only for roles that cannot process requests", () => {
    renderCard({ canProcess: false });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("PR-100")).toBeInTheDocument();
    expect(screen.getByText("PR Processing")).toBeInTheDocument();
  });

  it("shows the selected item's data on multi-item requests", () => {
    renderCard({
      canProcess: false,
      isMultiItem: true,
      selectedIndex: 1,
      selectedItem: { description: "CNC lathe", pr_number: "ITEM-PR-2", pr_status: "Approved" },
    });
    expect(screen.getByText(/Showing for: CNC lathe/)).toBeInTheDocument();
    expect(screen.getByText("ITEM-PR-2")).toBeInTheDocument();
    expect(screen.queryByText("PR-100")).not.toBeInTheDocument();
  });
});
