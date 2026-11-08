import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Title row shared by the procurement sections: status dot, title, optional count and add button. */
export function SectionHeader({ title, active, activeDot = "bg-emerald-500", count, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? activeDot : "bg-slate-300"}`} />
        <span className="font-medium text-xs uppercase tracking-wide text-slate-600">{title}</span>
        {count > 0 && <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">{count}</Badge>}
      </div>
      {actionLabel && (
        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
