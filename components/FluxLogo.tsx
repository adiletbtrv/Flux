import React, { memo } from 'react';

const FluxLogo = memo(function FluxLogo({ size = 36 }: { size?: number }) {
    return (
        <div
            style={{ width: size, height: size }}
            className="bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/25 flex-shrink-0"
        >
            <svg
                width={size * 0.56}
                height={size * 0.56}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path
                    d="M3 6h10.5M10 3l3.5 3L10 9"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M17 14H6.5M10 11l-3.5 3L10 17"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
});

export default FluxLogo;