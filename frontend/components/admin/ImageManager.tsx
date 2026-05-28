"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import {
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
  ImageOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ServiceImage = {
  id: number
  service_id: number
  path: string
  alt: string | null
  is_primary: boolean
  sort_order: number
  url: string
}

interface ImageManagerProps {
  serviceId: number
  images: ServiceImage[]
  onChange: (images: ServiceImage[]) => void
  maxImages?: number
}

export function ImageManager({
  serviceId,
  images,
  onChange,
  maxImages = 10,
}: ImageManagerProps) {
  const [uploading, setUploading] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<ServiceImage | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const atLimit = images.length >= maxImages

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).slice(0, maxImages - images.length)
    if (files.length === 0) {
      toast.error(`You can upload up to ${maxImages} images per stay`)
      return
    }

    setUploading(true)
    let updated = [...images]
    let failed = 0

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failed++
        continue
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} is over 3MB`)
        failed++
        continue
      }
      try {
        const fd = new FormData()
        fd.append("image", file)
        const res = await fetch(`/api/admin/services/${serviceId}/images`, {
          method: "POST",
          body: fd,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const img: ServiceImage = await res.json()
        updated = [...updated, img]
      } catch {
        failed++
      }
    }

    onChange(reorderForDisplay(updated))
    setUploading(false)

    if (failed === 0) {
      toast.success(`Uploaded ${files.length} image${files.length === 1 ? "" : "s"}`)
    } else if (failed < files.length) {
      toast.warning(`Uploaded ${files.length - failed}, ${failed} failed`)
    } else {
      toast.error("Upload failed", {
        description: "Check file format (jpg/png/webp) and size (max 3MB).",
      })
    }
  }

  async function setPrimary(image: ServiceImage) {
    try {
      const res = await fetch(`/api/admin/images/${image.id}/primary`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error()
      const updated = images.map((img) => ({
        ...img,
        is_primary: img.id === image.id,
      }))
      onChange(reorderForDisplay(updated))
      toast.success("Primary image updated")
    } catch {
      toast.error("Could not set as primary")
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      const res = await fetch(`/api/admin/images/${pendingDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      const remaining = images.filter((i) => i.id !== pendingDelete.id)
      // If we deleted the primary, the backend promotes the next image.
      // Mirror that locally so the UI stays in sync without a refetch.
      if (pendingDelete.is_primary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_primary: true }
      }
      onChange(reorderForDisplay(remaining))
      toast.success("Image deleted")
    } catch {
      toast.error("Could not delete image")
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <button
        type="button"
        disabled={uploading || atLimit}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          "flex flex-col items-center justify-center gap-2",
          atLimit
            ? "border-border bg-muted/40 cursor-not-allowed opacity-60"
            : "border-border hover:border-primary/50 hover:bg-accent/40 cursor-pointer",
          uploading && "opacity-60 pointer-events-none",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-sm font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">
                {atLimit
                  ? `Image limit reached (${maxImages})`
                  : "Click to upload images"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, or WebP · up to 3MB each · max {maxImages} per stay
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = "" // allow re-uploading same file
          }}
        />
      </button>

      {/* Thumbnails */}
      {images.length === 0 ? (
        <div className="text-center py-6 rounded-lg border border-dashed text-muted-foreground">
          <ImageOff className="h-5 w-5 mx-auto mb-2 opacity-60" />
          <p className="text-xs">No images yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                "group relative aspect-square rounded-md overflow-hidden border",
                img.is_primary
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? ""}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {img.is_primary && (
                <span className="absolute top-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => setPrimary(img)}
                  >
                    <Star className="h-3 w-3" />
                    Set primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  onClick={() => setPendingDelete(img)}
                  aria-label="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this image?"
        description={
          pendingDelete?.is_primary
            ? "This is the primary image — the next one in the gallery will be promoted automatically."
            : "The image will be permanently removed from this homestay."
        }
        destructive
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/** Sort so primary appears first, then by sort_order, then id. */
function reorderForDisplay(images: ServiceImage[]): ServiceImage[] {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.id - b.id
  })
}
