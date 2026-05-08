export function capitalizeName(name) {
    return String(name)
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function firstAndLastName(name) {
    const parts = String(name ?? '')
        .trim()
        .split(/\s+/g)
        .filter(Boolean);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];

    return `${parts[0]} ${parts[parts.length - 1]}`;
}

export default function hideEmail(email) {
    const [user, domain] = email.split("@");

    if (!user || !domain) return "";

    if (user.length <= 3) {
        return `${user[0]}***${user.length > 1 ? user.slice(-1) : ""}@${domain}`;
    }

    const startLen = Math.ceil(user.length * 0.3);
    const endLen = Math.ceil(user.length * 0.1);

    const start = user.slice(0, startLen);
    const end = user.slice(-endLen);

    return `${start}***${end}@${domain}`;
}
