import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/App";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useRequestDetail } from "@/hooks/useRequestDetail";
import { useSampleWorkflow } from "@/hooks/useSampleWorkflow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/requestDetail";
import { RequestHeader } from "@/components/detail/RequestHeader";
import { RequestOverviewCard } from "@/components/detail/RequestOverviewCard";
import { AttachmentsCard } from "@/components/detail/AttachmentsCard";
import { ProcessingStatusCard } from "@/components/detail/ProcessingStatusCard";
import { ProcurementCard } from "@/components/detail/procurement/ProcurementCard";
import { DapStatusCard } from "@/components/detail/DapStatusCard";
import { SampleDetailsDialog } from "@/components/detail/SampleDetailsDialog";
import { RequestDetailSidebar } from "@/components/detail/RequestDetailSidebar";
import { RequestDetailDialogs } from "@/components/detail/RequestDetailDialogs";

const PROCESSOR_ROLES = ["buyer", "capex_head"];
const PREPARER_ROLES = ["user", "department_head", "process_engineering"];
const APPROVER_ROLES = ["department_head", "capex_head"];
const AWAITING_APPROVAL = ["Pending Approval", "Pending DH Approval"];

/**
 * Detail page for one Capex request. This component only wires things up:
 * data and mutations live in useRequestDetail / useSampleWorkflow, and each
 * card is its own component under components/detail/.
 */
export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAccess } = useAccessControl();

  const detail = useRequestDetail(id);
  const samples = useSampleWorkflow(id, detail.reloadSamples);
  const { request, dap, isLoading } = detail;

  // Which requirement item is selected on multi-item (multi-PR) requests.
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Page-level dialog state (rendered by RequestDetailDialogs).
  const [newComment, setNewComment] = useState("");
  const [dapDialogOpen, setDapDialogOpen] = useState(false);
  const [dapApprovalDialogOpen, setDapApprovalDialogOpen] = useState(false);
  const [dapApprovalAction, setDapApprovalAction] = useState("");
  const [dapComment, setDapComment] = useState("");
  const [dapChangeType, setDapChangeType] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="request-detail-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Request not found</h3>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const role = user?.role;
  const canProcess = PROCESSOR_ROLES.includes(role);
  const canUpdatePreparation = PREPARER_ROLES.includes(role);
  const canApprove = APPROVER_ROLES.includes(role) && AWAITING_APPROVAL.includes(request.status);

  const isMultiItem = (request.requirement_items?.length || 0) > 1;
  const selectedItem = isMultiItem ? request.requirement_items[selectedIndex] : null;

  // CEA/PR/PO edits go to the selected item (multi-item) or the request itself.
  const updateStage = (data) => detail.updateStageFields(isMultiItem, selectedIndex, data);
  const updateAvailability = (data) =>
    isMultiItem ? detail.updateRequirementItem(selectedIndex, data) : detail.update(data);

  const openDapAction = (action) => {
    setDapApprovalAction(action);
    setDapApprovalDialogOpen(true);
  };

  const handleDelete = async () => {
    if (await detail.deleteRequest()) navigate("/dashboard");
  };

  const handleCreateDap = async () => {
    if (await detail.createDap()) setDapDialogOpen(false);
  };

  const handleDapDecision = async () => {
    const ok = await detail.submitDapDecision({ action: dapApprovalAction, comment: dapComment, changeType: dapChangeType });
    if (ok) {
      setDapApprovalDialogOpen(false);
      setDapComment("");
      setDapChangeType("");
    }
  };

  const handleCommentSubmit = async () => {
    if (await detail.addComment(newComment)) setNewComment("");
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="request-detail">
      <RequestHeader
        request={request}
        isRefreshing={detail.isRefreshing}
        isSubmitting={detail.isSubmitting}
        canApprove={canApprove}
        onBack={() => navigate("/dashboard")}
        onRefresh={() => detail.refreshRequest({ notify: true })}
        onDelete={handleDelete}
        onApprove={detail.approve}
        onReject={detail.reject}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <RequestOverviewCard
            request={request} hasAccess={hasAccess}
            selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex}
          />

          {hasAccess("capex_request", "attachments") && request.attachments?.length > 0 && (
            <AttachmentsCard attachments={request.attachments} />
          )}

          {hasAccess("capex_request", "buyer_module") && (
            <ProcessingStatusCard
              request={request}
              selectedItem={selectedItem}
              selectedIndex={selectedIndex}
              isMultiItem={isMultiItem}
              canProcess={canProcess}
              prStages={detail.prStages}
              poStages={detail.poStages}
              onStageUpdate={updateStage}
              onAvailabilityChange={updateAvailability}
            />
          )}

          {hasAccess("capex_request", "supplier_details") && (
            <>
              <ProcurementCard
                request={request} dap={dap} user={user} canProcess={canProcess}
                onUpdate={detail.update}
                onCreateDap={() => setDapDialogOpen(true)}
                onDapAction={openDapAction}
              />
              <SampleDetailsDialog
                sample={samples.selectedSample}
                canProcess={canProcess}
                onClose={() => samples.setSelectedSample(null)}
                onUpdatePickup={samples.updatePickup}
              />
            </>
          )}

          {dap && <DapStatusCard dap={dap} request={request} user={user} onDapAction={openDapAction} />}
        </div>

        <RequestDetailSidebar
          request={request} sampleRequests={detail.sampleRequests} comments={detail.comments}
          dap={dap} buyers={detail.buyers} user={user}
          canProcess={canProcess} canUpdatePreparation={canUpdatePreparation}
          hasMultipleItems={isMultiItem} selectedItem={selectedItem} hasAccess={hasAccess}
          selectedSampleForDetails={samples.selectedSample}
          setSelectedSampleForDetails={samples.setSelectedSample}
          setNewSampleDialogOpen={samples.setNewSampleDialogOpen}
          handleUpdate={detail.update} handleSamplePickup={samples.updatePickup}
          setUnderPrepDialog={samples.setUnderPrepDialog} setBuyerDecisionDialog={samples.setBuyerDecisionDialog}
          setDispatchDialog={samples.setDispatchDialog} setDispatchItems={samples.setDispatchItems}
          newComment={newComment} setNewComment={setNewComment}
          handleCommentSubmit={handleCommentSubmit} isSubmitting={detail.isSubmitting}
          formatDate={formatDate} formatDateTime={formatDateTime}
        />
      </div>

      <RequestDetailDialogs
        id={id} isSubmitting={detail.isSubmitting}
        dapDialogOpen={dapDialogOpen} setDapDialogOpen={setDapDialogOpen} handleCreateDap={handleCreateDap}
        dapApprovalDialogOpen={dapApprovalDialogOpen} setDapApprovalDialogOpen={setDapApprovalDialogOpen}
        dapApprovalAction={dapApprovalAction}
        dapChangeType={dapChangeType} setDapChangeType={setDapChangeType}
        dapComment={dapComment} setDapComment={setDapComment} handleDapApproval={handleDapDecision}
        newSampleDialogOpen={samples.newSampleDialogOpen} setNewSampleDialogOpen={samples.setNewSampleDialogOpen}
        newSampleItems={samples.newSampleItems} setNewSampleItems={samples.setNewSampleItems}
        handleCreateSample={samples.createSample} isCreatingSample={samples.isCreatingSample}
        underPrepDialog={samples.underPrepDialog} setUnderPrepDialog={samples.setUnderPrepDialog}
        expectedReadinessDate={samples.expectedReadinessDate} setExpectedReadinessDate={samples.setExpectedReadinessDate}
        handleUnderPrepSubmit={samples.submitUnderPreparation}
        dispatchDialog={samples.dispatchDialog} setDispatchDialog={samples.setDispatchDialog}
        dispatchItems={samples.dispatchItems} setDispatchItems={samples.setDispatchItems}
        gatePassAvailable={samples.gatePassAvailable} setGatePassAvailable={samples.setGatePassAvailable}
        gatePassUploading={samples.gatePassUploading} gatePassUrl={samples.gatePassUrl}
        handleGatePassUpload={samples.uploadGatePass} handleDispatchSubmit={samples.submitDispatch}
        isSubmittingDispatch={samples.isSubmittingDispatch}
        buyerDecisionDialog={samples.buyerDecisionDialog} setBuyerDecisionDialog={samples.setBuyerDecisionDialog}
        handleBuyerDecision={samples.submitBuyerDecision}
      />
    </div>
  );
}
