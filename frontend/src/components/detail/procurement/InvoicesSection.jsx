import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadFile } from "@/lib/files";
import { removeAt, todayISODate, updateAt } from "@/lib/requestDetail";
import { FileLink } from "@/components/detail/FileLink";
import { SectionHeader } from "./SectionHeader";

const newInvoice = () => ({
  invoice_number: "", invoice_date: todayISODate(), amount: "", gst_number: "", supplier_name: "",
  file_url: null, file_name: null, uploaded_at: new Date().toISOString(),
});

function InvoiceField({ label, ...inputProps }) {
  return (
    <div>
      <Label className="text-[9px] text-slate-500">{label}</Label>
      <Input size="sm" aria-label={label} {...inputProps} />
    </div>
  );
}

export function InvoicesSection({ request, onUpdate }) {
  const invoices = request.invoices || [];
  const patchInvoice = (idx, patch) => onUpdate({ invoices: updateAt(invoices, idx, patch) });

  const uploadInvoice = async (idx, file) => {
    if (!file) return;
    try {
      const data = await uploadFile(file, { document_type: "invoice" });
      patchInvoice(idx, { file_url: data.url, file_name: file.name });
      toast.success("Invoice uploaded");
    } catch {
      toast.error("Failed to upload invoice");
    }
  };

  return (
    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <SectionHeader
        title="Invoices" active={invoices.length > 0} count={invoices.length}
        actionLabel="+ Add Invoice" onAction={() => onUpdate({ invoices: [...invoices, newInvoice()] })}
      />
      <div className="space-y-3">
        {invoices.map((invoice, idx) => (
          <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-600">Invoice {idx + 1}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" aria-label={`Remove invoice ${idx + 1}`}
                onClick={() => onUpdate({ invoices: removeAt(invoices, idx) })}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InvoiceField label="Supplier Name" placeholder="Supplier Name" defaultValue={invoice.supplier_name || ""}
                onBlur={(e) => patchInvoice(idx, { supplier_name: e.target.value })} />
              <InvoiceField label="GST Number" placeholder="GST123456789" defaultValue={invoice.gst_number || ""}
                onBlur={(e) => patchInvoice(idx, { gst_number: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <InvoiceField label="Invoice Number" placeholder="INV-001" defaultValue={invoice.invoice_number || ""}
                onBlur={(e) => patchInvoice(idx, { invoice_number: e.target.value })} />
              <InvoiceField label="Invoice Date" type="date" defaultValue={invoice.invoice_date || ""}
                onBlur={(e) => patchInvoice(idx, { invoice_date: e.target.value })} />
              <InvoiceField label="Amount (₹)" type="number" placeholder="0.00" defaultValue={invoice.amount || ""}
                onBlur={(e) => patchInvoice(idx, { amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-[9px] text-slate-500">Invoice Document</Label>
              {invoice.file_url ? (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <FileLink url={invoice.file_url} filename={invoice.file_name}
                    className="text-[10px] text-indigo-600 hover:underline truncate flex-1">
                    📄 {invoice.file_name || "Invoice Document"}
                  </FileLink>
                  <Button size="sm" variant="ghost" className="h-5 px-1 text-red-500 text-[9px]"
                    onClick={() => patchInvoice(idx, { file_url: null, file_name: null })}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-7 text-[9px]" aria-label="Upload invoice"
                  onChange={(e) => uploadInvoice(idx, e.target.files[0])} />
              )}
            </div>
          </div>
        ))}
        {invoices.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">No invoices added yet</p>}
      </div>
    </div>
  );
}
