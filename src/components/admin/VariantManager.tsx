"use client";

// Quản lý biến thể size/màu của một sản phẩm (HAP-40). Gọi Server Actions
// trong src/server-actions/admin-products.ts — validate thật nằm ở server.
// Biến thể đã có trong đơn hàng vẫn sửa được giá/tồn kho (snapshot đơn cũ
// không đổi), xóa biến thể chỉ xóa dòng biến thể, không xóa đơn cũ.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatVnd } from "@/lib/format";
import type { ProductVariant } from "@/lib/db/schema";
import {
  createVariantAction,
  deleteVariantAction,
  updateVariantAction,
} from "@/server-actions/admin-products";

export default function VariantManager({
  productId,
  slug,
  initialVariants,
}: {
  productId: string;
  slug: string;
  initialVariants: ProductVariant[];
}) {
  const router = useRouter();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await createVariantAction(productId, slug, {
      size,
      color,
      priceVnd: price,
      stock,
      isAvailable: true,
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSize("");
    setColor("");
    setPrice("");
    setStock("");
    router.refresh();
  }

  async function handleToggle(variant: ProductVariant) {
    setBusyId(variant.id);
    const result = await updateVariantAction(variant.id, slug, {
      size: variant.size,
      color: variant.color,
      priceVnd: String(variant.priceVnd),
      stock: String(variant.stock),
      isAvailable: !variant.isAvailable,
    });
    if (!result.ok) setError(result.message);
    setBusyId(null);
    router.refresh();
  }

  async function handleDelete(variant: ProductVariant) {
    if (!window.confirm(`Xóa biến thể ${variant.size} / ${variant.color}?`)) return;
    setBusyId(variant.id);
    const result = await deleteVariantAction(variant.id, slug);
    if (!result.ok) setError(result.message);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}
      {initialVariants.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có biến thể nào — thêm biến thể đầu tiên để khách chọn được
          size/màu ở trang chi tiết.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {initialVariants.map((variant) => (
            <li key={variant.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-bold text-ink">
                  Size {variant.size} · {variant.color}
                </p>
                <p className="text-sm text-muted">
                  {formatVnd(variant.priceVnd)} · Tồn kho: {variant.stock} ·{" "}
                  {variant.isAvailable ? "Đang bán" : "Ngừng bán"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleToggle(variant)}
                  disabled={busyId === variant.id}
                >
                  {variant.isAvailable ? "Ngừng bán" : "Mở bán"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(variant)}
                  disabled={busyId === variant.id}
                  className="text-error hover:bg-error/10"
                >
                  Xóa
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
        <Field label="Size" htmlFor="variant-size">
          <Input id="variant-size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="S, M, L, XL hoặc Free size" required />
        </Field>
        <Field label="Màu" htmlFor="variant-color">
          <Input id="variant-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Đen, Trắng, Be..." required />
        </Field>
        <Field label="Giá (VNĐ)" htmlFor="variant-price">
          <Input id="variant-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="299000" required />
        </Field>
        <Field label="Tồn kho" htmlFor="variant-stock">
          <Input id="variant-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="10" required />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">Thêm biến thể</Button>
        </div>
      </form>
    </div>
  );
}
