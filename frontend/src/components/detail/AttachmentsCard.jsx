import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Download, File, FileText } from "lucide-react";
import { API } from "@/lib/api";
import { FileLink } from "@/components/detail/FileLink";

const ATTACHMENT_GROUPS = [
  { type: "business_case", label: "Business Case" },
  { type: "justification", label: "Justification" },
  { type: "quotation", label: "Quotations" },
];

/** Documents the requester attached when raising the request, grouped by type. */
export function AttachmentsCard({ attachments }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Attachments (Request Documents)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ATTACHMENT_GROUPS.map(({ type, label }) => {
            const files = attachments.filter((a) => a.type === type);
            return (
              <div key={type} className="space-y-2">
                <Label className="text-xs text-slate-500 font-medium">{label}</Label>
                {files.length > 0 ? (
                  files.map((att) => (
                    <FileLink
                      key={att.id}
                      url={`${API}/files/${att.id}/download`}
                      filename={att.filename}
                      className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded text-xs transition-colors"
                    >
                      <File className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="flex-1 truncate text-slate-700" title={att.filename}>{att.filename}</span>
                      <Download className="w-3 h-3 text-slate-400" />
                    </FileLink>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 p-2">No documents</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
