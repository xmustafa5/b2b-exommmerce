"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadApi } from "@/actions/upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize value to always work with arrays internally
  const images = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : value
      ? [value as string]
      : [];

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError(null);
      setIsUploading(true);

      try {
        if (multiple) {
          // Check max files limit
          const remainingSlots = maxFiles - images.length;
          if (files.length > remainingSlots) {
            setError(`You can only upload ${remainingSlots} more file(s)`);
            setIsUploading(false);
            return;
          }

          const fileArray = Array.from(files);
          const response = await uploadApi.uploadMultiple(fileArray);
          const newImages = [...images, ...response.urls];
          onChange(newImages);
        } else {
          const file = files[0];
          const response = await uploadApi.uploadSingle(file);
          onChange(response.url);
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to upload image"
        );
      } finally {
        setIsUploading(false);
        // Reset input
        e.target.value = "";
      }
    },
    [images, maxFiles, multiple, onChange]
  );

  const handleRemove = useCallback(
    async (indexOrUrl: number | string) => {
      const urlToRemove =
        typeof indexOrUrl === "number" ? images[indexOrUrl] : indexOrUrl;

      try {
        // Try to delete from server
        const filename = uploadApi.extractFilename(urlToRemove);
        if (filename) {
          await uploadApi.deleteFile(filename).catch(() => {
            // Ignore delete errors - file might not exist
          });
        }
      } catch {
        // Ignore errors
      }

      if (multiple) {
        const newImages = images.filter((_, i) =>
          typeof indexOrUrl === "number" ? i !== indexOrUrl : _ !== indexOrUrl
        );
        onChange(newImages.length > 0 ? newImages : null);
      } else {
        onChange(null);
      }
    },
    [images, multiple, onChange]
  );

  const getImageUrl = (path: string) => {
    return uploadApi.getImageUrl(path);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading || (multiple && images.length >= maxFiles)}
          onClick={() => document.getElementById("image-upload-input")?.click()}
          className="relative"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {multiple ? "Upload Images" : "Upload Image"}
            </>
          )}
        </Button>
        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
        {multiple && (
          <span className="text-sm text-muted-foreground">
            {images.length} / {maxFiles} images
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((image, index) => (
            <div
              key={image}
              className="relative group rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={getImageUrl(image)}
                alt={`Upload ${index + 1}`}
                className="h-24 w-24 object-cover"
                onError={(e) => {
                  // Show placeholder on error
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden h-24 w-24 items-center justify-center bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div
          className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() =>
            !disabled &&
            document.getElementById("image-upload-input")?.click()
          }
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to upload {multiple ? "images" : "an image"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP, GIF (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}

// Simpler single image component for forms
interface SingleImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  previewSize?: "sm" | "md" | "lg";
}

export function SingleImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  previewSize = "md",
}: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setIsUploading(true);

      try {
        const response = await uploadApi.uploadSingle(file);
        onChange(response.url);
      } catch (err: any) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to upload image"
        );
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      try {
        const filename = uploadApi.extractFilename(value);
        if (filename) {
          await uploadApi.deleteFile(filename).catch(() => {});
        }
      } catch {
        // Ignore errors
      }
    }
    onChange(null);
  }, [value, onChange]);

  const inputId = `single-image-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("space-y-2", className)}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {value ? (
        <div className="relative group inline-block">
          <img
            src={uploadApi.getImageUrl(value)}
            alt="Uploaded"
            className={cn(
              "object-cover rounded-lg border",
              sizeClasses[previewSize]
            )}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "";
              (e.target as HTMLImageElement).className = cn(
                "flex items-center justify-center bg-muted rounded-lg border",
                sizeClasses[previewSize]
              );
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors",
            sizeClasses[previewSize],
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => !disabled && !isUploading && document.getElementById(inputId)?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Upload</span>
            </>
          )}
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
