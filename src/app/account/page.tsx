import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account | AVEN",
  robots: { index: false },
};

export default function AccountPage() {
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
              Account
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="account-title"
        className="container-narrow pb-section pt-8 lg:pt-12"
      >
        {/* The session comes from request headers: read it inside Suspense. */}
        <Suspense fallback={<div className="min-h-[40svh]" aria-hidden />}>
          <AccountDetails />
        </Suspense>
      </section>
    </>
  );
}

async function AccountDetails() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { user } = session;

  return (
    <>
      <header className="mb-8 lg:mb-12">
        <p className="eyebrow">My account</p>
        <h1 id="account-title" className="display mt-2">
          Hello, {user.name}
        </h1>
      </header>

      <dl className="max-w-md border-t">
        <div className="flex flex-col gap-1 border-b py-5">
          <dt className="eyebrow">Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="flex flex-col gap-1 border-b py-5">
          <dt className="eyebrow">Email</dt>
          <dd className="break-words">{user.email}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <SignOutButton />
        <Link href="/collections/new" className="btn btn-ghost">
          Continue shopping
        </Link>
      </div>
    </>
  );
}
