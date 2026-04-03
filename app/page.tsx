"use client";

import { useState } from "react";

const PROPOSAL_PREVIEW = `Dear Sarah,

Thank you for reaching out about your wedding on June 14th at The Grand Oak Estate. I'm thrilled at the possibility of capturing your special day.

---

## What's Included — Golden Hour Package ($2,800)

- 8 hours of coverage (ceremony + reception)
- Second shooter included
- 500+ edited high-resolution images
- Private online gallery (1 year)
- Print release for personal use
- Engagement session (60 min)

---

## Timeline

- Ceremony: 4:00 PM
- Cocktail Hour: 5:30 PM
- Reception & First Dance: 7:00 PM

---

## To Book Your Date

A 25% retainer ($700) reserves your date exclusively. Final balance is due 2 weeks before the wedding.

I only take 2 weddings per weekend — your date is still available as of today.

Looking forward to hearing from you,
**Alex Rivera Photography**`;

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">Draftly</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Get Early Access
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-amber-200">
          <span>✦</span>
          <span>Built for photographers</span>
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6 text-gray-900">
          Stop writing proposals.<br />
          <span className="text-amber-500">Start booking clients.</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          You spend 2–4 hours writing every client proposal — and most don&apos;t even reply.
          Draftly generates a professional, personalized photography proposal in{" "}
          <strong className="text-gray-800">under 60 seconds</strong>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-black text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg cursor-pointer"
          >
            Generate My First Proposal Free →
          </button>
          <span className="text-sm text-gray-400">No credit card · 3 free proposals/month</span>
        </div>
      </section>

      {/* Proposal Preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-4 text-xs text-gray-400 font-mono">Proposal generated in 0:47</span>
          </div>
          <div className="grid md:grid-cols-2 gap-0">
            {/* Input */}
            <div className="p-6 border-r border-gray-200 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Input</p>
              <div className="space-y-4">
                {[
                  ["Client name", "Sarah Johnson"],
                  ["Event type", "Wedding"],
                  ["Event date", "June 14, 2025"],
                  ["Venue", "The Grand Oak Estate"],
                  ["Package", "Golden Hour ($2,800)"],
                  ["Hours", "8 hours + second shooter"],
                  ["Retainer", "25%"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-gray-800 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="p-6 bg-white">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Generated Proposal</p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{PROPOSAL_PREVIEW}</div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">↑ Real output. Editable. Export to PDF or send as link.</p>
      </section>

      {/* Pain points */}
      <section className="bg-gray-50 border-y border-gray-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Every photographer knows this pain</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "⏱️",
                problem: "3 hours per proposal",
                solution: "You're a photographer, not a copywriter. But every inquiry requires a professional write-up from scratch.",
              },
              {
                emoji: "📋",
                problem: "Copy-paste feels wrong",
                solution: "Sending the same template to every client? They can tell. Generic proposals lose bookings.",
              },
              {
                emoji: "😓",
                problem: "High season overwhelm",
                solution: "30 inquiries in June? Writing proposals becomes a part-time job at exactly the wrong time.",
              },
            ].map(({ emoji, problem, solution }) => (
              <div key={problem} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{problem}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">From inquiry to proposal in 60 seconds</h2>
        <p className="text-center text-gray-500 mb-12">No templates to fill. No blank pages. Just tell Draftly about the client.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Paste the inquiry",
              desc: "Drop in the client's message or fill 5 quick fields — date, venue, package, budget.",
            },
            {
              step: "2",
              title: "AI drafts the proposal",
              desc: "Draftly writes a professional, personalized proposal with your pricing, packages, and tone.",
            },
            {
              step: "3",
              title: "Send & get booked",
              desc: "Edit if you want, then send a link or export to PDF. Clients sign and pay right there.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 border-y border-gray-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What photographers are saying</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "I used to spend Sunday evenings writing proposals. Now I do it between clients on my phone. My booking rate went up because I reply faster.",
                name: "Emily R.",
                title: "Wedding photographer, Austin TX",
              },
              {
                quote: "The proposals look way more professional than what I was sending before. A bride told me she booked me over two others because my proposal felt personal.",
                name: "Marcus D.",
                title: "Portrait & wedding photographer, NYC",
              },
            ].map(({ quote, name, title }) => (
              <div key={name} className="bg-white rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 italic mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-gray-400">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-center text-gray-500 mb-12">One booked wedding pays for 2 years of Draftly Pro.</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="rounded-xl border border-gray-200 p-8">
            <p className="font-semibold text-lg mb-1">Free</p>
            <p className="text-4xl font-bold mb-1">$0</p>
            <p className="text-sm text-gray-400 mb-6">forever</p>
            <ul className="space-y-3 text-sm text-gray-600">
              {["3 proposals per month", "All proposal types", "PDF export", "Shareable link"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(true)}
              className="w-full mt-8 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
            >
              Start Free
            </button>
          </div>

          <div className="rounded-xl border-2 border-amber-500 p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </span>
            <p className="font-semibold text-lg mb-1">Pro</p>
            <p className="text-4xl font-bold mb-1">$9.9</p>
            <p className="text-sm text-gray-400 mb-6">per month</p>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                "Unlimited proposals",
                "Custom branding & logo",
                "Follow-up email drafts",
                "Client e-signature",
                "Package templates library",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-amber-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(true)}
              className="w-full mt-8 bg-amber-500 text-white font-semibold py-3 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Get Early Access — $9.9/mo
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black text-white py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Send your next proposal in 60 seconds.</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Join photographers who stopped losing bookings to slow, generic proposals.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 text-black font-bold text-lg px-10 py-4 rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
        >
          Generate My First Proposal Free →
        </button>
        <p className="text-gray-500 text-sm mt-4">No credit card required</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <p>© 2025 Draftly · Built for photographers</p>
      </footer>

      {/* Waitlist Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            {!submitted ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">✦</div>
                  <h3 className="text-2xl font-bold mb-2">Get Early Access</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Draftly is launching soon. Leave your email and we&apos;ll notify you the moment
                    it&apos;s ready — and lock in the{" "}
                    <strong>$9.9/month founding rate</strong> (price will increase at launch).
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? "Saving..." : "Notify Me & Lock My Rate →"}
                  </button>
                </form>
                <p className="text-center text-xs text-gray-400 mt-4">No spam. Unsubscribe anytime.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">You&apos;re in!</h3>
                <p className="text-gray-500 text-sm">
                  We&apos;ll email you at <strong className="text-gray-800">{email}</strong> the moment
                  Draftly is ready. Your $9.9/month rate is reserved.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
