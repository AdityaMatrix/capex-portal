import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, Loader2, RefreshCw, Trash2, XCircle } from "lucide-react";
import { DEFAULT_STATUS_COLOR, STATUS_COLORS, formatDate } from "@/lib/requestDetail";

export function RequestHeader({
  request, isRefreshing, isSubmitting, canApprove,
  onBack, onRefresh, onDelete, onApprove, onReject,
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const confirmReject = async () => {
    const ok = await onReject(rejectReason);
    if (ok) {
      setRejectOpen(false);
      setRejectReason("");
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back to dashboard" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-['Outfit']">{request.id}</h1>
            <Badge className={STATUS_COLORS[request.status] || DEFAULT_STATUS_COLOR}>{request.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">by {request.user_name} • {formatDate(request.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} data-testid="refresh-btn">
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm" variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={isSubmitting} data-testid="delete-btn"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this request? This action cannot be undone and will also
                delete all related comments, sample requests, and DAP documents.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={onDelete} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Delete Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {canApprove && (
          <>
            <Button
              size="sm" onClick={onApprove} disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700" data-testid="approve-btn"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isSubmitting} data-testid="reject-btn">
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Request</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Rejection reason..."
                  aria-label="Rejection reason"
                  className="min-h-[80px]"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    variant="destructive" onClick={confirmReject}
                    disabled={isSubmitting || !rejectReason.trim()}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
