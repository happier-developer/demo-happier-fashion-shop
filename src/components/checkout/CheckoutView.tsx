"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { useCart } from "@/lib/cart/cart-context";
import { bankConfig, buildVietQrImageUrl } from "@/lib/config";
import { formatVnd } from "@/lib/format";
import {
  validateCheckoutInput,
  type CheckoutFieldErrors,
  type CheckoutInput,
  type CheckoutPaymentMethod,
} from "@/lib/orders/validate";
import { placeOrder } from "@/server-actions/checkout";

// Trang Thanh toán (HAP-12) theo DESIGN.md mục 6:
// form giao hàng → chọn VietQR/COD → (VietQR: hiện mã QR kèm mã đơn)
// → màn hình xác nhận có mã đơn.
//
// Giỏ đọc từ CartProvider (localStorage, quyết định A2). Client chỉ gửi
// productId + số lượng + thông tin giao hàng lên Server Action `placeOrder`;
// giá và tình trạng còn hàng do server đọc lại từ DB. Giỏ chỉ bị xóa SAU
// KHI server xác nhận tạo đơn thành công.

interface SuccessState {
  code: string;
  totalVnd: number;
  paymentMethod: CheckoutPaymentMethod;
}

const paymentOptions: ReadonlyArray<{
  value: CheckoutPaymentMethod;
  title: string;
  description: string;
  icon: typeof QrCode;
}> = [
  {
    value: "vietqr",
    title: "Chuyển khoản VietQR",
    description: "Quét mã QR sau khi đặt hàng, nội dung chuyển khoản là mã đơn.",
    icon: QrCode,
  },
  {
    value: "cod",
    title: "Tiền mặt khi nhận hàng (COD)",
    description: "Thanh toán trực tiếp cho nhân viên giao hàng.",
    icon: Banknote,
  },
];

function CheckoutSuccess({ success }: { success: SuccessState }) {
  const isVietQr = success.paymentMethod === "vietqr";
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 text-center sm:p-10">
        <CheckCircle2
          className="mx-auto h-14 w-14 text-success"
          aria-hidden
        />
        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-muted">
          Cảm ơn bạn đã đặt hàng tại Happier Fashion. Shop sẽ gọi điện xác
          nhận đơn trong ít phút.
        </p>

        <div className="mt-6 rounded-xl bg-paper px-4 py-5">
          <p className="text-sm text-muted">Mã đơn của bạn</p>
          <p className="mt-1 text-3xl font-bold tracking-wide text-ink">
            {success.code}
          </p>
          <div className="mt-3 flex justify-center">
            <OrderStatusBadge status="pending_confirmation" />
          </div>
          <p className="mt-3 text-base">
            Tổng tiền:{" "}
            <span className="font-bold text-accent">
              {formatVnd(success.totalVnd)}
            </span>
          </p>
        </div>

        {isVietQr ? (
          <div className="mt-6 text-left">
            <h2 className="text-center text-lg font-bold text-ink">
              Quét mã để chuyển khoản
            </h2>
            <div className="mt-4 flex justify-center">
              <Image
                src={buildVietQrImageUrl(success.code, success.totalVnd)}
                alt={`Mã VietQR chuyển khoản cho đơn ${success.code}`}
                width={280}
                height={280}
                className="h-auto w-64 rounded-xl border border-line sm:w-72"
                unoptimized
              />
            </div>
            <dl className="mx-auto mt-5 max-w-md space-y-2 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Ngân hàng</dt>
                <dd className="font-medium text-ink">
                  {bankConfig.bankName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Số tài khoản</dt>
                <dd className="font-medium text-ink">
                  {bankConfig.account}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Chủ tài khoản</dt>
                <dd className="font-medium text-ink">
                  {bankConfig.accountName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Số tiền</dt>
                <dd className="font-medium text-ink">
                  {formatVnd(success.totalVnd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Nội dung chuyển khoản</dt>
                <dd className="font-bold text-ink">{success.code}</dd>
              </div>
            </dl>
            {bankConfig.isPlaceholder ? (
              <p className="mx-auto mt-4 max-w-md rounded-xl bg-warning/10 px-4 py-3 text-center text-sm text-ink">
                Đây là thông tin ngân hàng mẫu phục vụ demo — shop sẽ thay
                bằng tài khoản thật khi vận hành.
              </p>
            ) : null}
            <p className="mt-4 text-center text-sm text-muted">
              Đơn chỉ được xác nhận thanh toán sau khi shop đối soát được
              chuyển khoản của bạn.
            </p>
          </div>
        ) : (
          <p className="mx-auto mt-6 max-w-md rounded-xl bg-paper px-4 py-3 text-base text-ink">
            Bạn đã chọn trả tiền mặt khi nhận hàng — vui lòng chuẩn bị{" "}
            <span className="font-bold">{formatVnd(success.totalVnd)}</span>{" "}
            khi đơn được giao tới.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Về trang chủ</Button>
          <Button href="/san-pham" variant="secondary">
            Xem sản phẩm
          </Button>
        </div>
      </div>
    </Container>
  );
}


// Khối bước theo phong cách "Đặt hàng trong 3 bước": gạch ngang đậm trên
// cùng, số bước serif mờ, tiêu đề serif, mô tả sans mờ. Chỉ là trình bày —
// không chứa logic form hay đơn hàng.
function StepSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-t-2 border-ink pt-6">
      <p className="font-display text-lg text-muted" aria-hidden>
        {number}
      </p>
      <h2 className="mt-2 font-display text-2xl leading-snug font-semibold text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-muted">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

// Dải cam kết dưới form, kiểu ảnh tham chiếu thứ hai: icon + tiêu đề đậm +
// dòng phụ mờ, căn giữa, 3 cột desktop. Mọi dòng chữ đều lấy từ nội dung
// sẵn có của shop — không bịa chính sách, phí hay thời hạn.
const perks: ReadonlyArray<{
  icon: typeof Truck;
  title: string;
  text: string;
}> = [
  {
    icon: Truck,
    title: "Giao hàng miễn phí",
    text: "Phí giao hàng miễn phí, shop giao tận nơi.",
  },
  {
    icon: QrCode,
    title: "Thanh toán linh hoạt",
    text: "Chuyển khoản VietQR hoặc trả khi nhận (COD).",
  },
  {
    icon: RefreshCcw,
    title: "Đổi size miễn phí 7 ngày",
    text: "Đổi size miễn phí trong 7 ngày nếu sản phẩm chưa qua sử dụng.",
  },
];

function PerksStrip() {
  return (
    <section
      aria-label="Cam kết của shop"
      className="mt-16 border-t border-line pt-12"
    >
      <ul className="grid gap-10 sm:grid-cols-3">
        {perks.map((perk) => {
          const Icon = perk.icon;
          return (
            <li key={perk.title} className="text-center">
              <Icon className="mx-auto h-8 w-8 text-ink" aria-hidden />
              <h3 className="mt-4 font-bold text-ink">{perk.title}</h3>
              <p className="mt-2 text-sm text-muted">{perk.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function CheckoutView() {
  const { items, totalPriceVnd, hydrated, clear } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("vietqr");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  if (success) {
    return <CheckoutSuccess success={success} />;
  }

  if (!hydrated) {
    return (
      <Container className="py-10 sm:py-14">
        <p className="text-muted">Đang tải thông tin giỏ hàng…</p>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center sm:p-10">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold text-ink">
            Chưa có sản phẩm nào để thanh toán
          </h1>
          <p className="mt-2 text-muted">
            Giỏ hàng của bạn đang trống. Hãy chọn vài sản phẩm ngon ở sản phẩm rồi
            quay lại đây nhé.
          </p>
          <div className="mt-6">
            <Button href="/san-pham">Xem sản phẩm</Button>
          </div>
        </div>
      </Container>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const input: CheckoutInput = {
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      })),
      customerName,
      customerPhone,
      customerAddress,
      note,
      paymentMethod,
    };

    // Validate phía client trước (cùng bộ quy tắc với server) để hiện lỗi
    // cạnh trường ngay; server vẫn kiểm tra lại toàn bộ.
    const validation = validateCheckoutInput(input);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setFormError(validation.fieldErrors.items ?? null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await placeOrder(input);
      if (result.ok) {
        setSuccess({
          code: result.code,
          totalVnd: result.totalVnd,
          paymentMethod: result.paymentMethod,
        });
        // Chỉ xóa giỏ SAU KHI server đã tạo đơn thành công.
        clear();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    } catch {
      setFormError(
        "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau ít phút.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl leading-[1.1] font-semibold text-ink sm:text-5xl">
          Thanh toán
        </h1>
        <p className="mt-3 text-muted">Đặt hàng trong 3 bước.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto mt-12 max-w-3xl space-y-12"
      >
        <StepSection
          number="01"
          title="Sản phẩm đã chọn"
          description="Sản phẩm, size/màu và số lượng bạn đã chọn."
        >
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-muted">
                    {formatVnd(item.priceVnd)} × {item.quantity}
                    {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-ink">
                  {formatVnd(item.priceVnd * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="font-medium text-ink">
                {formatVnd(totalPriceVnd)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="font-medium text-ink">Miễn phí</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt className="font-bold text-ink">Tổng cộng</dt>
              <dd className="font-bold text-accent">
                {formatVnd(totalPriceVnd)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-muted">
            Giá và tình trạng còn hàng được server xác nhận lại tại thời điểm
            đặt hàng.
          </p>
        </StepSection>

        <StepSection
          number="02"
          title="Đặt hàng & thanh toán"
          description="Điền thông tin giao hàng, chọn chuyển khoản VietQR hoặc trả khi nhận (COD)."
        >
          <h3 className="font-semibold text-ink">Thông tin giao hàng</h3>
          <div className="mt-4 space-y-4">
            <Field
              label="Họ tên người nhận"
              htmlFor="checkout-name"
              error={fieldErrors.customerName}
            >
              <Input
                id="checkout-name"
                name="customerName"
                autoComplete="name"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={Boolean(fieldErrors.customerName)}
              />
            </Field>
            <Field
              label="Số điện thoại"
              htmlFor="checkout-phone"
              error={fieldErrors.customerPhone}
            >
              <Input
                id="checkout-phone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Ví dụ: 0901 234 567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                error={Boolean(fieldErrors.customerPhone)}
              />
            </Field>
            <Field
              label="Địa chỉ giao hàng"
              htmlFor="checkout-address"
              error={fieldErrors.customerAddress}
            >
              <Input
                id="checkout-address"
                name="customerAddress"
                autoComplete="street-address"
                placeholder="Số nhà, đường, phường, quận"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                error={Boolean(fieldErrors.customerAddress)}
              />
            </Field>
            <Field
              label="Ghi chú (không bắt buộc)"
              htmlFor="checkout-note"
              error={fieldErrors.note}
            >
              <Textarea
                id="checkout-note"
                name="note"
                rows={3}
                placeholder="Ví dụ: ít đường, giao giờ hành chính…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                error={Boolean(fieldErrors.note)}
              />
            </Field>
          </div>

          <h3 className="mt-8 font-semibold text-ink">
            Phương thức thanh toán
          </h3>
          {fieldErrors.paymentMethod ? (
            <p className="mt-2 text-sm text-error" role="alert">
              {fieldErrors.paymentMethod}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const selected = paymentMethod === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    selected
                      ? "border-cta bg-cta/5 ring-2 ring-cta/25"
                      : "border-line bg-surface hover:border-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={selected}
                    onChange={() => setPaymentMethod(option.value)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#a85b2a]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-ink">
                      <Icon className="h-5 w-5 text-cta" aria-hidden />
                      {option.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </StepSection>

        {formError ? (
          <p
            className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Đang đặt hàng…
            </>
          ) : (
            "Đặt hàng"
          )}
        </Button>
      </form>

      <div className="mx-auto mt-16 max-w-3xl">
        <StepSection
          number="03"
          title="Nhận hàng"
          description="Shop xác nhận, đóng gói và giao đến tận nơi cho bạn."
        >
          <p className="text-muted">
            Shop sẽ gọi điện xác nhận đơn trong ít phút sau khi bạn đặt hàng.
          </p>
        </StepSection>
      </div>

      <PerksStrip />
    </Container>
  );
}
