"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useTransition } from "react";

/**
 * GET form that re-runs the search as soon as any filter changes, so the
 * experience feels instant. Still works as a normal form without JS.
 */
export function AutoSubmitForm({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function submit(delay = 0) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const fd = new FormData(ref.current!);
      const sp = new URLSearchParams();
      for (const [k, v] of fd.entries()) if (typeof v === "string" && v !== "") sp.append(k, v);
      start(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    }, delay);
  }

  return (
    <form
      ref={ref}
      method="get"
      className={className}
      data-pending={pending || undefined}
      onChange={(e) => {
        const type = (e.target as unknown as HTMLInputElement).type;
        submit(type === "text" || type === "number" ? 450 : 0);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {children}
    </form>
  );
}
