import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { CEA_APPROVAL_STAGES, NONE_VALUE, getStageFields, toDateInput } from "@/lib/requestDetail";

// Visual style of a stage block: locked (previous stage not approved),
// approved, or in progress (stage-specific accent colour).
const STAGE_TONES = {
  amber: { box: "bg-amber-50 border-amber-200", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  blue: { box: "bg-blue-50 border-blue-200", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  purple: { box: "bg-purple-50 border-purple-200", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 border-purple-200" },
};
const APPROVED_TONE = { box: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" };

function StageBlock({ title, status, number, tone, locked, lockedLabel, badges, children }) {
  const isApproved = status === "Approved";
  const style = isApproved ? APPROVED_TONE : STAGE_TONES[tone];
  // CEA has no "not started" grey dot: it is amber until approved.
  const dot = isApproved ? style.dot : number || tone === "amber" ? style.dot : "bg-slate-300";

  return (
    <div className={`p-3 rounded-lg border-2 transition-all ${locked ? "bg-slate-100 border-slate-200 opacity-60" : style.box}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <span className="font-semibold text-xs uppercase tracking-wide text-slate-700">{title}</span>
          {badges}
          {locked && <Badge className="text-[9px] bg-slate-200 text-slate-500">{lockedLabel}</Badge>}
        </div>
        {status && <Badge className={`text-[9px] ${style.badge}`}>{status}</Badge>}
      </div>
      {children}
    </div>
  );
}

function StatusSelect({ value, stages, onChange, testId, label }) {
  return (
    <div>
      <Label className="text-[10px] text-slate-500 mb-1 block">{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-9" data-testid={testId}>
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Select...</SelectItem>
          {stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-[10px] text-slate-500 mb-1 block">{label}</Label>
      <Input type="date" size="sm" value={toDateInput(value)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ReadOnlyNumber({ value }) {
  return (
    <div className="h-9 flex items-center px-3 bg-slate-100 rounded-md border">
      <span className="font-mono font-semibold text-emerald-600">{value}</span>
    </div>
  );
}

function ReadOnlyLine({ label, value }) {
  return (
    <div className="space-y-1 text-xs">
      <span className="text-slate-600">{label}: </span>
      <span className="font-mono font-semibold text-slate-800">{value || "Pending"}</span>
    </div>
  );
}

function AvailabilityToggle({ label, checked, onChange, testId, accent }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white/50 rounded">
      <Label className="text-[10px] text-slate-600">{label}</Label>
      <Switch
        checked={checked} onCheckedChange={onChange} aria-label={label}
        data-testid={testId} className={`scale-90 ${accent}`}
      />
      <span className="text-[10px] text-slate-500">{checked ? "Yes" : "No"}</span>
    </div>
  );
}

function workflowStatusColor(status) {
  if (status === "Completed") return "text-emerald-700";
  if (status?.includes("Approved")) return "text-emerald-600";
  if (status?.includes("Under") || status?.includes("Processing")) return "text-amber-600";
  return "text-slate-700";
}

/**
 * CEA -> PR -> PO pipeline. Each stage unlocks only when the previous one is
 * approved. Buyers and Capex Heads can edit; everyone else sees read-only values.
 * Multi-item requests show the stage data of the selected requirement item.
 */
export function ProcessingStatusCard({
  request, selectedItem, selectedIndex, isMultiItem, canProcess,
  prStages, poStages, onStageUpdate, onAvailabilityChange,
}) {
  const f = getStageFields(request, selectedItem, isMultiItem);
  const isExistingCea = request.cea_type === "existing";
  const ceaApprovedOrNA = !request.cea_required || f.ceaStatus === "Approved";
  const prIsApproved = f.prStatus === "Approved";
  const userProvidedPR = isMultiItem
    ? Boolean(selectedItem?.pr_available && selectedItem?.pr_number)
    : Boolean(request.pr_provided_by === "user" && f.prNumber);
  const showPrFields = userProvidedPR || f.prAvailable;
  // Inputs are uncontrolled (saved on blur); the key remounts them when the
  // selected item or saved value changes so they show fresh data.
  const inputKey = (prefix, value) => `${prefix}-${selectedIndex}-${value}`;

  return (
    <Card className="border-2 border-indigo-100 shadow-md">
      <CardHeader className="py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Package className="w-3 h-3 text-white" />
            </div>
            Processing Status
          </span>
          {isMultiItem && (
            <Badge className="text-[9px] bg-indigo-100 text-indigo-700">
              Showing for: {selectedItem?.description?.substring(0, 20)}{selectedItem?.description?.length > 20 ? "..." : ""} (PR: {selectedItem?.pr_number || "N/A"})
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm">
        <div className="space-y-4">
          {request.cea_required && (
            <StageBlock
              title={`CEA ${isExistingCea ? "(Existing)" : request.cea_type === "new" ? "(New)" : ""}`}
              status={f.ceaStatus}
              tone="amber"
              badges={isExistingCea && f.wbsNumber && (
                <Badge className="text-[9px] bg-slate-100 text-slate-600">User Provided WBS</Badge>
              )}
            >
              {canProcess ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-slate-500 mb-1 block">{isExistingCea ? "WBS No" : "CEA Number"}</Label>
                      {isExistingCea && f.wbsNumber && !isMultiItem ? (
                        <ReadOnlyNumber value={f.wbsNumber} />
                      ) : (
                        <Input
                          size="sm"
                          placeholder={isExistingCea ? "Enter WBS Number" : "Enter CEA Number"}
                          defaultValue={(isExistingCea ? f.wbsNumber : f.ceaNumber) || ""}
                          key={inputKey("cea", isExistingCea ? f.wbsNumber : f.ceaNumber)}
                          onBlur={(e) => onStageUpdate(isExistingCea ? { wbs_number: e.target.value } : { cea_number: e.target.value })}
                          data-testid="cea-number-input"
                        />
                      )}
                    </div>
                    <StatusSelect
                      label="CEA Status" value={f.ceaStatus} stages={CEA_APPROVAL_STAGES}
                      onChange={(v) => onStageUpdate({ cea_status: v })} testId="cea-status-select"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <DateField label="CEA Created Date" value={f.dates.cea_created_date} onChange={(v) => onStageUpdate({ cea_created_date: v })} />
                    <DateField label="CEA Approved Date" value={f.dates.cea_approved_date} onChange={(v) => onStageUpdate({ cea_approved_date: v })} />
                  </div>
                </div>
              ) : (
                <ReadOnlyLine label={isExistingCea ? "WBS No" : "CEA Number"} value={isExistingCea ? f.wbsNumber : f.ceaNumber} />
              )}
            </StageBlock>
          )}

          <StageBlock
            title="PR"
            status={f.prStatus}
            number={f.prNumber}
            tone="blue"
            locked={!ceaApprovedOrNA}
            lockedLabel="Locked - CEA Pending"
            badges={userProvidedPR && (
              <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">User Provided</Badge>
            )}
          >
            {canProcess && ceaApprovedOrNA ? (
              <div className="space-y-2">
                {!userProvidedPR && (
                  <AvailabilityToggle
                    label="PR Available" checked={f.prAvailable} testId="pr-toggle-buyer"
                    accent="data-[state=checked]:bg-blue-500"
                    onChange={(c) => onAvailabilityChange({ pr_available: c })}
                  />
                )}
                {showPrFields && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 mb-1 block">PR Number</Label>
                        {userProvidedPR && !isMultiItem ? (
                          <ReadOnlyNumber value={f.prNumber} />
                        ) : (
                          <Input
                            size="sm" placeholder="Enter PR Number"
                            defaultValue={f.prNumber || ""} key={inputKey("pr", f.prNumber)}
                            onBlur={(e) => onStageUpdate({ pr_number: e.target.value })}
                            data-testid="pr-number-input"
                          />
                        )}
                      </div>
                      <StatusSelect
                        label="PR Status" value={f.prStatus} stages={prStages}
                        onChange={(v) => onStageUpdate({ pr_status: v })} testId="pr-status-select"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <DateField label="PR Created Date" value={f.dates.pr_created_date} onChange={(v) => onStageUpdate({ pr_created_date: v })} />
                      <DateField label="PR Approved Date" value={f.dates.pr_approved_date} onChange={(v) => onStageUpdate({ pr_approved_date: v })} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <ReadOnlyLine label="PR Number" value={f.prNumber} />
            )}
          </StageBlock>

          <StageBlock
            title="PO"
            status={f.poStatus}
            number={f.poNumber}
            tone="purple"
            locked={!prIsApproved}
            lockedLabel="Locked - PR Pending"
          >
            {canProcess && prIsApproved ? (
              <div className="space-y-2">
                <AvailabilityToggle
                  label="PO Created" checked={f.poAvailable} testId="po-toggle-buyer"
                  accent="data-[state=checked]:bg-purple-500"
                  onChange={(c) => onAvailabilityChange({ po_available: c })}
                />
                {f.poAvailable && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 mb-1 block">PO Number</Label>
                        <Input
                          size="sm" placeholder="Enter PO Number"
                          defaultValue={f.poNumber || ""} key={inputKey("po", f.poNumber)}
                          onBlur={(e) => onStageUpdate({ po_number: e.target.value })}
                          data-testid="po-number-input"
                        />
                      </div>
                      <StatusSelect
                        label="PO Status" value={f.poStatus} stages={poStages}
                        onChange={(v) => onStageUpdate({ po_status: v })} testId="po-status-select"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <DateField label="PO Created Date" value={f.dates.po_created_date} onChange={(v) => onStageUpdate({ po_created_date: v })} />
                      <DateField label="PO Approved Date" value={f.dates.po_approved_date} onChange={(v) => onStageUpdate({ po_approved_date: v })} />
                      <DateField label="Ordered Date" value={f.dates.ordered_date} onChange={(v) => onStageUpdate({ ordered_date: v })} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <ReadOnlyLine label="PO Number" value={f.poNumber} />
            )}
          </StageBlock>

          {/* Derived on the server from the stages above; never edited directly. */}
          <div className="p-3 rounded-lg border-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-semibold text-xs uppercase tracking-wide text-slate-700">Workflow Status</span>
            </div>
            <div className="h-9 flex items-center px-3 bg-white rounded-md border border-indigo-200">
              <span className={`font-medium text-sm ${workflowStatusColor(request.workflow_status)}`}>
                {request.workflow_status || "—"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
