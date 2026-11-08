import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API } from "@/lib/api";
import { uploadFile } from "@/lib/files";

const EMPTY_SAMPLE_ITEM = { material_description: "", number_of_samples: 1 };
const CLOSED_DISPATCH = { open: false, sampleId: null, lineItems: [] };
const CLOSED_BUYER_DECISION = { open: false, sampleId: null, gatePassAvailable: false };

const errorMessage = (error, fallback) => error.response?.data?.detail || fallback;

/**
 * State and actions for the sample workflow on a request:
 * create -> under preparation -> ready for dispatch -> buyer decision -> pickup.
 */
export function useSampleWorkflow(requestId, reloadSamples) {
  const [selectedSample, setSelectedSample] = useState(null);

  const [newSampleDialogOpen, setNewSampleDialogOpen] = useState(false);
  const [newSampleItems, setNewSampleItems] = useState([EMPTY_SAMPLE_ITEM]);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  const [underPrepDialog, setUnderPrepDialog] = useState({ open: false, sampleId: null });
  const [expectedReadinessDate, setExpectedReadinessDate] = useState("");

  const [dispatchDialog, setDispatchDialog] = useState(CLOSED_DISPATCH);
  const [dispatchItems, setDispatchItems] = useState([]);
  const [gatePassAvailable, setGatePassAvailable] = useState(false);
  const [gatePassUploading, setGatePassUploading] = useState(false);
  const [gatePassUrl, setGatePassUrl] = useState("");
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  const [buyerDecisionDialog, setBuyerDecisionDialog] = useState(CLOSED_BUYER_DECISION);

  const createSample = useCallback(async () => {
    const validItems = newSampleItems.filter((i) => i.material_description.trim());
    if (validItems.length === 0) {
      toast.error("Add at least one item with a description");
      return;
    }
    setIsCreatingSample(true);
    try {
      await axios.post(`${API}/sample-requests`, { capex_request_id: requestId, line_items: validItems });
      toast.success("Sample request created successfully");
      setNewSampleDialogOpen(false);
      setNewSampleItems([EMPTY_SAMPLE_ITEM]);
      await reloadSamples();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create sample request"));
    } finally {
      setIsCreatingSample(false);
    }
  }, [newSampleItems, requestId, reloadSamples]);

  /** Buyer updates pickup / dispatch / delivery details of a sample. */
  const updatePickup = useCallback(async (sampleId, updateData) => {
    try {
      await axios.put(`${API}/sample-requests/${sampleId}/pickup`, updateData);
      toast.success("Sample pickup details updated");
      const samples = await reloadSamples();
      // Keep the open details dialog in sync with the saved data.
      setSelectedSample((current) =>
        current?.id === sampleId ? samples.find((s) => s.id === sampleId) || current : current,
      );
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update sample"));
    }
  }, [reloadSamples]);

  const submitUnderPreparation = useCallback(async () => {
    if (!expectedReadinessDate) {
      toast.error("Please select expected readiness date");
      return;
    }
    try {
      await axios.put(`${API}/sample-requests/${underPrepDialog.sampleId}/preparation`, {
        readiness_status: "Under Preparation",
        expected_readiness_date: expectedReadinessDate,
      });
      toast.success("Sample marked as Under Preparation");
      setUnderPrepDialog({ open: false, sampleId: null });
      setExpectedReadinessDate("");
      await reloadSamples();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update sample"));
    }
  }, [expectedReadinessDate, underPrepDialog.sampleId, reloadSamples]);

  const submitDispatch = useCallback(async () => {
    const validItems = dispatchItems.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      toast.error("Fill at least one item description");
      return;
    }
    setIsSubmittingDispatch(true);
    try {
      await axios.put(`${API}/sample-requests/${dispatchDialog.sampleId}/preparation`, {
        readiness_status: "Ready for Pickup",
        preparation_items: validItems.map(({ description, material_code, number_of_samples, type_of_packing }) => ({
          description, material_code, number_of_samples, type_of_packing,
        })),
        gate_pass_available: gatePassAvailable,
        gate_pass_document_url: gatePassUrl || null,
      });
      toast.success("Sample marked as Ready for Dispatch");
      setDispatchDialog(CLOSED_DISPATCH);
      setDispatchItems([]);
      setGatePassAvailable(false);
      setGatePassUrl("");
      await reloadSamples();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update"));
    } finally {
      setIsSubmittingDispatch(false);
    }
  }, [dispatchItems, dispatchDialog.sampleId, gatePassAvailable, gatePassUrl, reloadSamples]);

  const uploadGatePass = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGatePassUploading(true);
    try {
      const data = await uploadFile(file, { document_type: "gate_pass" });
      setGatePassUrl(data.url || data.file_id);
      toast.success("Gate pass uploaded");
    } catch {
      toast.error("Failed to upload gate pass");
    } finally {
      setGatePassUploading(false);
    }
  }, []);

  /** Buyer chooses Job Work Challan or Gate Pass. */
  const submitBuyerDecision = useCallback(async (decision) => {
    try {
      await axios.put(`${API}/sample-requests/${buyerDecisionDialog.sampleId}/pickup`, { buyer_decision: decision });
      toast.success(`Selected: ${decision}`);
      setBuyerDecisionDialog(CLOSED_BUYER_DECISION);
      await reloadSamples();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update"));
    }
  }, [buyerDecisionDialog.sampleId, reloadSamples]);

  return {
    selectedSample, setSelectedSample, updatePickup,
    newSampleDialogOpen, setNewSampleDialogOpen, newSampleItems, setNewSampleItems,
    isCreatingSample, createSample,
    underPrepDialog, setUnderPrepDialog, expectedReadinessDate, setExpectedReadinessDate,
    submitUnderPreparation,
    dispatchDialog, setDispatchDialog, dispatchItems, setDispatchItems,
    gatePassAvailable, setGatePassAvailable, gatePassUploading, gatePassUrl,
    uploadGatePass, submitDispatch, isSubmittingDispatch,
    buyerDecisionDialog, setBuyerDecisionDialog, submitBuyerDecision,
  };
}
