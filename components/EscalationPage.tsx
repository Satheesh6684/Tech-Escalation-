"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import Header from "./Header";
import EscalationForm from "./EscalationForm";
import ToastContainer, { ToastItem } from "./Toast";
import type { Escalation, MasterData } from "@/lib/types";

let toastCounter = 0;

const EMPTY_MASTER: MasterData = { cities: [], storesByCity: {} };

export default function EscalationPage() {
  const [master, setMaster] = useState<MasterData>(EMPTY_MASTER);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((type: ToastItem["type"], message: string) => {
    const id = ++toastCounter;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const loadMaster = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/master", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load City/Store data.");
      setMaster(data as MasterData);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading City/Store options. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaster();
  }, [loadMaster]);

  function handleSuccess(_record: Escalation) {
    pushToast("success", "Escalation submitted successfully");
  }

  function handleError(message: string) {
    pushToast("error", message);
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      <Header />

      <main className="mx-auto flex max-w-3xl justify-center px-4 py-10 sm:py-14">
        {loading && (
          <div className="flex w-full max-w-lg flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-white p-10 shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-shadowfax-green" />
            <p className="text-sm text-slate-500">Loading form...</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-card">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium text-red-700">
              Couldn&rsquo;t load City/Store options
            </p>
            <p className="text-xs leading-relaxed text-red-600">{loadError}</p>
            <button
              onClick={loadMaster}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <EscalationForm
            master={master}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
