"use client";

import { useRef, useState } from "react";
import { FileVideo2, ImageIcon, Upload, X } from "lucide-react";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  isImageMime,
  isVideoMime,
} from "@/lib/utils";

interface Props {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  error?: string;
}

export default function MediaUploader({ file, onFileSelected, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string>("");

  const previewUrl = file ? URL.createObjectURL(file) : null;

  function handleFiles(fileList: FileList | null) {
    setLocalError("");
    const selected = fileList?.[0];
    if (!selected) return;

    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setLocalError(
        "Unsupported file type. Please upload JPG, PNG, WEBP, MP4, or MOV."
      );
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setLocalError("File is too large. Maximum size is 50 MB.");
      return;
    }
    onFileSelected(selected);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Photo / Video <span className="text-red-500">*</span>
      </label>

      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border bg-slate-50/50 px-4 py-8 text-center transition hover:border-shadowfax-green hover:bg-shadowfax-green-light/40"
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            + Upload Photo or Video
          </span>
          <span className="text-xs text-slate-400">
            JPG, PNG, WEBP, MP4, MOV — up to 50MB
          </span>
        </button>
      )}

      {file && previewUrl && (
        <div className="relative overflow-hidden rounded-xl border border-surface-border bg-black/5">
          <button
            type="button"
            onClick={() => {
              onFileSelected(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-700 shadow-card hover:bg-white"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>

          {isImageMime(file.type) && (
            <img
              src={previewUrl}
              alt="Selected preview"
              className="max-h-64 w-full object-contain"
            />
          )}
          {isVideoMime(file.type) && (
            <video
              src={previewUrl}
              controls
              className="max-h-64 w-full bg-black"
            />
          )}

          <div className="flex items-center justify-between gap-2 border-t border-surface-border bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
              {isImageMime(file.type) ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <FileVideo2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="shrink-0 text-xs font-medium text-shadowfax-green hover:underline"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {(localError || error) && (
        <p className="mt-1.5 text-xs text-red-500">{localError || error}</p>
      )}
    </div>
  );
}
