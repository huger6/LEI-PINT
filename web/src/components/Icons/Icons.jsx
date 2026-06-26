import React from 'react';
import { PATHS } from './icons-paths';

/**
 * SVG icon component that renders icons by name from the icon registry.
 * @param {string} name - Icon identifier (maps to a path in icons-paths.js).
 * @param {number} [size=24] - Icon size in pixels.
 * @param {string} [color='currentColor'] - Icon fill/stroke color.
 */
// Looks up the named icon paths and renders them as an SVG element.
export default function Icon({
    name,
    size = 24,
    color = 'currentColor',
    className = "",
    strokeWidth = 2,
    ...rest
}) {
    const paths = PATHS[name];

    if (!paths || !Array.isArray(paths)) {
        console.warn(`Icon "${name}" not found or invalid format.`);
        return null;
    }

    const { 'aria-label': _, style, ...svgRest } = rest;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: color, ...(style || {}) }}
            {...svgRest}
        >

            {paths.filter(Boolean).map((pathProps, index) => (
                <path
                    key={`${name}-${index}`}
                    // We assume icons are stroke-based by default, but if the pathProps includes fill="currentColor", it will override the default fill="none"
                    fill="none"
                    stroke={color} // Color is by default relative to the strokez
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"

                    {...pathProps}
                />
            ))}
        </svg>
    );
}