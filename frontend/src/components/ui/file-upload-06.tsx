"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Trash2 } from "lucide-react";

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "completed";
}

type FileUpload06Props = {
  onHasUploadsChange?: (hasUploads: boolean) => void;
  disabled?: boolean;
};

export default function FileUpload06({ onHasUploadsChange, disabled }: FileUpload06Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const filePickerRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const fileCount = uploads.length;
  const importLabel = fileCount > 1 ? "Importer les factures" : "Importer la facture";

  const openFilePicker = () => {
    if (disabled) return;
    filePickerRef.current?.click();
  };

  const addFiles = (fileList: FileList | null) => {
    if (disabled) return;
    if (!fileList) return;

    const files = Array.from(fileList).slice(0, 10);
    if (fileList.length > 10) {
      console.warn("Limite de 10 fichiers par import atteinte.");
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length) {
      console.warn(
        `Ces fichiers dépassent ${MAX_FILE_SIZE_MB} Mo et ont été ignorés : ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
    }

    const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);

    const newUploads = validFiles.map<UploadItem>((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      progress: 100,
      status: "completed",
    }));

    setUploads((prev) => [...newUploads, ...prev]);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    addFiles(event.target.files);
  };

  const onDragOver = (event: React.DragEvent) => {
    if (disabled) return;
    event.preventDefault();
  };

  const onDropFiles = (event: React.DragEvent) => {
    if (disabled) return;
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const removeUploadById = (id: string) => {
    if (disabled) return;
    setUploads(uploads.filter((file) => file.id !== id));
  };

  const hasUploads = uploads.length > 0;

  useEffect(() => {
    onHasUploadsChange?.(hasUploads);
  }, [hasUploads, onHasUploadsChange]);

  return (
    <div className="flex h-full w-full flex-col">
      {!hasUploads && (
        <Card
          className={`group flex w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/30 py-8 min-h-[135px] text-sm transition-colors ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50"
          }`}
          onDragOver={onDragOver}
          onDrop={onDropFiles}
          onClick={openFilePicker}
        >
          <div className="grid space-y-3 text-center">
            <div className="flex items-center justify-center gap-x-2 text-muted-foreground">
              <Upload className="size-5" />
              <div>
                Déposez vos fichiers ici ou{" "}
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto font-normal"
                  onClick={openFilePicker}
                  disabled={disabled}
                >
                  parcourez vos documents
                </Button>{" "}
                pour les ajouter
              </div>
            </div>
          </div>
          <span className="text-base/6 text-muted-foreground group-disabled:opacity-50 mt-2 block sm:text-xs">
            Formats acceptés : PDF, JPG, PNG, TIFF, BMP, HEIF (max {MAX_FILE_SIZE_MB} Mo, 10 fichiers)
          </span>
        </Card>
      )}

      {hasUploads && (
        <div
          className="flex w-full flex-1 flex-col gap-2 select-none"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div className="max-h-[150px] overflow-y-auto rounded-md border bg-muted/30 divide-y">
            {uploads.map((file) => {
              const progressLabel =
                file.progress >= 100 ? "Prêt à importer" : `${file.progress}%`;
              return (
                <div key={file.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="grid size-10 shrink-0 place-content-center rounded border bg-muted">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-medium text-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {progressLabel}
                      </span>
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removeUploadById(file.id)}
                    aria-label={`Supprimer ${file.name}`}
                    disabled={disabled}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end mt-2">
            <Button disabled={disabled || !uploads.length}>{importLabel}</Button>
          </div>
        </div>
      )}

      <input
        ref={filePickerRef}
        type="file"
        className="hidden"
        accept="application/pdf,image/png,image/jpeg,image/tiff,image/bmp,image/heif,image/heic"
        multiple
        onChange={onFileInputChange}
        disabled={disabled}
      />
    </div>
  );
}
