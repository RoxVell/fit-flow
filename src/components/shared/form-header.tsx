import { ArrowLeft, Check } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";

interface FormHeaderProps {
  title: string;
  saveLabel: string;
  disabled: boolean;
  onSave: () => void;
  onBack: () => void;
}

export function FormHeader({ title, saveLabel, disabled, onSave, onBack }: FormHeaderProps) {
  const t = useT();
  return (
    <div className="flex items-center justify-between border-b bg-background/60 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors active:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.programs.back}
      </button>
      <h1 className="text-base font-semibold">{title}</h1>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors disabled:text-muted-foreground/30"
      >
        <Check className="h-4 w-4" />
        {saveLabel}
      </button>
    </div>
  );
}
