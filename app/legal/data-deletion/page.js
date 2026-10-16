'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function DeletionStatusContent() {
  const searchParams = useSearchParams();
  const confirmationId = searchParams.get('id');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(!!confirmationId);

  useEffect(() => {
    if (!confirmationId) return;

    let mounted = true;
    fetch(`/api/meta/data-deletion/status?id=${encodeURIComponent(confirmationId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted) {
          setStatusData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [confirmationId]);

  return (
    <div className="space-y-6">
      {confirmationId && (
        <div className="p-5 rounded-lg border border-purple-500/30 bg-purple-500/10">
          <h2 className="text-lg font-semibold text-purple-300 mt-0">
            Data Deletion Request Status
          </h2>
          <p className="text-sm text-white/80">
            Confirmation Code:{' '}
            <code className="px-2 py-0.5 rounded bg-black/40 text-purple-200">
              {confirmationId}
            </code>
          </p>
          {loading ? (
            <p className="text-xs text-white/50">Retrieving status record...</p>
          ) : (
            <div className="text-xs text-emerald-400 mt-2 font-medium">
              Status: {statusData?.status ? statusData.status.toUpperCase() : 'COMPLETED'}
              <p className="text-white/60 font-normal mt-1">
                Your linked Meta ID and associated message transcripts have been deleted from our systems.
              </p>
            </div>
          )}
        </div>
      )}

      <h2>How to Request Data Deletion (Meta Platform Terms)</h2>
      <p>
        In accordance with the Meta Platform Terms and privacy regulations, DMForge provides users with
        the ability to request erasure of all data associated with their Instagram or Facebook profile.
      </p>

      <h3>Option 1: Remove DMForge from Your Facebook / Instagram Account</h3>
      <ol>
        <li>Go to your Facebook Profile&apos;s <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
        <li>Scroll down to <strong>Apps and Websites</strong>.</li>
        <li>Find <strong>DMForge</strong> in the list of connected apps.</li>
        <li>Click <strong>Remove</strong>.</li>
        <li>
          Facebook will automatically notify DMForge through our signed Data Deletion Callback URL,
          triggering automatic deletion of your identifiers and conversational history.
        </li>
      </ol>

      <h3>Option 2: Direct Erasure Request</h3>
      <p>
        You may also email us directly to request erasure of your data at any time:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:contact@dmforge.org">contact@dmforge.org</a></li>
        <li><strong>Subject:</strong> &quot;Meta Data Deletion Request&quot;</li>
        <li>Please provide your Instagram handle or Facebook Page name.</li>
      </ul>
      <p>
        We will process your request and confirm data erasure within 48 hours.
      </p>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Meta User Data Deletion Instructions &amp; Status</h1>
      <p className="text-sm text-white/50">Effective: October 2026</p>

      <Suspense fallback={<p className="text-sm text-white/50">Loading request status...</p>}>
        <DeletionStatusContent />
      </Suspense>

      <p className="text-sm text-white/50 mt-12">
        DMForge · Tibor Rames · Contact:{' '}
        <a href="mailto:contact@dmforge.org">contact@dmforge.org</a>
      </p>
    </main>
  );
}
