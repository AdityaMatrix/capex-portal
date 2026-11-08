import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { useAccessControl } from "./useAccessControl";

jest.mock("axios");

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  axios.get.mockReset();
});

describe("useAccessControl", () => {
  it("hides only the items an admin marked as hidden", async () => {
    localStorage.setItem("capex_token", "token");
    axios.get.mockResolvedValue({ data: { dashboard: { card_cost_savings: "hidden", buyer_module: "view" } } });

    const { result } = renderHook(() => useAccessControl());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAccess("dashboard", "card_cost_savings")).toBe(false);
    expect(result.current.hasAccess("dashboard", "buyer_module")).toBe(true);
    // Items/modules missing from the config default to visible.
    expect(result.current.hasAccess("dashboard", "new_widget")).toBe(true);
    expect(result.current.hasAccess("analytics", "anything")).toBe(true);
  });

  it("loads the previewed role's permissions in Preview-as-Role mode", async () => {
    localStorage.setItem("capex_token", "token");
    sessionStorage.setItem("access_preview_role", "buyer");
    axios.get.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useAccessControl());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/admin/access-config/preview/buyer"),
      expect.anything(),
    );
    expect(result.current.previewRole).toBe("buyer");
  });

  it("does not call the API when logged out", async () => {
    const { result } = renderHook(() => useAccessControl());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axios.get).not.toHaveBeenCalled();
  });
});
