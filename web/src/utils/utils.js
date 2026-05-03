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
