import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, File, FileText } from "lucide-react";
import { canApproveDap } from "@/lib/requestDetail";
import { FileLink } from "@/components/detail/FileLink";

const STATUS_TONE = { Approved: "emerald", "Changes Required": "red" };
// Full class names written out so Tailwind's purge can find them.
const BADGE_CLASSES = {
  emerald: ["bg-emerald-100 text-emerald-700", "bg-emerald-100 text-emerald-800"],
  red: ["bg-red-100 text-red-700", "bg-red-100 text-red-800"],
  amber: ["bg-amber-100 text-amber-700", "bg-amber-100 text-amber-800"],
};
const statusBadge = (status, strong = false) => BADGE_CLASSES[STATUS_TONE[status] || "amber"][strong ? 1 : 0];

/** DAP approval progress, documents and change log, visible to every role involved. */
export function DapStatusCard({ dap, request, user, onDapAction }) {
  const steps = [
    { label: "Process Eng.", status: dap.process_engineer_approval_status },
    { label: "Dept Head", status: dap.dept_head_approval_status },
    { label: "User", status: dap.user_approval_status },
  ];

  return (
    <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50" data-testid="dap-documents-card">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-800">
            <FileText className="w-4 h-4" />
            DAP Status
          </CardTitle>
          <Badge className={statusBadge(dap.status, true)}>{dap.status} (v{dap.version})</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-violet-500 uppercase font-bold">Approval Progress</Label>
          <ol className="grid grid-cols-3 gap-1.5">
            {steps.map((step) => (
              <li key={step.label} className="p-1.5 bg-white rounded border text-center">
                <p className="text-[9px] text-slate-500">{step.label}</p>
                <Badge variant="secondary" className={`text-[9px] mt-0.5 ${statusBadge(step.status)}`}>{step.status}</Badge>
              </li>
            ))}
          </ol>
        </div>

        {dap.documents?.length > 0 && (
          <div>
            <Label className="text-[10px] text-violet-500 uppercase font-bold mb-1.5 block">DAP Documents</Label>
            <div className="space-y-1">
              {dap.documents.map((docUrl, idx) => (
                <FileLink key={idx} url={docUrl} filename={`DAP-document-${idx + 1}`}
                  className="flex items-center gap-2 p-2 bg-white hover:bg-violet-50 rounded border border-violet-100 text-xs transition-colors"
                  data-testid={`dap-doc-${idx}`}>
                  <File className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  <span className="flex-1 truncate text-slate-700">Document {idx + 1}</span>
                  <Download className="w-3.5 h-3.5 text-violet-400" />
                </FileLink>
              ))}
            </div>
          </div>
        )}

        {request.dap_dates?.length > 0 && (
          <div>
            <Label className="text-[10px] text-violet-500 uppercase font-bold mb-1 block">DAP Dates</Label>
            <div className="flex flex-wrap gap-1.5">
              {request.dap_dates.map((date, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] border-violet-200">{new Date(date).toLocaleDateString()}</Badge>
              ))}
            </div>
          </div>
        )}

        {dap.change_requests?.length > 0 && (
          <div>
            <Label className="text-[10px] text-violet-500 uppercase font-bold mb-1.5 block">Change Requests</Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {dap.change_requests.map((cr, idx) => (
                <div key={idx} className="p-1.5 bg-white rounded border text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{cr.requested_by} ({cr.role})</span>
                    <span className="text-slate-400">{new Date(cr.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{cr.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {canApproveDap(user?.role, dap) && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
              onClick={() => onDapAction("approve")} data-testid="dap-approve-btn">
              <CheckCircle className="w-3 h-3" /> Approve DAP
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => onDapAction("request_changes")} data-testid="dap-request-changes-btn">
              Request Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
