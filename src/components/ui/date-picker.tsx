"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { enUS, ru } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/exercises/types";

const DATE_FNS_LOCALE: Record<Locale, DateFnsLocale> = {
  en: enUS,
  ru,
};

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  locale: Locale;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  locale,
  placeholder,
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const dateFnsLocale = DATE_FNS_LOCALE[locale];
  const label = value.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border-0 bg-muted/50 px-3 text-sm font-normal transition-colors hover:bg-muted/70 disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span>{value ? label : placeholder}</span>
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              onChange(date);
              setOpen(false);
            }
          }}
          locale={dateFnsLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
