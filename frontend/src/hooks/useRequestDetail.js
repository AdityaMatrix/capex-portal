import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API } from "@/lib/api";
import { clearPlaceholders, mapItemUpdateToRequest } from "@/lib/requestDetail";

const errorMessage = (error, fallback) => error.response?.data?.detail || fallback;

/**
 * Loads a Capex request plus everything the detail page shows next to it,
 * and exposes the mutations the page can perform. Components stay
 * presentational: they call these actions and re-render from the result.
 */
export function useRequestDetail(id) {
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [dap, setDap] = useState(null);
  const [sampleRequests, setSampleRequests] = useState([]);
  const [prStages, setPrStages] = useState([]);
  const [poStages, setPoStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDap = useCallback(async (dapId) => {
    if (!dapId) return;
    const { data } = await axios.get(`${API}/dap/${dapId}`);
    setDap(data);
  }, []);

  const reloadSamples = useCallback(async () => {
    const { data } = await axios.get(`${API}/sample-requests?capex_request_id=${id}`);
    setSampleRequests(data);
    return data;
  }, [id]);

  // Initial load: everything in parallel, then the DAP (its id lives on the request).
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const [requestRes, commentsRes, buyersRes, prRes, poRes, samplesRes] = await Promise.all([
          axios.get(`${API}/capex-requests/${id}`),
          axios.get(`${API}/comments?capex_request_id=${id}`),
          axios.get(`${API}/users/buyers`),
          axios.get(`${API}/reference/pr-stages`),
          axios.get(`${API}/reference/po-stages`),
          axios.get(`${API}/sample-requests?capex_request_id=${id}`),
        ]);
        if (cancelled) return;
        setRequest(requestRes.data);
        setComments(commentsRes.data);
        setBuyers(buyersRes.data);
        setPrStages(prRes.data);
        setPoStages(poRes.data);
        setSampleRequests(samplesRes.data);
        await loadDap(requestRes.data.dap_id);
      } catch (error) {
        if (!cancelled) toast.error("Failed to load request details");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // Ignore responses that arrive after navigating to another request.
    return () => { cancelled = true; };
  }, [id, loadDap]);

  /** Re-fetch the request, its DAP and samples. `notify` shows a toast (manual refresh only). */
  const refreshRequest = useCallback(async ({ notify = false } = {}) => {
    setIsRefreshing(true);
    try {
      const { data } = await axios.get(`${API}/capex-requests/${id}`);
      setRequest(data);
      await loadDap(data.dap_id);
      await reloadSamples();
      if (notify) toast.success("Data refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [id, loadDap, reloadSamples]);

  /** Run a submit-style action with a shared busy flag and error toast. */
  const submit = useCallback(async (action, { success, failure }) => {
    setIsSubmitting(true);
    try {
      await action();
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, failure));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const approve = useCallback(async () => {
    const ok = await submit(() => axios.post(`${API}/capex-requests/${id}/approve`), {
      success: "Request approved successfully", failure: "Failed to approve",
    });
    if (ok) refreshRequest();
  }, [id, submit, refreshRequest]);

  const reject = useCallback(async (reason) => {
    const ok = await submit(
      () => axios.post(`${API}/capex-requests/${id}/reject?reason=${encodeURIComponent(reason)}`),
      { success: "Request rejected", failure: "Failed to reject" },
    );
    if (ok) refreshRequest();
    return ok;
  }, [id, submit, refreshRequest]);

  const deleteRequest = useCallback(() => submit(
    () => axios.delete(`${API}/capex-requests/${id}`),
    { success: "Request deleted successfully", failure: "Failed to delete request" },
  ), [id, submit]);

  /** Partial update of request-level fields. */
  const update = useCallback(async (updateData) => {
    try {
      await axios.put(`${API}/capex-requests/${id}`, updateData);
      refreshRequest();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update"));
    }
  }, [id, refreshRequest]);

  /** Partial update of one requirement item (multi-item requests). */
  const updateRequirementItem = useCallback(async (index, itemUpdate) => {
    if (!request?.requirement_items) return;
    const items = [...request.requirement_items];
    items[index] = { ...items[index], ...itemUpdate };
    await update({ requirement_items: items });
  }, [request, update]);

  /**
   * Update CEA/PR/PO fields for whichever record owns them:
   * the selected item on multi-item requests, the request otherwise.
   */
  const updateStageFields = useCallback((isMultiItem, selectedIndex, rawUpdate) => {
    const cleaned = clearPlaceholders(rawUpdate);
    if (isMultiItem) return updateRequirementItem(selectedIndex, cleaned);
    return update(mapItemUpdateToRequest(cleaned));
  }, [update, updateRequirementItem]);

  const addComment = useCallback(async (content) => {
    if (!content.trim()) return false;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/comments`, { capex_request_id: id, content });
      setComments((prev) => [...prev, data]);
      toast.success("Comment added");
      return true;
    } catch {
      toast.error("Failed to add comment");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [id]);

  const createDap = useCallback(async () => {
    const ok = await submit(
      () => axios.post(`${API}/dap`, { capex_request_id: id, documents: [] }),
      { success: "DAP created - awaiting approvals", failure: "Failed to create DAP" },
    );
    if (ok) refreshRequest();
    return ok;
  }, [id, submit, refreshRequest]);

  const submitDapDecision = useCallback(async ({ action, comment, changeType }) => {
    if (action === "request_changes" && !comment) {
      toast.error("Please provide a comment for changes required");
      return false;
    }
    const ok = await submit(
      () => axios.put(`${API}/dap/${dap.id}/approve`, { action, comment, change_type: changeType }),
      { success: action === "approve" ? "DAP approved" : "Changes requested", failure: "Failed to update DAP" },
    );
    if (ok) refreshRequest();
    return ok;
  }, [dap, submit, refreshRequest]);

  return {
    request, comments, buyers, dap, sampleRequests, prStages, poStages,
    isLoading, isRefreshing, isSubmitting,
    refreshRequest, reloadSamples,
    approve, reject, deleteRequest,
    update, updateRequirementItem, updateStageFields,
    addComment, createDap, submitDapDecision,
  };
}
