// vault-app.js
import React, { useEffect, useMemo, useState } from "react";

// ===== Site config =====
const SITE_NAME = "The Vault";
const CALENDLY_URL = "https://calendly.com/austincarvajal2/30min"; // your link
const NOTIFY_EMAIL = "thevault1012@gmail.com"; // fallback (we also use Vercel env vars)
const GA4_ID = "G-XXXXXXXXXX"; // optional

// Simple analytics helper
function track(event, params = {}) {
  try {
    if (typeof window !== "undefined" && window.gtag) window.gtag("event", event, params);
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, ...params });
    }
  } catch {}
}

// Grab UTM parameters
function parseUTMs() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const fields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  const out = {};
  fields.forEach((f) => { const v = p.get(f); if (v) out[f] = v; });
  return out;
}

// Create/update meta tags
function upsertMeta(name, content, isProperty = false) {
  if (typeof document === "undefined" || !content) return;
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) el.setAttribute("property", name); else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Icons
const ChevronDown = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Cookie banner
function CookieBanner() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("cookieConsent");
  });
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto mb-4 w-[92%] max-w-4xl rounded-2xl bg-neutral-800/95 p-4 text-sm text-neutral-100 shadow-2xl backdrop-blur">
        <p className="mb-3 leading-relaxed">
          We use cookies to improve your experience, analyze traffic, and for marketing. By clicking Accept, you consent to the use of cookies.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem("cookieConsent", "true");
              track("consent_update", { consent: "accepted" });
              setShow(false);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white shadow hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition"
          >
            Accept
          </button>
          <a href="#" className="text-neutral-300 underline underline-offset-4 hover:text-white">Learn more</a>
        </div>
      </div>
    </div>
  );
}

// Lead modal
function LeadModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) track("modal_open", { modal: "lead_capture" }); }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!name || !email || !phone || !consent) {
      setError("Please complete all fields and consent to continue.");
      return;
    }
    setLoading(true);

    const utms = parseUTMs();

    try {
      localStorage.setItem("lead:TheVault", JSON.stringify({ name, email, phone, consent, utms, ts: Date.now() }));
    } catch {}

    track("form_submit_lead", { form: "lead_capture", method: "client" });

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, consent, utms, notify: NOTIFY_EMAIL }),
      });
    } catch {}

    onSubmit?.({ name, email, phone, consent });
    setLoading(false);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">Book a Free Strategy Call</h2>
          <p className="mt-1 text-sm text-neutral-400">Fill this out to continue to the calendar. All fields are required.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-300" htmlFor="name">Name</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300" htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="(555) 555-5555" />
          </div>
          <label className="flex items-start gap-3 text-sm text-neutral-300">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-emerald-500 focus:ring-emerald-400" />
            <span>I agree to be contacted about my booking and related offers.</span>
          </label>

          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

          <button type="submit" disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:opacity-70">
            {loading ? "Processing..." : "Continue to Calendar"}
          </button>
        </form>
        <button onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-neutral-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          aria-label="Close">✕</button>
      </div>
    </div>
  );
}

// Sections
const LearnList = () => (
  <ul className="grid gap-3 text-sm text-neutral-300 md:grid-cols-2">
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">Edge identification: where repeatable alpha comes from.</li>
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">Entries & exits: rules for precision, not guesses.</li>
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">Risk management: position sizing & downside control.</li>
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">Psychology: consistency and process discipline.</li>
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">Tools & routine: keep it simple, repeatable.</li>
  </ul>
);

const FAQ = () => (
  <div className="space-y-3 text-sm text-neutral-300">
    {[
      ["Do I need prior trading experience?", "No. We cover fundamentals through to advanced execution. You should be comfortable with basic computer use."],
      ["How much time do I need each week?", "Many members spend 3–5 hours weekly. The approach is flexible around your schedule."],
      ["What happens on the call?", "We map your goals, experience, and constraints, then outline the exact next steps. It’s informative—no pressure."],
      ["Is support included?", "Yes. You’ll have access to resources and ongoing guidance options after the call."],
      ["Refunds?", "The call is free. Paid programs include clear terms; no results are guaranteed."],
    ].map(([q, a]) => (
      <details key={q} className="group rounded-xl border border-neutral-800 p-3">
        <summary className="cursor-pointer select-none font-medium text-white group-open:text-emerald-300">{q}</summary>
        <p className="mt-2 text-neutral-300">{a}</p>
      </details>
    ))}
  </div>
);

// Footer
function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 pb-28 pt-12 text-neutral-400">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <p className="text-sm">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/terms" className="hover:text-white">Terms of Service</a>
          <a href="/privacy" className="hover:text-white">Privacy Policy</a>
          <a href="/returns" className="hover:text-white">Returns / Refunds</a>
        </nav>
      </div>
      <div className="mt-6 space-y-2 text-xs leading-relaxed">
        <p>Educational purposes only. Nothing on this site is financial, legal, or tax advice. Trading involves risk of loss and is not suitable for everyone. Past performance does not guarantee future results. You are solely responsible for your trading decisions and outcomes. Review risks including day trading risks.</p>
        <p>Results vary and are not guaranteed. Testimonials or examples may not be typical. We do not promise any specific income or outcome.</p>
        <p>Not affiliated with, sponsored by, or endorsed by YouTube, Google, Bing, Facebook, Meta, or any other platform.</p>
      </div>
    </footer>
  );
}

// Pages
function Hero({ onOpen }) {
  return (
    <section className="relative mx-auto flex min-h-[88svh] w-full max-w-6xl flex-col items-center justify-center px-5 text-center">
      <header className="absolute left-5 top-6 text-sm font-semibold tracking-wide text-neutral-400">
        <span className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-200">{SITE_NAME}</span>
      </header>

      <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-tight text-white md:text-5xl">
        This system will create the next wave of profitable traders in 2025 and beyond.
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-300 md:text-lg">
        Discover my unique approach and how traders like you become consistently profitable.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onOpen}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white shadow-xl transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          aria-haspopup="dialog"
          aria-controls="lead-modal"
        >
          JOIN THE VAULT
        </button>
      </div>

      <a
        href="#learn"
        onClick={() => track("scroll_hint_click")}
        className="absolute bottom-6 inline-flex flex-col items-center text-neutral-400 hover:text-white"
        aria-label="Scroll to learn more"
      >
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_20%,rgba(16,185,129,0.20),rgba(255,255,255,0)_70%)]" />
    </section>
  );
}

function LandingPage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${SITE_NAME} — Free Strategy Call | The Vault`;
      upsertMeta("description", "Minimalist, high-conversion landing for traders. Book a free strategy call to learn the approach, risk management, and execution process.");
      upsertMeta("robots", "index,follow");
      upsertMeta("og:title", `${SITE_NAME} — Free Strategy Call`, true);
      upsertMeta("og:description", "Learn the repeatable process traders use to become consistently profitable. Book a free strategy call.", true);
      upsertMeta("og:type", "website", true);
    }

    if (GA4_ID && typeof document !== "undefined" && !document.getElementById("ga4")) {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
      s1.id = "ga4";
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${GA4_ID}');`;
      document.head.appendChild(s2);
    }

    const utms = parseUTMs();
    if (Object.keys(utms).length && typeof window !== "undefined") {
      localStorage.setItem("UTM:TheVault", JSON.stringify(utms));
    }
  }, []);

  return (
    <main className="min-h-svh bg-neutral-950 text-neutral-200">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_10%,rgba(16,185,129,0.10),rgba(255,255,255,0)_70%)]" />
      <Hero onOpen={() => { setOpen(true); track("cta_click", { id: "join_the_vault" }); }} />
      <section id="learn" className="mx-auto w-full max-w-6xl px-5 pb-16">
        <h3 className="mb-4 text-lg font-semibold text-white">What You’ll Learn</h3>
        <LearnList />
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 pb-10">
        <h3 className="mb-4 text-lg font-semibold text-white">FAQ</h3>
        <FAQ />
      </section>
      <Footer />
      <CookieBanner />
      <LeadModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          const q = typeof window !== "undefined" ? (window.location.search || "") : "";
          if (typeof window !== "undefined") window.location.assign(`/book${q}`);
        }}
      />
    </main>
  );
}

function BookPage() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${SITE_NAME} — Pick a time that works for you`;
      upsertMeta("description", "Book your free strategy call. After you book, you’ll receive confirmation and a short prep checklist.");
    }
    track("page_view_book", { path: "/book" });
  }, []);

  const src = useMemo(() => {
    const params = new URLSearchParams({ hide_landing_page_details: "1" });
    const existing = parseUTMs();
    Object.entries(existing).forEach(([k, v]) => params.set(k, v));
    return `${CALENDLY_URL}?${params.toString()}`;
  }, []);

  return (
    <main className="min-h-svh bg-neutral-950 text-neutral-200">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_10%,rgba(16,185,129,0.10),rgba(255,255,255,0)_70%)]" />
      <div className="mx-auto w-full max-w-5xl px-5 py-12">
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm font-semibold text-neutral-200 hover:bg-neutral-800">{SITE_NAME}</a>
        </header>

        <h1 className="text-2xl font-semibold text-white md:text-3xl">Pick a time that works for you</h1>
        <p className="mt-2 text-sm text-neutral-400">After you book, you’ll get a confirmation and a short prep checklist.</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <iframe title="Calendly Scheduler" src={src} className="h-[80svh] w-full" loading="lazy" />
        </div>

        <section className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-white">FAQ</h3>
          <FAQ />
        </section>

        <Footer />
        <CookieBanner />
      </div>
    </main>
  );
}

// Router wrapper for our simple two-page app
export default function App({ path }) {
  const [current, setCurrent] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : (path || "/")
  );

  useEffect(() => {
    const onPop = () => setCurrent(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100 antialiased">
      {current.startsWith("/book") ? <BookPage /> : <LandingPage />}

      {/* --- Public assets to add in /public ---
         robots.txt:
         User-agent: *
         Allow: /
         Sitemap: https://ausgodvault.com/sitemap.xml

         sitemap.xml:
         <?xml version="1.0" encoding="UTF-8"?>
         <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
           <url><loc>https://ausgodvault.com/</loc></url>
           <url><loc>https://ausgodvault.com/book</loc></url>
           <url><loc>https://ausgodvault.com/terms</loc></url>
           <url><loc>https://ausgodvault.com/privacy</loc></url>
           <url><loc>https://ausgodvault.com/returns</loc></url>
         </urlset>
      ----------------------------------------- */}
    </div>
  );
}
