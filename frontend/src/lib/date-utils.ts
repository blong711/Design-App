/**
 * Formats a date string to Vietnam (ICT) timezone.
 */
export const formatVietnamDate = (dateString: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        ...options
    });
};

/**
 * Formats a date and time string to Vietnam (ICT) timezone.
 */
export const formatVietnamDateTime = (dateString: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options
    });
};

/**
 * Gets relative time ago (e.g., "5m ago")
 */
export const getTimeAgo = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;

    return formatVietnamDate(date);
};
