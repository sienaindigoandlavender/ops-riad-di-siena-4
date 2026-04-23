"use client";

import Link from "next/link";
import { ESSENTIALS } from "@/lib/guide-data";

export default function EssentialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-10 pb-6 max-w-2xl mx-auto">
        <Link href="/guides" className="text-[12px] text-ink-tertiary hover:text-ink-secondary transition-colors font-light">
          ← Back
        </Link>
        <h1 className="text-[28px] font-light text-ink-primary mt-4 tracking-[-0.01em]">Essentials</h1>
        <p className="text-[14px] text-ink-tertiary mt-2 font-light">
          {ESSENTIALS.length} things every first-timer should know
        </p>
      </div>

      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-4">
        {ESSENTIALS.map((item, idx) => (
          <div key={item.slug} className="border border-border-subtle p-5">
            <div className="flex items-start gap-4">
              <span className="text-[13px] text-ink-tertiary font-light mt-0.5 shrink-0 w-5">{idx + 1}</span>
              <div>
                <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-1">{item.category}</p>
                <h2 className="text-[15px] text-ink-primary font-normal leading-snug">{item.title}</h2>
                <p className="text-[13px] text-ink-secondary mt-2 leading-relaxed font-light">{item.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
