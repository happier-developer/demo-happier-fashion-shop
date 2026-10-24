import Container from "@/components/ui/Container";

// Trang placeholder tối giản cho các route đã có trong điều hướng nhưng nội
// dung thật thuộc issue sau (ghi rõ ở từng trang). Chỉ gồm tiêu đề + một dòng
// thông báo để điều hướng không rơi vào 404.
export default function PlaceholderPage({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <Container className="py-16 md:py-24">
      <h1 className="text-3xl font-bold text-ink md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        Nội dung đang được xây dựng. {note}
      </p>
    </Container>
  );
}
