import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestHeader } from "./RequestHeader";

const request = { id: "CR-42", status: "Pending Approval", user_name: "Amit", created_at: "2026-01-15T10:00:00Z" };

function renderHeader(props = {}) {
  const handlers = {
    onBack: jest.fn(),
    onRefresh: jest.fn(),
    onDelete: jest.fn(),
    onApprove: jest.fn(),
    onReject: jest.fn().mockResolvedValue(true),
  };
  render(<RequestHeader request={request} isRefreshing={false} isSubmitting={false} canApprove {...handlers} {...props} />);
  return handlers;
}

describe("RequestHeader", () => {
  it("shows the request id and status", () => {
    renderHeader();
    expect(screen.getByRole("heading", { name: "CR-42" })).toBeInTheDocument();
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
  });

  it("hides approve/reject from users who cannot approve", () => {
    renderHeader({ canApprove: false });
    expect(screen.queryByTestId("approve-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reject-btn")).not.toBeInTheDocument();
  });

  it("requires a reason before rejecting, then sends it", async () => {
    const user = userEvent.setup();
    const { onReject } = renderHeader();

    await user.click(screen.getByTestId("reject-btn"));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("Rejection reason"), "No budget");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(onReject).toHaveBeenCalledWith("No budget");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the reject dialog open if the request fails", async () => {
    const user = userEvent.setup();
    renderHeader({ onReject: jest.fn().mockResolvedValue(false) });

    await user.click(screen.getByTestId("reject-btn"));
    await user.type(screen.getByLabelText("Rejection reason"), "x");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the delete dialog on Cancel without deleting", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderHeader();

    await user.click(screen.getByTestId("delete-btn"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
  });
});
