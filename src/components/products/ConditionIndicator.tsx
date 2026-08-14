import { PRODUCT_CONDITIONS, type ProductCondition } from "@/lib/types";
import { conditionFallback, conditionIndex } from "@/lib/condition";
import { cn } from "@/lib/utils";

interface ConditionIndicatorProps {
  condition: ProductCondition;
  details?: string;
  className?: string;
}

export function ConditionIndicator({
  condition,
  details,
  className,
}: ConditionIndicatorProps) {
  const active = conditionIndex(condition);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.15em] font-medium uppercase">Condition</span>
        <span className="text-xs font-mono tracking-wider">{condition.toUpperCase()}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {PRODUCT_CONDITIONS.map((item, i) => (
          <span
            key={item}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= active ? "bg-accent-secondary" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-sm text-muted leading-relaxed">
        {details || conditionFallback(condition)}
      </p>
    </div>
  );
}
