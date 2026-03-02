import React from 'react';

interface Props {
    className?: string;
}

/**
 * Custom dual-tone "Recently Viewed" icon — a document page with a clock badge.
 * Designed on a 24×24 grid with 2px rounded strokes.
 */
export default function RecentlyViewedIcon({ className = 'w-5 h-5' }: Props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Document body */}
            <path
                d="M4 5.5A2.5 2.5 0 0 1 6.5 3H14l5 5v10.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18.5V5.5Z"
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Document fold */}
            <path
                d="M14 3v3.5a1.5 1.5 0 0 0 1.5 1.5H19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Text lines on document */}
            <line x1="8" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="8" y1="15.5" x2="14" y2="15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            {/* Clock badge (bottom-right) */}
            <circle
                cx="17.5"
                cy="17.5"
                r="4"
                fill="white"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            {/* Clock hands */}
            <path
                d="M17.5 15.5v2l1.5 1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
