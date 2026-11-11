"use client";

import { useState } from "react";

// Placeholder: no backend is connected yet, so nothing is stored or sent.
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="heading-3">Thank you. (Demo only: not yet connected.)</p>;
  }

  return (
    <form
      className="flex w-full flex-col gap-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label className="flex-1">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="field"
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block-mobile">
        Subscribe
      </button>
    </form>
  );
}
