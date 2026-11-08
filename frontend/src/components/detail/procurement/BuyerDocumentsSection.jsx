import { Label } from "@/components/ui/label";
import { Download, File, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";
import { downloadAuthenticatedFile, uploadFile } from "@/lib/files";

/** Free-form documents a buyer attaches to the request. */
export function BuyerDocumentsSection({ request, onUpdate }) {
  const attachments = request.buyer_attachments || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await uploadFile(file, { document_type: "buyer_document" });
      await onUpdate({
        buyer_attachments: [
          ...attachments,
          { file_id: data.file_id, filename: file.name, type: "buyer_document", uploaded_at: new Date().toISOString() },
        ],
      });
    } catch {
      toast.error("Failed to upload document");
    } finally {
      e.target.value = ""; // allow re-uploading the same file
    }
  };

  const handleDownload = async (att) => {
    try {
      await downloadAuthenticatedFile(`${API}/files/${att.file_id}/download`, att.filename);
    } catch {
      toast.error("Failed to download file");
    }
  };

  return (
    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs text-emerald-700 font-semibold flex items-center gap-2">
          <FileText className="w-3 h-3" />
          Uploaded by Buyer
        </Label>
        <label className="cursor-pointer">
          <input type="file" className="sr-only" onChange={handleUpload} data-testid="buyer-upload-input" />
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] hover:bg-emerald-200 transition-colors">
            <Upload className="w-3 h-3" />
            Upload
          </span>
        </label>
      </div>
      {attachments.length > 0 ? (
        <div className="space-y-1">
          {attachments.map((att, idx) => (
            <button
              key={att.file_id || idx}
              type="button"
              onClick={() => handleDownload(att)}
              className="flex items-center gap-2 p-1.5 bg-white hover:bg-emerald-100 rounded text-xs transition-colors text-left w-full"
            >
              <File className="w-3 h-3 text-emerald-500" />
              <span className="truncate flex-1 text-slate-700">{att.filename}</span>
              <Download className="w-3 h-3 text-emerald-400" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-emerald-600">No documents uploaded</p>
      )}
    </div>
  );
}
