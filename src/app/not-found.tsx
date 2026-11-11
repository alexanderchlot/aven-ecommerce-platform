import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section container-narrow flex flex-col items-center gap-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-1">This page isn&apos;t here (yet)</h1>
      <p className="max-w-md text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been
        built yet.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to home
      </Link>
    </section>
  );
}
