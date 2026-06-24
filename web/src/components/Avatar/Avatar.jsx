import { useEffect, useMemo, useState } from 'react';
import styles from './Avatar.module.css';

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * User avatar with image fallback to initials.
 * @param {string} [src] - Profile image URL. Falls back to initials on error.
 * @param {string} [name] - User's name, used to generate initials.
 * @param {number} [size=36] - Avatar diameter in pixels.
 */
export default function Avatar({
    src,
    name,
    size = 36,
    className = '',
    fallbackLabel
}) {
    const [hasImageError, setHasImageError] = useState(false);
    const shouldShowImage = Boolean(src) && !hasImageError;

    useEffect(() => {
        setHasImageError(false);
    }, [src]);

    const avatarSize = useMemo(
        () => ({ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.38}px` }),
        [size]
    );

    return (
        <div
            className={`${styles.avatar} ${className}`.trim()}
            style={avatarSize}
            aria-hidden={!fallbackLabel && !name}
        >
            {shouldShowImage ? (
                <img
                    className={styles.avatarImage}
                    src={src}
                    alt={name ? `${name} profile` : 'User profile'}
                    onError={() => setHasImageError(true)}
                />
            ) : (
                <div className={styles.fallback} role="img" aria-label={fallbackLabel || 'User avatar'}>
                    {getInitials(name)}
                </div>
            )}
        </div>
    );
}
