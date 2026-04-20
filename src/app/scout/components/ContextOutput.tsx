'use client';

import { useState } from 'react';
import type { ScoutData } from '../lib/types';
import { formatBlock } from '../lib/format-block';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorCard from './ErrorCard';
import type { FetchStatus } from '../hooks/useScoutData';

interface Props {
  data: ScoutData | null;
  status: FetchStatus;
  errors: Partial<Record<keyof FetchStatus, string>>;
  radiusKm: number;
  onRegenerate: () => void;
}

export default function ContextOutput({ data, status, errors, radiusKm, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const isLoading = Object.values(status).some(s => s === 'loading');

  const block = data ? formatBlock(data, radiusKm) : null;

  async function handleCopy() {
    if (!block) return;
    await navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!block || !navigator.share) return;
    await navigator.share({ text: block });
  }

  if (!isLoading && !data && !Object.values(errors).some(Boolean)) return null;

  return (
    <div className="space-y-3">
      {/* Error cards for each source */}
      {errors.geo && <ErrorCard message={`Location: ${errors.geo}`} />}
      {errors.weather && <ErrorCard message={`Weather: ${errors.weather}`} />}
      {errors.pois && <ErrorCard message={`POIs: ${errors.pois}`} />}
      {errors.drive && <ErrorCard message={`Drive time: ${errors.drive}`} />}

      {isLoading && !data && <LoadingSkeleton />}

      {block && (
        <>
          <CopyBar copied={copied} onCopy={handleCopy} onShare={handleShare} onRegenerate={onRegenerate} />
          <pre className="rounded-lg bg-black/60 border border-white/10 p-4 text-xs text-white/80 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
            {block}
          </pre>
          <CopyBar copied={copied} onCopy={handleCopy} onShare={handleShare} onRegenerate={onRegenerate} />
        </>
      )}
    </div>
  );
}

function CopyBar({ copied, onCopy, onShare, onRegenerate }: {
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onRegenerate: () => void;
}) {
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div className="flex gap-2">
      <button
        onClick={onCopy}
        className="flex-1 min-h-[44px] rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {hasShare && (
        <button
          onClick={onShare}
          className="min-h-[44px] px-4 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
        >
          Share
        </button>
      )}
      <button
        onClick={onRegenerate}
        className="min-h-[44px] px-4 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
      >
        ↺
      </button>
    </div>
  );
}
