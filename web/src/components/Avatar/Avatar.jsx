import { useEffect, useMemo, useState } from 'react';
import Icon from '../Icons/Icons';
import styles from './Avatar.module.css';

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
        () => ({ width: `${size}px`, height: `${size}px` }),
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
                    <Icon name="user-circle" size={size * 0.64} />
                </div>
            )}
        </div>
    );
}
