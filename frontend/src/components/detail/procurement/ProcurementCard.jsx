import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierQuotesSection } from "./SupplierQuotesSection";
import { PaymentTermsSection } from "./PaymentTermsSection";
import { DapSummarySection } from "./DapSummarySection";
import { InvoicesSection } from "./InvoicesSection";
import { ProjectExecutionSection } from "./ProjectExecutionSection";
import { BuyerDocumentsSection } from "./BuyerDocumentsSection";

/**
 * "Supplier & Additional Details": everything from quotes to commissioning.
 * Most sections are buyer/Capex Head only (`canProcess`); the vendor of record
 * and DAP status are visible to everyone who can see the card.
 */
export function ProcurementCard({ request, dap, user, canProcess, onUpdate, onCreateDap, onDapAction }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">Supplier & Additional Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <SupplierQuotesSection request={request} canProcess={canProcess} onUpdate={onUpdate} />
          {canProcess && <PaymentTermsSection request={request} onUpdate={onUpdate} />}
          {request.dap_required && (
            <DapSummarySection
              request={request} dap={dap} user={user} canProcess={canProcess}
              onUpdate={onUpdate} onCreateDap={onCreateDap} onDapAction={onDapAction}
            />
          )}
          {canProcess && <InvoicesSection request={request} onUpdate={onUpdate} />}
          {canProcess && <ProjectExecutionSection request={request} onUpdate={onUpdate} />}
          {canProcess && <BuyerDocumentsSection request={request} onUpdate={onUpdate} />}
        </div>
      </CardContent>
    </Card>
  );
}
