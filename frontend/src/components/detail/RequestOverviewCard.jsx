import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { getItemPipelineStatus, toDateInput } from "@/lib/requestDetail";

const ASSET_CATEGORY_LABELS = { plant_machinery: "Plant & Machinery", building: "Building" };

const approvedBadge = (status) =>
  status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

function InfoTile({ label, children, tone = "slate" }) {
  const tones = {
    slate: ["bg-slate-50", "text-slate-500"],
    indigo: ["bg-indigo-50", "text-indigo-600"],
    blue: ["bg-blue-50", "text-blue-600"],
    purple: ["bg-purple-50", "text-purple-600"],
  };
  const [bg, labelColor] = tones[tone];
  return (
    <div className={`p-2 ${bg} rounded`}>
      <Label className={`text-[10px] ${labelColor} uppercase`}>{label}</Label>
      {children}
    </div>
  );
}

function StagePill({ label, status, number }) {
  const tone = status === "Approved"
    ? "bg-emerald-100 text-emerald-700"
    : status ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400";
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-medium ${tone}`}>
      {status === "Approved" && <Check className="w-2.5 h-2.5" />}
      {label} {number ? `(${number})` : ""}
    </div>
  );
}

function RequirementItemCard({ item, index, request, isMultiItem, isSelected, onSelect }) {
  const status = getItemPipelineStatus(item, request);
  return (
    <div
      className={`rounded-lg border transition-all overflow-hidden ${isMultiItem ? "cursor-pointer" : ""} ${
        isSelected ? "border-indigo-400 shadow-md ring-1 ring-indigo-200" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
      onClick={() => isMultiItem && onSelect(index)}
      data-testid={`item-card-${index}`}
    >
      <div className={`px-3 py-2 flex items-center justify-between ${isSelected ? "bg-indigo-50" : "bg-slate-50/50"}`}>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
            isSelected ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-600"
          }`}>{index + 1}</span>
          <span className={`font-medium text-xs ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>{item.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-mono">Qty: {item.quantity}</Badge>
          {isSelected && <Badge className="bg-indigo-500 text-white text-[8px]">Selected</Badge>}
        </div>
      </div>
      <div className="px-3 py-2 flex items-center gap-1">
        {request.cea_required && (
          <>
            <StagePill label="CEA" status={status.cea} number={item.cea_number} />
            <span className="text-slate-300 text-[8px]">→</span>
          </>
        )}
        <StagePill label="PR" status={status.pr} number={item.pr_number} />
        <span className="text-slate-300 text-[8px]">→</span>
        <StagePill label="PO" status={status.po} number={item.po_number} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="text-slate-500 block">{label}</span>
      {children}
    </div>
  );
}

function SelectedRequirementDetails({ item, index, total }) {
  if (!item) return null;
  const dates = [
    ["CEA Created", item.cea_created_date, false],
    ["CEA Approved", item.cea_approved_date, true],
    ["PR Created", item.pr_created_date, false],
    ["PR Approved", item.pr_approved_date, true],
    ["PO Created", item.po_created_date, false],
    ["PO Approved", item.po_approved_date, true],
  ].filter(([, value]) => value);

  return (
    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-2">
        Selected Requirement Details (Item {index + 1} of {total})
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Field label="Description"><span className="font-medium text-slate-800">{item.description}</span></Field>
          <Field label="Quantity"><span className="font-medium text-slate-800">{item.quantity}</span></Field>
          {item.cea_number && <Field label="CEA No."><span className="font-mono font-medium text-blue-700">{item.cea_number}</span></Field>}
          {item.cea_status && <Field label="CEA Status"><Badge className={`text-[10px] ${approvedBadge(item.cea_status)}`}>{item.cea_status}</Badge></Field>}
        </div>
        {(item.cea_created_date || item.cea_approved_date || item.pr_number || item.po_number) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 border-t border-indigo-100">
            {item.pr_number && <Field label="PR Number"><span className="font-mono font-medium text-violet-700">{item.pr_number}</span></Field>}
            {item.pr_status && <Field label="PR Status"><Badge className={`text-[10px] ${approvedBadge(item.pr_status)}`}>{item.pr_status}</Badge></Field>}
            {item.po_number && <Field label="PO Number"><span className="font-mono font-medium text-purple-700">{item.po_number}</span></Field>}
            {item.po_status && <Field label="PO Status"><Badge className={`text-[10px] ${approvedBadge(item.po_status)}`}>{item.po_status}</Badge></Field>}
          </div>
        )}
        {dates.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px] pt-1 border-t border-indigo-100">
            {dates.map(([label, value, isApproval]) => (
              <div key={label}>
                <span className="text-slate-400 block">{label}</span>
                <span className={`font-medium ${isApproval ? "text-emerald-600" : ""}`}>{toDateInput(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DhApprovalBanner({ request, hasAccess }) {
  const canSee = hasAccess("capex_request", "dh_approval");
  return (
    <>
      {canSee && request.status === "Pending DH Approval" && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200" data-testid="dh-pending-banner">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-xs text-amber-800">Pending Department Head Approval</span>
          </div>
          <p className="text-[10px] text-amber-600 mt-1">This request needs to be approved by the Department Head before it can be processed by buyers.</p>
        </div>
      )}
      {canSee && request.status === "Rejected by DH" && (
        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200" data-testid="dh-rejected-banner">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold text-xs text-rose-800">Rejected by Department Head</span>
          </div>
          {request.dh_rejection_reason && <p className="text-[10px] text-rose-600 mt-1">Reason: {request.dh_rejection_reason}</p>}
        </div>
      )}
      {request.dh_approval_status === "Approved" && (
        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2" data-testid="dh-approved-badge">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] text-emerald-700 font-medium">
            DH Approved {request.dh_approved_at ? `on ${new Date(request.dh_approved_at).toLocaleDateString()}` : ""}
          </span>
        </div>
      )}
    </>
  );
}

const truncate = (text, length) => (text?.length > length ? `${text.substring(0, length)}...` : text);

export function RequestOverviewCard({ request, hasAccess, selectedIndex, onSelectIndex }) {
  const items = request.requirement_items || [];
  const isMultiItem = items.length > 1;

  return (
    <Card className="border-2 border-slate-200 shadow-md">
      <CardHeader className="py-3 bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          Request Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoTile label="Plant"><p className="font-medium">{request.plant}</p></InfoTile>
          <InfoTile label="Department"><p className="font-medium">{request.department}</p></InfoTile>
          <InfoTile label="Type"><p className="font-medium">{request.requirement_type || "—"}</p></InfoTile>
          <InfoTile label="Asset Category" tone="indigo">
            <p className="font-medium text-indigo-700">{ASSET_CATEGORY_LABELS[request.asset_category] || "—"}</p>
          </InfoTile>
          <InfoTile label="CEA Required">
            <p className={`font-medium ${request.cea_required ? "text-emerald-600" : "text-slate-500"}`}>{request.cea_required ? "Yes" : "No"}</p>
          </InfoTile>
          <InfoTile label="DAP Required">
            <p className={`font-medium ${request.dap_required ? "text-emerald-600" : "text-slate-500"}`}>{request.dap_required ? "Yes" : "No"}</p>
          </InfoTile>
        </div>

        <DhApprovalBanner request={request} hasAccess={hasAccess} />

        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="PR Available" tone="blue">
            <p className={`font-medium ${request.pr_available ? "text-blue-700" : "text-slate-500"}`}>
              {request.pr_available ? `Yes (${request.pr_number || "No Number"})` : "No"}
            </p>
          </InfoTile>
          <InfoTile label="Vendor" tone="purple">
            <p className="font-medium text-purple-700">
              {request.vendor_name ? `${request.vendor_name} ${request.vendor_code ? `(${request.vendor_code})` : ""}` : "—"}
            </p>
          </InfoTile>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-slate-500">Requirements</Label>
            {isMultiItem && (
              <Select value={String(selectedIndex)} onValueChange={(v) => onSelectIndex(parseInt(v, 10))}>
                <SelectTrigger className="w-56 h-7 text-[10px]" aria-label="Select requirement" data-testid="pr-requirement-dropdown">
                  <SelectValue placeholder="Select Requirement" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item, idx) => (
                    <SelectItem key={idx} value={String(idx)} className="text-[10px]">
                      {truncate(item.description, 25)}
                      {item.pr_number ? ` (PR: ${item.pr_number})` : " (No PR)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {items.length > 0 ? (
            <div className="mt-2 space-y-2">
              {items.map((item, index) => (
                <RequirementItemCard
                  key={index}
                  item={item}
                  index={index}
                  request={request}
                  isMultiItem={isMultiItem}
                  isSelected={isMultiItem && index === selectedIndex}
                  onSelect={onSelectIndex}
                />
              ))}
            </div>
          ) : (
            <p className="mt-1 text-slate-700">{request.requirement_description}</p>
          )}

          {isMultiItem && (
            <SelectedRequirementDetails item={items[selectedIndex]} index={selectedIndex} total={items.length} />
          )}
        </div>

        {request.justification && (
          <div>
            <Label className="text-xs text-slate-500">Justification</Label>
            <p className="mt-1 text-slate-700">{request.justification}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
