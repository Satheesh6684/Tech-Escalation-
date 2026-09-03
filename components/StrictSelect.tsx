"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrictSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  disabledHint?: string;
}

/**
 * Typeahead select limited to `options` — start typing directly in the
 * field and matching entries (e.g. hub/store names) filter live. There is
 * no way to type and commit a value that isn't in `options`, which is
 * what keeps City/Store locked to the standard master data pulled from
 * Google Sheets.
 */
export default function StrictSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  disabled = false,
  disabledHint,
}: StrictSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // While closed, the field just displays the committed value.
  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Disabling mid-interaction (e.g. City cleared while Store was open)
  // should close the dropdown rather than leave it dangling.
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function select(v: string) {
    onChange(v);
    setQuery(v);
    setOpen(false);
  }

  function handleFocus() {
    if (disabled) return;
    setOpen(true);
    setQuery(""); // start every open with the full list; typing narrows it
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>

      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition",
          disabled
            ? "cursor-not-allowed border-surface-border bg-slate-50"
            : "focus-within:ring-2 focus-within:ring-shadowfax-green/30",
          error
            ? "border-red-400"
            : "border-surface-border focus-within:border-shadowfax-green"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          disabled={disabled}
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={disabled ? disabledHint || placeholder : placeholder}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
        />
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && !disabled && (
        <div className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-surface-border bg-white p-1 shadow-elevated animate-fade-in">
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-sm text-slate-400">
              No matches found.
            </p>
          )}
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => select(opt)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-shadowfax-green-light"
            >
              <span className="truncate">{opt}</span>
              {opt === value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-shadowfax-green" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
