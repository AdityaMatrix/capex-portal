import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/files";
import { placeOrderWithSupplier, removeAt, updateAt } from "@/lib/requestDetail";
import { FileLink } from "@/components/detail/FileLink";
import { SectionHeader } from "./SectionHeader";

const EMPTY_SUPPLIER = { name: "", code: "", initial_price: "", final_price: "", quote_reference: "", quote_date: "" };

/** Vendor of record (everyone) plus the competing supplier quotes (buyers only). */
export function SupplierQuotesSection({ request, canProcess, onUpdate }) {
  const suppliers = request.suppliers || [];
  const hasOrderedSupplier = suppliers.some((s) => s.is_ordered);
  const patchSupplier = (idx, patch) => onUpdate({ suppliers: updateAt(suppliers, idx, patch) });

  const placeOrder = (idx) => {
    const supplier = suppliers[idx];
    onUpdate({
      suppliers: placeOrderWithSupplier(suppliers, idx),
      vendor_name: supplier.name,
      vendor_code: supplier.code || "",
      // Copied to the request so analytics can compute savings.
      initial_price: parseFloat(supplier.initial_price) || 0,
      final_negotiated_price: parseFloat(supplier.final_price) || 0,
    });
    toast.success(`Order placed with ${supplier.name}`);
  };

  const cancelOrder = () => {
    onUpdate({
      suppliers: suppliers.map((s) => ({ ...s, is_ordered: false, ordered_date: null })),
      vendor_name: null, vendor_code: null, initial_price: null, final_negotiated_price: null,
    });
    toast.info("Order cancelled");
  };

  const uploadQuotation = async (idx, file) => {
    if (!file) return;
    try {
      const data = await uploadFile(file, { capex_request_id: request.id, document_type: "quotation" });
      patchSupplier(idx, { quotation_url: data.url, quotation_name: file.name });
    } catch {
      toast.error("Failed to upload quotation");
    }
  };

  return (
    <>
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${request.vendor_name ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium text-xs uppercase tracking-wide text-slate-600">Supplier</span>
        </div>
        {canProcess ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-slate-500 mb-1 block">Vendor Name</Label>
              <Input size="sm" placeholder="Enter Vendor Name" defaultValue={request.vendor_name || ""}
                onBlur={(e) => onUpdate({ vendor_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500 mb-1 block">Vendor Code</Label>
              <Input size="sm" placeholder="Enter Vendor Code" defaultValue={request.vendor_code || ""}
                onBlur={(e) => onUpdate({ vendor_code: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>Name: <span className="font-medium">{request.vendor_name || "Pending"}</span></span>
            <span>Code: <span className="font-medium">{request.vendor_code || "-"}</span></span>
          </div>
        )}
      </div>

      {canProcess && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <SectionHeader
            title="Price (Multiple Suppliers)"
            active={suppliers.length > 0}
            actionLabel="+ Add Supplier"
            onAction={() => onUpdate({ suppliers: [...suppliers, EMPTY_SUPPLIER] })}
          />
          <div className="space-y-3">
            {suppliers.map((supplier, idx) => (
              <div key={idx} className={`p-3 rounded-lg border-2 space-y-2 transition-all ${
                supplier.is_ordered
                  ? "bg-emerald-50 border-emerald-400"
                  : hasOrderedSupplier ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-600">Supplier {idx + 1}</span>
                    {supplier.is_ordered && <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">ORDERED ✓</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {supplier.name && !supplier.is_ordered && (
                      <Button size="sm" variant="outline"
                        className="h-6 px-2 text-[9px] bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        onClick={() => placeOrder(idx)}>
                        <Check className="w-3 h-3 mr-1" />
                        Place Order
                      </Button>
                    )}
                    {supplier.is_ordered && (
                      <Button size="sm" variant="outline"
                        className="h-6 px-2 text-[9px] bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={cancelOrder}>
                        Cancel Order
                      </Button>
                    )}
                    {!supplier.is_ordered && (
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500"
                        aria-label={`Remove supplier ${idx + 1}`}
                        onClick={() => onUpdate({ suppliers: removeAt(suppliers, idx) })}>
                        ×
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quotes are frozen once an order has been placed with any supplier. */}
                <div className="grid grid-cols-2 gap-2">
                  <Input size="sm" placeholder="Supplier Name" defaultValue={supplier.name || ""} disabled={hasOrderedSupplier}
                    onBlur={(e) => patchSupplier(idx, { name: e.target.value })} />
                  <Input size="sm" placeholder="Supplier Code" defaultValue={supplier.code || ""} disabled={hasOrderedSupplier}
                    onBlur={(e) => patchSupplier(idx, { code: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[9px] text-slate-500">Initial Price (₹)</Label>
                    <Input size="sm" type="number" placeholder="Initial Price" defaultValue={supplier.initial_price || ""} disabled={hasOrderedSupplier}
                      onBlur={(e) => patchSupplier(idx, { initial_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-[9px] text-slate-500">Final Price (₹)</Label>
                    <Input size="sm" type="number" placeholder="Final Price" defaultValue={supplier.final_price || ""} disabled={hasOrderedSupplier}
                      onBlur={(e) => patchSupplier(idx, { final_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input size="sm" placeholder="Quote Reference" defaultValue={supplier.quote_reference || ""} disabled={hasOrderedSupplier}
                    onBlur={(e) => patchSupplier(idx, { quote_reference: e.target.value })} />
                  <Input size="sm" type="date" aria-label="Quote date" defaultValue={supplier.quote_date || ""} disabled={hasOrderedSupplier}
                    onBlur={(e) => patchSupplier(idx, { quote_date: e.target.value })} />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Label className="text-[9px] text-slate-500 mb-1 block">Quotation Document</Label>
                  {supplier.quotation_url ? (
                    <div className="flex items-center gap-2 flex-1">
                      <FileLink url={supplier.quotation_url} filename={supplier.quotation_name}
                        className="text-[10px] text-indigo-600 hover:underline truncate flex-1">
                        📄 {supplier.quotation_name || "Quotation"}
                      </FileLink>
                      {!hasOrderedSupplier && (
                        <Button size="sm" variant="ghost" className="h-5 px-1 text-red-500 text-[9px]"
                          onClick={() => patchSupplier(idx, { quotation_url: null, quotation_name: null })}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="h-7 text-[9px]"
                      aria-label="Upload quotation" disabled={hasOrderedSupplier}
                      onChange={(e) => uploadQuotation(idx, e.target.files[0])} />
                  )}
                </div>

                {supplier.is_ordered && supplier.ordered_date && (
                  <div className="text-[9px] text-emerald-600 mt-1 font-medium">✓ Order placed on: {supplier.ordered_date}</div>
                )}
              </div>
            ))}
            {suppliers.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">No suppliers added yet</p>}
          </div>
        </div>
      )}
    </>
  );
}
