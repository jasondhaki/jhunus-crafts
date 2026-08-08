"use client";

import { useActionState, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/admin/submit-button";
import { slugify } from "@/lib/slugify";
import { fromCents } from "@/lib/money";
import { useActionToast } from "@/lib/use-action-toast";
import { getUploadSignatureAction, deleteProductImageAction } from "@/actions/admin/cloudinary";
import type { ProductActionResult } from "@/actions/admin/products";

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormValues {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  dimensions: string | null;
  materials: string;
  weave: string | null;
  color: string | null;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
}

const EMPTY_VALUES: Omit<ProductFormValues, "id"> = {
  title: "",
  slug: "",
  description: "",
  priceCents: 0,
  compareAtCents: null,
  stock: 0,
  dimensions: null,
  materials: "100% Eco-Friendly Natural Jute",
  weave: null,
  color: null,
  categoryId: "",
  isFeatured: false,
  isActive: true,
  images: [],
};

const initialState: ProductActionResult = { success: false, message: "" };
const MAX_IMAGES = 10;

export function ProductForm({
  categories,
  initialValues,
  action,
}: {
  categories: CategoryOption[];
  initialValues?: ProductFormValues;
  action: (prevState: ProductActionResult, formData: FormData) => Promise<ProductActionResult>;
}) {
  const router = useRouter();
  const isEditing = !!initialValues;
  const values = initialValues ?? EMPTY_VALUES;

  const [state, formAction] = useActionState(action, initialState);
  useActionToast(state);

  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  // An existing product's slug is a live URL — don't silently rewrite it
  // just because the admin edited the title. New products auto-sync until
  // the admin edits the slug field directly.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [images, setImages] = useState<string[]>(values.images);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const formId = useId();

  useEffect(() => {
    if (state.success && !isEditing && state.productId) {
      router.push(`/admin/products/${state.productId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setUploadError(`Up to ${MAX_IMAGES} images per product.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const signature = await getUploadSignatureAction();
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signature.apiKey);
        body.append("timestamp", String(signature.timestamp));
        body.append("signature", signature.signature);
        body.append("folder", signature.folder);

        // Uploads straight to Cloudinary — the file never passes through
        // our server (see src/lib/cloudinary.ts).
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
          method: "POST",
          body,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for "${file.name}".`);
        }

        const data: { secure_url: string } = await response.json();
        uploaded.push(data.secure_url);
      }

      setImages((current) => [...current, ...uploaded]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage(url: string) {
    setImages((current) => current.filter((image) => image !== url));
    void deleteProductImageAction(url);
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(index: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;

    setImages((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label htmlFor={`${formId}-title`} className="mb-1.5 block text-sm font-medium text-bark">
            Title
          </label>
          <Input
            id={`${formId}-title`}
            name="title"
            required
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            error={state.fieldErrors?.title?.[0]}
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor={`${formId}-slug`} className="mb-1.5 block text-sm font-medium text-bark">
            Slug
          </label>
          <Input
            id={`${formId}-slug`}
            name="slug"
            required
            value={slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            error={state.fieldErrors?.slug?.[0]}
          />
          <p className="mt-1.5 text-xs text-gray-500">/shop/{slug || "…"}</p>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor={`${formId}-description`} className="mb-1.5 block text-sm font-medium text-bark">
            Description
          </label>
          <Textarea
            id={`${formId}-description`}
            name="description"
            required
            rows={5}
            defaultValue={values.description}
            error={state.fieldErrors?.description?.[0]}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-price`} className="mb-1.5 block text-sm font-medium text-bark">
            Price (USD)
          </label>
          <Input
            id={`${formId}-price`}
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={isEditing ? fromCents(values.priceCents) : undefined}
            error={state.fieldErrors?.price?.[0]}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-compareAtPrice`} className="mb-1.5 block text-sm font-medium text-bark">
            Compare-at Price (USD) <span className="text-gray-400">(optional)</span>
          </label>
          <Input
            id={`${formId}-compareAtPrice`}
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={values.compareAtCents !== null ? fromCents(values.compareAtCents) : undefined}
            error={state.fieldErrors?.compareAtPrice?.[0]}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-stock`} className="mb-1.5 block text-sm font-medium text-bark">
            Stock
          </label>
          <Input
            id={`${formId}-stock`}
            name="stock"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={values.stock}
            error={state.fieldErrors?.stock?.[0]}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-categoryId`} className="mb-1.5 block text-sm font-medium text-bark">
            Category
          </label>
          <Select
            id={`${formId}-categoryId`}
            name="categoryId"
            required
            defaultValue={values.categoryId}
            error={state.fieldErrors?.categoryId?.[0]}
          >
            <option value="" disabled>
              Select a category…
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={`${formId}-dimensions`} className="mb-1.5 block text-sm font-medium text-bark">
            Dimensions <span className="text-gray-400">(optional)</span>
          </label>
          <Input id={`${formId}-dimensions`} name="dimensions" defaultValue={values.dimensions ?? ""} />
        </div>
        <div>
          <label htmlFor={`${formId}-materials`} className="mb-1.5 block text-sm font-medium text-bark">
            Materials
          </label>
          <Input
            id={`${formId}-materials`}
            name="materials"
            required
            defaultValue={values.materials}
            error={state.fieldErrors?.materials?.[0]}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-weave`} className="mb-1.5 block text-sm font-medium text-bark">
            Weave <span className="text-gray-400">(optional)</span>
          </label>
          <Input id={`${formId}-weave`} name="weave" defaultValue={values.weave ?? ""} />
        </div>
        <div>
          <label htmlFor={`${formId}-color`} className="mb-1.5 block text-sm font-medium text-bark">
            Color <span className="text-gray-400">(optional)</span>
          </label>
          <Input id={`${formId}-color`} name="color" defaultValue={values.color ?? ""} />
        </div>
      </section>

      <section className="flex flex-wrap gap-6 rounded-lg border border-gray-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-medium text-bark">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={values.isFeatured}
            className="size-4 accent-terracotta"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-bark">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="size-4 accent-terracotta"
          />
          Active (visible in the shop)
        </label>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-bark">Images</h2>
        <p className="mt-1 text-xs text-gray-500">
          Drag to reorder — the first image is used as the primary thumbnail. Up to {MAX_IMAGES}.
        </p>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className="group relative aspect-square cursor-grab overflow-hidden rounded-md border border-gray-200 bg-gray-100"
              >
                <Image src={url} alt="" fill sizes="150px" className="object-cover" />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-bark/80 px-1.5 py-0.5 text-[10px] font-medium text-cream">
                    Primary
                  </span>
                )}
                <span className="absolute right-1 top-1 rounded bg-white/90 p-0.5 text-gray-500">
                  <GripVertical className="size-3.5" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  aria-label="Remove image"
                  className="absolute bottom-1 right-1 rounded bg-white/90 p-1 text-red-600 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor={`${formId}-images`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 ease-out hover:border-terracotta hover:text-terracotta"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
            {isUploading ? "Uploading…" : "Upload Images"}
          </label>
          <input
            ref={fileInputRef}
            id={`${formId}-images`}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="sr-only"
          />
        </div>

        {uploadError && <p className="mt-2 text-sm text-terracotta">{uploadError}</p>}
        {state.fieldErrors?.images && (
          <p className="mt-2 text-sm text-terracotta">{state.fieldErrors.images[0]}</p>
        )}
      </section>

      <SubmitButton disabled={isUploading} size="lg">
        {isEditing ? "Save Changes" : "Create Product"}
      </SubmitButton>
    </form>
  );
}
