import React from 'react';

interface Props {
    className?: string;
}

/**
 * Custom dual-tone "Compare" icon — two overlapping cards with a swap arrow.
 * Designed on a 24×24 grid with 2px rounded strokes.
 */
export default function CompareIcon({ className = 'w-5 h-5' }: Props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Back card (outline only) */}
            <rect
                x="8"
                y="3"
                width="13"
                height="16"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Front card (filled + outline) */}
            <rect
                x="3"
                y="5"
                width="13"
                height="16"
                rx="2.5"
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Swap arrows */}
            {/* Arrow pointing right */}
            <path
                d="M7 11h4.5m0 0L9.5 9m2 2L9.5 13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Arrow pointing left */}
            <path
                d="M17 14h-4.5m0 0l2-2m-2 2l2 2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
