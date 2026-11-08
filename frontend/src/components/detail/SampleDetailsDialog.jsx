import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Truck } from "lucide-react";
import { toDateInput } from "@/lib/requestDetail";

const SAMPLE_STATUS_COLORS = {
  "Delivered": "bg-green-100 text-green-800",
  "Dispatched": "bg-purple-100 text-purple-800",
  "Picked Up": "bg-indigo-100 text-indigo-800",
  "Ready for Pickup": "bg-blue-100 text-blue-800",
};

const PICKUP_FIELDS = [
  { field: "pickup_date", label: "Pickup Date", type: "date" },
  { field: "dispatch_date", label: "Dispatch Date", type: "date" },
  { field: "dispatch_reference", label: "Reference No.", type: "text", placeholder: "e.g., AWB-12345" },
  { field: "delivery_date", label: "Delivery Date", type: "date" },
];

function Stat({ label, value, tone = "bg-slate-50", labelTone = "text-slate-500" }) {
  return (
    <div className={`p-3 ${tone} rounded-lg`}>
      <p className={`text-[10px] ${labelTone} uppercase`}>{label}</p>
      <p className="font-medium text-sm">{value || "—"}</p>
    </div>
  );
}

function ItemsTable({ title, headerTone, columns, rows }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className={headerTone}>
            <tr>{columns.map(([, label]) => <th key={label} scope="col" className="px-3 py-2 text-left">{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {columns.map(([key, label, render]) => (
                  <td key={label} className="px-3 py-2">{render ? render(row) : row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SampleDetailsDialog({ sample, canProcess, onClose, onUpdatePickup }) {
  if (!sample) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-600" />
            Sample Details - {sample.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase">Status</p>
              <Badge className={SAMPLE_STATUS_COLORS[sample.status] || "bg-slate-100 text-slate-800"}>{sample.status}</Badge>
            </div>
            <Stat label="Requested" value={toDateInput(sample.sample_requested_date) || toDateInput(sample.created_at)} />
            <Stat label="Pickup" value={sample.pickup_date} />
            <Stat label="Dispatch" value={sample.dispatch_date} />
          </div>

          {canProcess && (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Update Pickup & Dispatch Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PICKUP_FIELDS.map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <Label className="text-[10px] text-slate-600">{label}</Label>
                    <Input
                      type={type} size="sm" className="h-8" aria-label={label} placeholder={placeholder}
                      defaultValue={sample[field] || ""}
                      onBlur={(e) => {
                        // Only save when the value actually changed.
                        if (e.target.value !== (sample[field] || "")) onUpdatePickup(sample.id, { [field]: e.target.value });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Reference No." value={sample.dispatch_reference} tone="bg-indigo-50" labelTone="text-indigo-600" />
            <Stat label="Delivery Date" value={sample.delivery_date} tone="bg-green-50" labelTone="text-green-600" />
          </div>

          <ItemsTable
            title={`Requested Items (${sample.line_items?.length || 0})`}
            headerTone="bg-slate-100"
            columns={[["material_description", "Material Description"], ["number_of_samples", "No. of Samples"]]}
            rows={sample.line_items || []}
          />

          {sample.preparation_items?.length > 0 && (
            <ItemsTable
              title="Preparation Details (by User)"
              headerTone="bg-emerald-50"
              columns={[
                ["material_code", "Material Code", (r) => <span className="font-mono">{r.material_code || "—"}</span>],
                ["description", "Description"],
                ["number_of_samples", "Samples"],
                ["box_type", "Box Type"],
                ["weight", "Weight", (r) => r.weight || "—"],
              ]}
              rows={sample.preparation_items}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tentative Pickup" value={sample.tentative_pickup_date} />
            <Stat label="Gate Pass" value={sample.gate_pass_available ? "Available" : "Not Available"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
