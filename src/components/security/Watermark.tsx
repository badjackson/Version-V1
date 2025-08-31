'use client';

import { useEffect, useState } from 'react';

export default function Watermark() {
  const [fingerprint, setFingerprint] = useState('');
  const [dateString, setDateString] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Create a simple fingerprint
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent.slice(-10);
    const fp = btoa(`${timestamp}-${userAgent}`).slice(-8);
    setFingerprint(fp);
    setDateString(new Date().toLocaleDateString());
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="watermark">
      TITANIUM TUNISIA OPEN - {dateString} - {fingerprint}
    </div>
  );
}