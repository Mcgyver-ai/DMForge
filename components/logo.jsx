'use client'

import Link from 'next/link'

/**
 * Brand icon — coral tile with a white filled send/arrow mark.
 * Communicates "DM outreach" instantly, sharp at any size.
 */
function BrandIcon() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center btn-primary">
      <svg viewBox="0 0 24 24" fill="white" className="w-[18px] h-[18px]" aria-hidden="true">
        <path d="M3 20l19-8L3 4v6l13 2-13 2v6z" />
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
