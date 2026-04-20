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

  const geoLoading = status.geo === 'loading';
  const poisFailed = status.pois === 'error';
  // Copy is active once location + sun are resolved and weather is no longer loading
  const canCopy = !!data && status.geo === 'done' && status.weather !== 'loading';

  const block = data ? formatBlock(data, radiusKm, poisFailed) : null;

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

  // Nothing to show until geo has been attempted
  if (status.geo === 'idle') return null;

  return (
    <div className="space-y-3">
      {errors.geo && <ErrorCard message={`Location: ${errors.geo}`} />}
      {errors.weather && <ErrorCard message={`Weather: ${errors.weather}`} />}
      {errors.drive && <ErrorCard message={`Drive time: ${errors.drive}`} />}
      {poisFailed && (
        <ErrorCard
          message={
            errors.pois === 'overpass_unavailable'
              ? 'POIs unavailable right now — public OSM servers under heavy load. Rest of the context block is usable.'
              : `POIs: ${errors.pois}`
          }
        />
      )}

      {geoLoading && <LoadingSkeleton />}

      {block && (
        <>
          <CopyBar
            copied={copied}
            canCopy={canCopy}
            poisLoading={status.pois === 'loading'}
            onCopy={handleCopy}
            onShare={handleShare}
            onRegenerate={onRegenerate}
          />
          <pre className="rounded-lg bg-black/60 border border-white/10 p-4 text-xs text-white/80 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
            {block}
          </pre>
          <CopyBar
            copied={copied}
            canCopy={canCopy}
            poisLoading={status.pois === 'loading'}
            onCopy={handleCopy}
            onShare={handleShare}
            onRegenerate={onRegenerate}
          />
        </>
      )}
    </div>
  );
}

function CopyBar({ copied, canCopy, poisLoading, onCopy, onShare, onRegenerate }: {
  copied: boolean;
  canCopy: boolean;
  poisLoading: boolean;
  onCopy: () => void;
  onShare: () => void;
  onRegenerate: () => void;
}) {
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={onCopy}
        disabled={!canCopy}
        className="flex-1 min-h-[44px] rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {poisLoading && (
        <span className="text-xs text-white/40 whitespace-nowrap">POIs loading…</span>
      )}
      {hasShare && (
        <button
          onClick={onShare}
          disabled={!canCopy}
          className="min-h-[44px] px-4 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
