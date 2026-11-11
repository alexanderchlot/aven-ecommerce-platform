import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account | AVEN",
};

export default function SignUpPage() {
  return (
    <>
      <div className="container-page pt-5 lg:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="caption flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              Create account
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="auth-title"
        className="container-narrow pb-section pt-8 lg:pt-12"
      >
        <header className="mb-8 lg:mb-12">
          <p className="eyebrow">Join AVEN</p>
          <h1 id="auth-title" className="display mt-2">
            Create account
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            Save your details for a faster visit next time.
          </p>
        </header>
        <div className="max-w-md">
          <AuthForm mode="sign-up" />
        </div>
      </section>
    </>
  );
}
