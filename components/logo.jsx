'use client'

import Link from 'next/link'

/**
 * Brand icon — solid coral tile with a white anvil mark. The wordmark
 * already spells out "DM", so the icon carries "Forge" on its own —
 * no flame, no gradient, one clean shape that reads at 32px.
 */
function BrandIcon() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center btn-primary">
      <svg viewBox="0 0 24 24" fill="white" className="w-[19px] h-[19px]" aria-hidden="true">
        <polygon points="3,10 9,8 20,8 20,12 9,12" />
        <rect x="12" y="12" width="4" height="3" />
        <polygon points="10,15 18,15 20,19 8,19" />
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
 * Shared brand logo — coral anvil-tile icon + "DMForge" wordmark.
 * "DM" in coral + "Forge" in muted, Fraunces display font.
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
