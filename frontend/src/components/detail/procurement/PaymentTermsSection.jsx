import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removeAt, updateAt } from "@/lib/requestDetail";
import { SectionHeader } from "./SectionHeader";

const PAYMENT_CONDITIONS = [
  ["Advance with PO", "Advance with PO"],
  ["Before Dispatch", "Before Dispatch"],
  ["After Dispatch", "After Dispatch"],
  ["After Receiving", "After Receiving Material"],
  ["After Installation", "After Installation"],
  ["After Commissioning", "After Commissioning"],
];

const EMPTY_TERM = { description: "", percentage: "", condition: "", abg_required: false, pbg_required: false };

export function PaymentTermsSection({ request, onUpdate }) {
  const terms = request.payment_terms || [];
  const patchTerm = (idx, patch) => onUpdate({ payment_terms: updateAt(terms, idx, patch) });

  return (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <SectionHeader
        title="Payment Terms" active={terms.length > 0} activeDot="bg-blue-500"
        actionLabel="+ Add Term" onAction={() => onUpdate({ payment_terms: [...terms, EMPTY_TERM] })}
      />

      <div className="flex items-center gap-4 p-2 bg-white rounded border border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-slate-600">GST Applicable</Label>
          <Switch checked={request.gst_applicable || false} aria-label="GST applicable"
            onCheckedChange={(c) => onUpdate({ gst_applicable: c })} className="scale-75" />
        </div>
        {request.gst_applicable && (
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-slate-600">GST %</Label>
            <Input size="sm" type="number" className="w-20 h-7" placeholder="%" defaultValue={request.gst_percentage || ""}
              onBlur={(e) => onUpdate({ gst_percentage: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {terms.map((term, idx) => (
          <div key={idx} className="p-2 bg-white rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-600">Term {idx + 1}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" aria-label={`Remove term ${idx + 1}`}
                onClick={() => onUpdate({ payment_terms: removeAt(terms, idx) })}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input size="sm" type="number" placeholder="%" className="w-16" defaultValue={term.percentage || ""}
                onBlur={(e) => patchTerm(idx, { percentage: parseFloat(e.target.value) || 0 })} />
              <Select defaultValue={term.condition || ""} onValueChange={(v) => patchTerm(idx, { condition: v })}>
                <SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_CONDITIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input size="sm" placeholder="Description" defaultValue={term.description || ""}
                onBlur={(e) => patchTerm(idx, { description: e.target.value })} />
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              {[["abg_required", "ABG Required"], ["pbg_required", "PBG Required"]].map(([field, label]) => (
                <label key={field} className="flex items-center gap-1">
                  <input type="checkbox" checked={term[field] || false}
                    onChange={(e) => patchTerm(idx, { [field]: e.target.checked })} />
                  <span className="text-[10px] font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {terms.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">No payment terms added yet</p>}
      </div>
    </div>
  );
}
