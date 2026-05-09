import React from 'react';
import { useTranslation } from 'react-i18next';
import { PATHS } from './icons-paths';

export default function Icon({
    name,
    size = 24,
    color = 'currentColor',
    className = "",
    label,
    strokeWidth = 2,
    ...rest
}) {
    const { t } = useTranslation();
    const paths = PATHS[name];

    if (!paths || !Array.isArray(paths)) {
        console.warn(`Icon "${name}" not found or invalid format.`);
        return null;
    }

    const fallbackLabel = typeof name === 'string' ? name.replace(/[-_]/g, ' ') : '';
    const translatedLabel = t(`icons.${name}`, { defaultValue: fallbackLabel });
    const ariaLabel = typeof label === 'string' ? label : translatedLabel;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            role="img"
            aria-label={ariaLabel}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: color, ...(rest.style || {}) }}
            {...rest}
        >
            {ariaLabel && <title>{ariaLabel}</title>}

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