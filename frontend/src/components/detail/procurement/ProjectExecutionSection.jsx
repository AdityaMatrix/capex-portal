import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { uploadFile } from "@/lib/files";
import { getCompletionVariance, getDeliveryTimeliness, removeAt, toDateInput, updateAt } from "@/lib/requestDetail";
import { FileLink } from "@/components/detail/FileLink";

// "blank" is the Select sentinel for clearing a status back to null.
const BLANK = "blank";
const orNull = (v) => (v === BLANK ? null : v);

function DateInput({ label, field, request, onUpdate, required }) {
  return (
    <div>
      <Label className="text-[9px] text-slate-500 mb-0.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input type="date" size="sm" aria-label={label} data-testid={field.replace(/_/g, "-")}
        defaultValue={toDateInput(request[field])}
        onBlur={(e) => onUpdate({ [field]: e.target.value })} />
    </div>
  );
}

function StatusSelect({ value, placeholder, options, onChange, testId }) {
  return (
    <Select defaultValue={value || ""} onValueChange={onChange}>
      <SelectTrigger className="h-9" data-testid={testId}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={BLANK}>-- Blank --</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Pill({ good, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
      good ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {children}
    </span>
  );
}

function DocumentList({ label, field, documentType, request, onUpdate }) {
  const docs = request[field] || [];
  const patchDoc = (idx, patch) => onUpdate({ [field]: updateAt(docs, idx, patch) });

  const upload = async (idx, file) => {
    if (!file) return;
    try {
      const data = await uploadFile(file, { document_type: documentType });
      patchDoc(idx, { file_url: data.url, file_name: file.name });
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-[9px] text-slate-600 font-medium">{label}</Label>
        <Button size="sm" variant="ghost" className="h-4 px-1 text-[8px]"
          onClick={() => onUpdate({ [field]: [...docs, { title: "", file_url: null, file_name: null, uploaded_at: new Date().toISOString() }] })}>
          + Add
        </Button>
      </div>
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center gap-1 p-1.5 bg-white rounded border border-slate-200 mb-1">
          <Input size="sm" placeholder="Title" aria-label={`${label} title`} className="flex-1 h-6 text-[9px]" defaultValue={doc.title || ""}
            onBlur={(e) => patchDoc(idx, { title: e.target.value })} />
          {doc.file_url ? (
            <FileLink url={doc.file_url} filename={doc.file_name} className="text-[8px] text-indigo-600">View</FileLink>
          ) : (
            <Input type="file" aria-label={`Upload ${label}`} className="w-24 h-5 text-[7px]" onChange={(e) => upload(idx, e.target.files[0])} />
          )}
          <Button size="sm" variant="ghost" className="h-4 w-4 p-0 text-red-400 text-[9px]" aria-label="Remove document"
            onClick={() => onUpdate({ [field]: removeAt(docs, idx) })}>×</Button>
        </div>
      ))}
      {docs.length === 0 && <p className="text-[8px] text-slate-400">No docs</p>}
    </div>
  );
}

/** Planning dates, PDI, delivery and installation/commissioning (buyers only). */
export function ProjectExecutionSection({ request, onUpdate }) {
  const completionVariance = getCompletionVariance(request);
  const delivery = getDeliveryTimeliness(request.expected_delivery_date, request.delivery_date);
  const dateProps = { request, onUpdate };

  return (
    <>
      <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200" data-testid="project-planning-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">Project Planning & Timeline</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div>
            <Label className="text-[9px] text-slate-500 mb-0.5 block">Priority Level <span className="text-red-500">*</span></Label>
            <Select defaultValue={request.priority_level || "Medium"} onValueChange={(v) => onUpdate({ priority_level: v })}>
              <SelectTrigger className="h-9" data-testid="priority-level"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DateInput label="Planned Start" field="planned_start_date" required {...dateProps} />
          <DateInput label="Planned Completion" field="planned_completion_date" required {...dateProps} />
          <DateInput label="Actual Completion" field="actual_completion_date" {...dateProps} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <DateInput label="Manufacturing Start" field="manufacturing_start_date" {...dateProps} />
          <DateInput label="Manufacturing End" field="manufacturing_end_date" {...dateProps} />
          <DateInput label="Dispatch Date" field="dispatch_date" {...dateProps} />
          <DateInput label="Closure Date" field="closure_date" {...dateProps} />
        </div>
        {completionVariance !== null && (
          <div className="mt-2 text-[10px]">
            {completionVariance <= 0 ? (
              <Pill good>Completed on time {completionVariance < 0 ? `(${Math.abs(completionVariance)}d early)` : ""}</Pill>
            ) : (
              <Pill good={false}>Project completed {completionVariance} day(s) late</Pill>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${request.pdi_status ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">PDI</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" size="sm" aria-label="PDI date" defaultValue={toDateInput(request.pdi_date)}
            onBlur={(e) => onUpdate({ pdi_date: e.target.value })} />
          <StatusSelect value={request.pdi_status} placeholder="PDI Status"
            options={["Scheduled", "Completed", "Issues Found"]}
            onChange={(v) => onUpdate({ pdi_status: orNull(v) })} />
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${request.delivery_status ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">Delivery</span>
          {request.po_number && !request.expected_delivery_date && (
            <span className="text-[9px] text-red-600 font-medium ml-1">* Expected date required</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <DateInput label="Expected Delivery" field="expected_delivery_date" required {...dateProps} />
          <div>
            <Label className="text-[9px] text-slate-500 mb-0.5 block">Actual Delivery</Label>
            <Input type="date" size="sm" aria-label="Actual delivery" data-testid="actual-delivery-date"
              defaultValue={toDateInput(request.delivery_date)}
              onBlur={(e) => onUpdate({ delivery_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-[9px] text-slate-500 mb-0.5 block">Status</Label>
            <StatusSelect value={request.delivery_status} placeholder="Delivery Status" testId="delivery-status"
              options={["Yet to Dispatch", "Dispatched", "Delivery Schedule", "Delivered"]}
              onChange={(v) => onUpdate({ delivery_status: orNull(v) })} />
          </div>
        </div>
        {delivery && (
          <div className="mt-2 text-[10px]">
            {delivery.onTime ? <Pill good>On-Time Delivery</Pill> : <Pill good={false}>Delayed by {delivery.daysLate} day(s)</Pill>}
          </div>
        )}
      </div>

      <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${request.commissioning_status === "Completed" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">Installation & Commissioning</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <DateInput label="Expected Installation" field="expected_installation_date" required {...dateProps} />
          <DateInput label="Expected Commissioning" field="expected_commissioning_date" required {...dateProps} />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <DateInput label="Installation Date" field="installation_date" {...dateProps} />
          <DateInput label="Commissioning Date" field="commissioning_date" {...dateProps} />
          <div>
            <Label className="text-[9px] text-slate-500 mb-0.5 block">Status</Label>
            {/* Completing commissioning also closes the request. */}
            <StatusSelect value={request.commissioning_status} placeholder="Status"
              options={["In Progress", "Completed"]}
              onChange={(v) => onUpdate({ commissioning_status: orNull(v), status: v === "Completed" ? "Completed" : request.status })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200/50">
          <DocumentList label="Installation Docs" field="installation_documents" documentType="installation" {...dateProps} />
          <DocumentList label="Commissioning Docs" field="commissioning_documents" documentType="commissioning" {...dateProps} />
        </div>
      </div>
    </>
  );
}
