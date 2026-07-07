'use client'

import Link from 'next/link'

/**
 * Brand icon — coral-to-orange gradient tile with a white speech-bubble
 * containing a flame, matching the official DMForge app icon.
 */
function BrandIcon() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center btn-primary glow-coral relative">
      {/* White speech bubble */}
      <svg
        viewBox="0 0 24 24"
        fill="white"
        className="w-5 h-5"
        aria-hidden="true"
      >
        {/* Rounded speech bubble shape */}
        <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" fill="white" />
        {/* Flame inside the bubble */}
        <path
          d="M12 7q.6 2.4 2.4 3.9t1.8 3.3a.6.6 0 0 1-8.4 0 3 3 0 0 1 .6-1.8.6.6 0 0 0 3 0c0-1.2-.9-1.8-.9-3q0-1.2 1.5-2.4"
          fill="url(#flame-grad)"
        />
        <defs>
          <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FF4D6D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

/**
 * Brand wordmark — "DM" in coral primary, "Forge" in muted text,
 * matching the official DMForge wordmark style.
 */
function BrandName() {
  return (
    <span className="font-display font-bold text-xl tracking-tight">
      <span className="text-[#FF4D6D]">DM</span>
      <span className="text-[#A0A0C8]">Forge</span>
    </span>
  )
}

/**
 * Shared brand logo — speech-bubble-flame icon tile + "DMForge" wordmark.
 * Matches the official DMForge brand (coral gradient tile, speech bubble with flame,
 * "DM" in coral + "Forge" in muted, Space Grotesk display font).
 *
 * @param {{ href?: string, whiteLabel?: { logoUrl?: string, brandName?: string, hideParentBranding?: boolean } }} props
 *   - href: where the logo links (default "/")
 *   - whiteLabel: optional white-label overrides from agency settings
 */
export function Logo({ href = '/', whiteLabel }) {
  const mark = whiteLabel?.logoUrl ? (
    <img src={whiteLabel.logoUrl} alt={whiteLabel.brandName || 'logo'} className="h-7 w-auto rounded" />
  ) : (
    <BrandIcon />
  )

  const wordmark = whiteLabel?.brandName ? (
    <span className="font-display font-bold text-xl tracking-tight">{whiteLabel.brandName}</span>
  ) : (
    <BrandName />
  )

  return (
    <Link href={href} className="inline-flex items-center gap-2">
      {mark}
      {wordmark}
      {whiteLabel && !whiteLabel.hideParentBranding && (
        <span className="text-[10px] text-[#A0A0C8]">by DMForge</span>
      )}
    </Link>
  )
}
