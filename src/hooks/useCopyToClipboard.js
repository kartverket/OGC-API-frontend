'use client'

import { useState } from 'react';

export default function useCopyToClipboard(resetDelay = 2000) {
    const [copied, setCopied] = useState(false);

    function copy(text) {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
    }

    return { copied, copy };
}
