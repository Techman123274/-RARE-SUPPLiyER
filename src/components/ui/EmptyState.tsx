import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20",
        className
      )}
    >
      <div className="w-10 h-px bg-accent-secondary/50 mb-6" />
      <h3 className="text-xl sm:text-2xl font-display tracking-[0.12em] uppercase mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted max-w-sm leading-relaxed mb-7">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
