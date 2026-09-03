"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import StrictSelect from "./StrictSelect";
import MediaUploader from "./MediaUploader";
import type { Escalation, MasterData } from "@/lib/types";

interface Props {
  master: MasterData;
  onSuccess: (record: Escalation) => void;
  onError: (message: string) => void;
}

interface FormErrors {
  city?: string;
  store?: string;
  riderId?: string;
  media?: string;
}

const EMPTY_FORM = { city: "", store: "", riderId: "" };

export default function EscalationForm({ master, onSuccess, onError }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "saving">(
    "idle"
  );

  const storeOptions = form.city ? master.storesByCity[form.city] ?? [] : [];

  function setCity(city: string) {
    // Changing City resets Store, since the store list is scoped to city.
    setForm((f) => ({ ...f, city, store: "" }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.store.trim()) next.store = "Store is required.";
    if (!form.riderId.trim()) next.riderId = "Rider ID is required.";
    if (!file) next.media = "Please attach a photo or video as evidence.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      let mediaUrl = "";
      let mediaType: "image" | "video" | "" = "";

      if (file) {
        setUploadStage("uploading");
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Upload failed.");
        }
        mediaUrl = uploadData.url;
        mediaType = uploadData.mediaType;
      }

      setUploadStage("saving");
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: form.city,
          store: form.store,
          riderId: form.riderId,
          mediaType,
          mediaUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save escalation.");
      }

      // Clear the form for the next submission.
      setForm(EMPTY_FORM);
      setFile(null);
      setErrors({});
      onSuccess(data.record as Escalation);
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the escalation. Please try again."
      );
    } finally {
      setSubmitting(false);
      setUploadStage("idle");
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
      <h2 className="mb-6 text-center text-lg font-semibold text-slate-900">
        Tech Escalation
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <StrictSelect
          label="City"
          placeholder="Select City"
          value={form.city}
          options={master.cities}
          onChange={setCity}
          error={errors.city}
        />

        <StrictSelect
          label="Store"
          placeholder="Select Store"
          value={form.store}
          options={storeOptions}
          onChange={(v) => setForm((f) => ({ ...f, store: v }))}
          error={errors.store}
          disabled={!form.city}
          disabledHint="Select a city first"
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Rider ID <span className="text-red-500">*</span>
          </label>
          <input
            value={form.riderId}
            onChange={(e) =>
              setForm((f) => ({ ...f, riderId: e.target.value }))
            }
            placeholder="Enter Rider ID"
            className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-shadowfax-green focus:outline-none focus:ring-2 focus:ring-shadowfax-green/30"
          />
          {errors.riderId && (
            <p className="mt-1 text-xs text-red-500">{errors.riderId}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Issue
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Incomplete Order
          </div>
        </div>

        <MediaUploader file={file} onFileSelected={setFile} error={errors.media} />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-shadowfax-green px-4 py-3 text-sm font-medium text-white transition hover:bg-shadowfax-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting
            ? uploadStage === "uploading"
              ? "Uploading media..."
              : "Submitting..."
            : "Submit Escalation"}
        </button>
      </form>
    </div>
  );
}
