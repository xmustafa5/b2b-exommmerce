"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  className,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxImages - previews.length;

    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    const updatedPreviews = [...previews, ...newPreviews];
    setPreviews(updatedPreviews);
    onChange(updatedPreviews);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onChange(updatedPreviews);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload button */}
      {previews.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Images ({previews.length}/{maxImages})
            </Button>
          </label>
        </div>
      )}

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg border bg-gray-50"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {previews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No images uploaded</p>
          <p className="text-xs text-gray-500">
            Click the button above to upload images
          </p>
        </div>
      )}
    </div>
  );
}
