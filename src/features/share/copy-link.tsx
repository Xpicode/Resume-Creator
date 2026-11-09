"use client";

import { useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <label htmlFor="share-url" className="sr-only">
        Your public link
      </label>
      <input
        id="share-url"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className={`${inputClass} mt-0 min-w-0 flex-1`}
      />
      <button
        type="button"
        className={buttonClass.secondary}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
