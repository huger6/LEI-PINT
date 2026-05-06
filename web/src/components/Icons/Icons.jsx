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
    const iconPathData = PATHS[name];

    if (!iconPathData) {
        console.warn(`Icon "${name}" not found.`);
        return null;
    }

    const paths = Array.isArray(iconPathData) ? iconPathData : [iconPathData];
    const fallbackLabel = typeof name === 'string' ? name.replace(/[-_]/g, ' ') : '';
    const translatedLabel = t(`icons.${name}`, { defaultValue: fallbackLabel });
    const ariaLabel = typeof label === 'string' ? label : translatedLabel;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            role="img"
            aria-label={ariaLabel}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
        >
            {ariaLabel && <title>{ariaLabel}</title>}

            {paths.filter(Boolean).map((path, index) => (
                <path
                    key={`${name}-${index}`}
                    d={path}
                />
            ))}
        </svg>
    );
}
