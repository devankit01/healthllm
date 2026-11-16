"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#why", label: "Why" },
    { href: "/models", label: "Models" },
    { href: "/datasets", label: "Datasets" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/contribute", label: "Contribute" },
    { href: "/methodology", label: "Methodology" },
  ];

  return (
    <header className="site">
      <div className="wrap bar">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">◧</span> HealthLLM{" "}
          <small>Health AI Hub</small>
        </Link>
        <nav aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "nav-active" : ""}
            >
              {l.label}
            </Link>
          ))}
          <a
            className="gh"
            href="https://github.com/devankit01/healthllm"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <button
            className="nav-toggle icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d={open ? "M6 18L18 6M6 6l12 12" : "M3 6h18M3 12h18M3 18h18"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>
      </div>

      {open && (
        <div className="mobile-drawer">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/devankit01/healthllm"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub ↗
          </a>
        </div>
      )}
    </header>
  );
}
