// Notification bell poll interval, stored in localStorage like the sync
// interval so it survives reloads.

export const NOTIFICATION_POLL_INTERVALS = [
    { value: 30 * 1000, labelKey: "notificationPrefs.30sec" },
    { value: 60 * 1000, labelKey: "notificationPrefs.1min" },
    { value: 5 * 60 * 1000, labelKey: "notificationPrefs.5min" },
];

const DEFAULT_POLL_INTERVAL = NOTIFICATION_POLL_INTERVALS[0].value;
const POLL_INTERVAL_KEY = "heroes-notification-poll-ms";

export function getNotificationPollInterval(): number {
    if (typeof window === "undefined") return DEFAULT_POLL_INTERVAL;
    try {
        const raw = window.localStorage.getItem(POLL_INTERVAL_KEY);
        const ms = raw ? Number(raw) : NaN;
        const known = NOTIFICATION_POLL_INTERVALS.find(
            (item) => item.value === ms
        );
        return known ? known.value : DEFAULT_POLL_INTERVAL;
    } catch {
        return DEFAULT_POLL_INTERVAL;
    }
}

export function setNotificationPollInterval(ms: number): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(POLL_INTERVAL_KEY, String(ms));
    } catch {
        /* ignore quota / disabled storage */
    }
}
