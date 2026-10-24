"use client";

// Form thêm/sửa sản phẩm phía admin (HAP-16). Gọi Server Actions trong
// src/server-actions/admin-products.ts — validate thật nằm ở server,
// form này chỉ hiển thị lỗi theo từng trường mà action trả về (mẫu lỗi
// tiếng Việt như form checkout/auth). Thành công → quay về danh sách
// /admin/san-pham và refresh để thấy dữ liệu mới ngay.

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { formatVnd } from "@/lib/format";
import type { Category, Product } from "@/lib/db/schema";
import type { ProductFieldErrors } from "@/lib/products/admin-validate";
import {
  createProductAction,
  updateProductAction,
} from "@/server-actions/admin-products";

// Cùng bộ class với Input (src/components/ui/Input.tsx) cho <select>,
// vì UI kit chưa có component Select riêng.
const selectClasses =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-base text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 aria-[invalid=true]:border-error";

interface ProductFormProps {
  categories: Category[];
  /** Có = chế độ sửa (slug giữ nguyên); không = chế độ thêm mới. */
  product?: Product;
}

export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [priceText, setPriceText] = useState(
    product ? String(product.priceVnd) : "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsedPrice = /^\d+$/.test(priceText.trim().replace(/[\s.]/g, ""))
    ? Number(priceText.trim().replace(/[\s.]/g, ""))
    : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    const input = {
      name,
      categoryId,
      priceVnd: priceText,
      description,
      imageUrl,
      isAvailable,
      isFeatured,
    };
    try {
      const result = product
        ? await updateProductAction(product.id, input)
        : await createProductAction(input);
      if (result.ok) {
        router.push("/admin/san-pham");
        router.refresh();
        return;
      }
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      setSubmitting(false);
    } catch {
      setFormError("Chưa lưu được thay đổi lúc này. Vui lòng thử lại sau ít phút.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <p
          role="alert"
          className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Tên sản phẩm" htmlFor="name" error={fieldErrors.name}>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ví dụ: Cà phê sữa đá"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(fieldErrors.name)}
          required
        />
      </Field>

      {isEdit && product ? (
        <p className="-mt-2 text-sm text-muted">
          Đường dẫn sản phẩm giữ nguyên khi sửa để không gãy link đã chia sẻ:{" "}
          <span className="font-medium text-ink">/san-pham/{product.slug}</span>
        </p>
      ) : (
        <p className="-mt-2 text-sm text-muted">
          Đường dẫn sản phẩm (/san-pham/...) sẽ tự sinh từ tên khi tạo.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Danh mục" htmlFor="categoryId" error={fieldErrors.categoryId}>
          <select
            id="categoryId"
            name="categoryId"
            className={selectClasses}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={Boolean(fieldErrors.categoryId) || undefined}
            required
          >
            <option value="" disabled>
              Chọn danh mục
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Giá (VNĐ)" htmlFor="priceVnd" error={fieldErrors.priceVnd}>
          <Input
            id="priceVnd"
            name="priceVnd"
            type="text"
            inputMode="numeric"
            placeholder="Ví dụ: 45000"
            value={priceText}
            onChange={(event) => setPriceText(event.target.value)}
            error={Boolean(fieldErrors.priceVnd)}
            required
          />
          {parsedPrice !== null && !fieldErrors.priceVnd ? (
            <p className="mt-1.5 text-sm text-muted">
              = {formatVnd(parsedPrice)}
            </p>
          ) : null}
        </Field>
      </div>

      <Field label="Mô tả (không bắt buộc)" htmlFor="description" error={fieldErrors.description}>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Hương vị, thành phần, ghi chú ngắn về sản phẩm…"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={Boolean(fieldErrors.description)}
        />
      </Field>

      <Field
        label="Đường dẫn ảnh (không bắt buộc)"
        htmlFor="imageUrl"
        error={fieldErrors.imageUrl}
      >
        <Input
          id="imageUrl"
          name="imageUrl"
          type="text"
          placeholder="https://… (để trống = dùng ảnh minh hoạ mặc định)"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          error={Boolean(fieldErrors.imageUrl)}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-cta"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
          />
          <span>
            <span className="font-medium">Đang bán (còn hàng)</span> — bỏ chọn
            nếu sản phẩm đang hết hàng: khách vẫn thấy sản phẩm trên sản phẩm kèm nhãn “Hết
            hàng” nhưng không đặt được.
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-cta"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          <span>
            <span className="font-medium">Sản phẩm nổi bật</span> — hiện ở mục “Sản phẩm
            nổi bật” trên trang chủ (chỉ khi đang bán).
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Đang lưu…"
            : isEdit
              ? "Lưu thay đổi"
              : "Thêm sản phẩm"}
        </Button>
        <Button href="/admin/san-pham" variant="ghost">
          Huỷ
        </Button>
      </div>
    </form>
  );
}
