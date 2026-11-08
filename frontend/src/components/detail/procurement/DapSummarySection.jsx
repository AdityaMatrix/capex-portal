import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, File, RefreshCw, Upload } from "lucide-react";
import { canApproveDap, removeAt, todayISODate, toDateInput } from "@/lib/requestDetail";
import { FileLink } from "@/components/detail/FileLink";

/** DAP block inside the procurement card (only for requests that need a DAP). */
export function DapSummarySection({ request, dap, user, canProcess, onUpdate, onCreateDap, onDapAction }) {
  const dapDates = request.dap_dates || [];
  const dotColor = dap?.status === "Approved" ? "bg-emerald-500" : dap ? "bg-amber-500" : "bg-slate-300";

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">DAP</span>
        </div>
        {dap && (
          <Badge className={dap.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{dap.status}</Badge>
        )}
      </div>

      {!dap && (canProcess ? (
        <Button size="sm" variant="outline" className="h-8" onClick={onCreateDap}>
          <Upload className="w-3 h-3 mr-1" />
          Create DAP
        </Button>
      ) : (
        <p className="text-slate-500">Awaiting DAP creation</p>
      ))}

      {dap && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>User: <Badge variant="secondary" className="ml-1">{dap.user_approval_status}</Badge></span>
            <span>Dept Head: <Badge variant="secondary" className="ml-1">{dap.dept_head_approval_status}</Badge></span>
          </div>

          {dap.documents?.length > 0 && (
            <div className="mt-2 p-2 bg-white rounded border border-slate-200">
              <Label className="text-[10px] text-slate-500 font-medium mb-1 block">DAP Documents</Label>
              <div className="space-y-1">
                {dap.documents.map((docUrl, idx) => (
                  <FileLink key={idx} url={docUrl} filename={`DAP-document-${idx + 1}`}
                    className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-xs transition-colors">
                    <File className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                    <span className="flex-1 truncate text-slate-700">Document {idx + 1}</span>
                    <Download className="w-3 h-3 text-slate-400" />
                  </FileLink>
                ))}
              </div>
            </div>
          )}

          {canApproveDap(user?.role, dap) && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-7 text-xs bg-emerald-600" onClick={() => onDapAction("approve")}>Approve</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onDapAction("request_changes")}>Request Changes</Button>
            </div>
          )}

          {canProcess && (
            <div className="mt-2 p-2 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] text-slate-500 font-medium">DAP Dates</Label>
                <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px]"
                  onClick={() => onUpdate({ dap_dates: [...dapDates, todayISODate()] })}>
                  + Add Date
                </Button>
              </div>
              <div className="space-y-1">
                {dapDates.map((date, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input type="date" size="sm" className="h-7 text-xs flex-1" aria-label={`DAP date ${idx + 1}`}
                      value={toDateInput(date)}
                      onChange={(e) => {
                        const next = [...dapDates];
                        next[idx] = e.target.value;
                        onUpdate({ dap_dates: next });
                      }} />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      aria-label={`Remove DAP date ${idx + 1}`}
                      onClick={() => onUpdate({ dap_dates: removeAt(dapDates, idx) })}>
                      ×
                    </Button>
                  </div>
                ))}
                {dapDates.length === 0 && <p className="text-[10px] text-slate-400">No DAP dates added</p>}
              </div>
            </div>
          )}

          {dap.change_requests?.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
              <Label className="text-[10px] text-amber-700 font-medium mb-2 block">
                Re-correction History ({dap.change_requests.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {dap.change_requests.map((changeReq, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-amber-100 text-[10px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-amber-800">{changeReq.role}</span>
                      <span className="text-slate-500">{toDateInput(changeReq.timestamp)}</span>
                    </div>
                    <p className="text-slate-600">{changeReq.comment}</p>
                    {changeReq.change_type && <Badge className="mt-1 bg-amber-100 text-amber-700 text-[8px]">{changeReq.change_type}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {dap.version > 1 && (
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              <span>Version {dap.version} - Revised {dap.version - 1} time(s)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
