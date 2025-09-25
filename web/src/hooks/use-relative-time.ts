import { useMemo } from "react";
import { t } from "i18next";

function formatRelativeTime(date: Date, now: Date) {
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) {
        return t("time.just_now");
    } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return t("time.minutes_ago", { count: mins });
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return t("time.hours_ago", { count: hours });
    } else {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        if (y === now.getFullYear()) {
            return t("time.date_md", { month: m, day: d });
        } else {
            return t("time.date_ymd", { year: y, month: m, day: d });
        }
    }
}

export function useRelativeTime(dateString?: string) {
    return useMemo(() => {
        const date = new Date(dateString ?? "");
        return formatRelativeTime(date, new Date());
    }, [dateString]);
}