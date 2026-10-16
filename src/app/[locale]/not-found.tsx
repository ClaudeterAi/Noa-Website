import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="cta" style={{ paddingTop: 200 }}>
      <div className="cta-pre">404</div>
      <div className="cta-h">Not Found</div>
      <div className="cta-row"><Link href="/" className="pkg-more">NOA</Link></div>
    </main>
  );
}
