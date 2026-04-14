// /app/videos/page.tsx
// Add your YouTube video IDs to the VIDEOS array below.
// The page works immediately as a placeholder until you have content.

import VideoGrid from '@/components/VideoGrid'
import EmailCapture from '@/components/EmailCapture'

export const metadata = {
  title: 'Videos',
  description: 'Films, edits, and field notes from StudioTJ',
}

// ─── Add your YouTube videos here ───────────────────────────────────────────
// Get the ID from a YouTube URL: youtube.com/watch?v=THIS_PART
const VIDEOS: {id:string;title:string;description:string;tags:string[];date:string}[] = [
  // {
  //   id: 'dQw4w9WgXcQ',
  //   title: 'Ancient Wall — Leiden',
  //   description: 'Sint-Petruskerk at dawn. Brick, shadow, and 800 years of weather.',
  //   tags: ['architecture', 'leiden', 'monochrome'],
  //   date: '2025-07-30',
  // },
  // {
  //   id: 'your_video_id',
  //   title: 'Under Construction — Amsterdam Bijlmer',
  //   description: 'A building becoming itself.',
  //   tags: ['urban', 'amsterdam', 'colour'],
  //   date: '2025-08-10',
  // },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  return (
    <div className="pt-24 pb-0">
      {/* Header */}
      <div className="px-6 md:px-12 mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-6">
          Film
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          Moving images from the same places the still work comes from.
          Architecture, atmosphere, and the Dutch light that makes both possible.
        </p>
      </div>

      {/* Video grid or empty state */}
      <VideoGrid videos={VIDEOS} />

      {/* Email capture — dark band at the bottom */}
      <div className="mt-24">
        <EmailCapture
          variant="dark"
          headline="A list for later"
          subline="Leave your address and it joins the list. When StudioTJ has something worth sending, this is how you'll hear about it first."
        />
      </div>
    </div>
  )
}
