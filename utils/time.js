/**
 * Time utility functions for Tu Tiên Bot
 * Handles time formatting, duration calculations, and scheduling
 */

/**
 * Format duration in milliseconds to human readable string
 * @param {number} ms - Duration in milliseconds
 * @param {boolean} short - Use short format
 * @returns {string} Formatted duration
 */
function formatDuration(ms, short = false) {
    if (ms < 0) return short ? '0s' : '0 giây';
    
    const units = short ? 
        { d: 86400000, h: 3600000, m: 60000, s: 1000 } :
        { ngày: 86400000, giờ: 3600000, phút: 60000, giây: 1000 };
    
    const parts = [];
    
    for (const [unit, value] of Object.entries(units)) {
        if (ms >= value) {
            const amount = Math.floor(ms / value);
            parts.push(`${amount}${short ? unit : ` ${unit}`}`);
            ms %= value;
        }
    }
    
    if (parts.length === 0) {
        return short ? '0s' : '0 giây';
    }
    
    return parts.slice(0, 2).join(short ? ' ' : ', ');
}

/**
 * Format time until specific date
 * @param {Date|string} targetDate - Target date
 * @param {boolean} short - Use short format
 * @returns {string} Time remaining
 */
function timeUntil(targetDate, short = false) {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) {
        return short ? 'Xong' : 'Đã hoàn thành';
    }
    
    return formatDuration(diff, short);
}

/**
 * Format time since specific date
 * @param {Date|string} pastDate - Past date
 * @param {boolean} short - Use short format
 * @returns {string} Time elapsed
 */
function timeSince(pastDate, short = false) {
    const past = new Date(pastDate);
    const now = new Date();
    const diff = now.getTime() - past.getTime();
    
    if (diff <= 0) {
        return short ? '0s' : 'vừa xong';
    }
    
    return formatDuration(diff, short) + (short ? ' ago' : ' trước');
}

/**
 * Get time of day greeting in Vietnamese
 * @param {Date} date - Date to check, defaults to now
 * @returns {string} Time-appropriate greeting
 */
function getTimeGreeting(date = new Date()) {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) {
        return 'Chào buổi sáng';
    } else if (hour >= 12 && hour < 17) {
        return 'Chào buổi chiều';
    } else if (hour >= 17 && hour < 22) {
        return 'Chào buổi tối';
    } else {
        return 'Chúc ngủ ngon';
    }
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
    const checkDate = new Date(date);
    const today = new Date();
    
    return checkDate.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
function isYesterday(date) {
    const checkDate = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return checkDate.toDateString() === yesterday.toDateString();
}

/**
 * Get relative time string
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    const targetDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - targetDate.getTime();
    
    if (isToday(date)) {
        return `Hôm nay ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday(date)) {
        return `Hôm qua ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        // Within a week
        return targetDate.toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        return targetDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Add time to date
 * @param {Date|string} date - Base date
 * @param {Object} duration - Duration object with properties like days, hours, minutes, seconds
 * @returns {Date} New date with added time
 */
function addTime(date, duration) {
    const result = new Date(date);
    
    if (duration.days) result.setDate(result.getDate() + duration.days);
    if (duration.hours) result.setHours(result.getHours() + duration.hours);
    if (duration.minutes) result.setMinutes(result.getMinutes() + duration.minutes);
    if (duration.seconds) result.setSeconds(result.getSeconds() + duration.seconds);
    if (duration.milliseconds) result.setMilliseconds(result.getMilliseconds() + duration.milliseconds);
    
    return result;
}

/**
 * Get start of day
 * @param {Date|string} date - Date to get start of day for
 * @returns {Date} Start of day
 */
function getStartOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day
 * @param {Date|string} date - Date to get end of day for
 * @returns {Date} End of day
 */
function getEndOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Calculate cultivation time remaining
 * @param {string} startTime - Cultivation start time ISO string
 * @param {number} durationMs - Cultivation duration in milliseconds
 * @returns {Object} Cultivation time info
 */
function getCultivationTimeInfo(startTime, durationMs = 30 * 60 * 1000) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMs);
    const now = new Date();
    
    const elapsed = now.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / durationMs) * 100));
    
    return {
        started: start,
        willEnd: end,
        elapsed: Math.max(0, elapsed),
        remaining: Math.max(0, remaining),
        progress: progress,
        isComplete: remaining <= 0,
        formattedElapsed: formatDuration(Math.max(0, elapsed)),
        formattedRemaining: formatDuration(Math.max(0, remaining)),
        formattedProgress: `${progress.toFixed(1)}%`
    };
}

/**
 * Get cooldown time info
 * @param {string} lastUsedTime - Last used time ISO string
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 * @returns {Object} Cooldown info
 */
function getCooldownInfo(lastUsedTime, cooldownMs) {
    if (!lastUsedTime) {
        return {
            isOnCooldown: false,
            remaining: 0,
            formattedRemaining: '0 giây'
        };
    }
    
    const lastUsed = new Date(lastUsedTime);
    const now = new Date();
    const elapsed = now.getTime() - lastUsed.getTime();
    const remaining = Math.max(0, cooldownMs - elapsed);
    
    return {
        isOnCooldown: remaining > 0,
        remaining,
        formattedRemaining: formatDuration(remaining),
        canUse: remaining <= 0
    };
}

/**
 * Generate timestamp for file names
 * @param {Date} date - Date to format
 * @returns {string} Timestamp string safe for filenames
 */
function getFileTimestamp(date = new Date()) {
    return date.toISOString()
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .slice(0, -1); // Remove the last character (Z)
}

/**
 * Parse Vietnamese time input
 * @param {string} input - Time input like "30 phút", "2 giờ", "1 ngày"
 * @returns {number} Duration in milliseconds
 */
function parseVietnameseTime(input) {
    const timeUnits = {
        'giây': 1000,
        'phút': 60000,
        'giờ': 3600000,
        'ngày': 86400000,
        's': 1000,
        'm': 60000,
        'h': 3600000,
        'd': 86400000
    };
    
    const regex = /(\d+)\s*(giây|phút|giờ|ngày|s|m|h|d)/i;
    const match = input.match(regex);
    
    if (!match) return 0;
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return amount * (timeUnits[unit] || 0);
}

/**
 * Get next reset time (daily at midnight)
 * @param {Date} fromDate - Date to calculate from
 * @returns {Date} Next reset time
 */
function getNextResetTime(fromDate = new Date()) {
    const nextReset = new Date(fromDate);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    return nextReset;
}

/**
 * Check if it's time for daily reset
 * @param {string} lastResetTime - Last reset time ISO string
 * @returns {boolean} True if it's time for reset
 */
function shouldDailyReset(lastResetTime) {
    if (!lastResetTime) return true;
    
    const lastReset = new Date(lastResetTime);
    const today = getStartOfDay();
    
    return lastReset < today;
}

/**
 * Format cultivation session time
 * @param {Object} session - Cultivation session with start and end times
 * @returns {string} Formatted session info
 */
function formatCultivationSession(session) {
    if (!session.cultivationStartTime) {
        return 'Chưa bắt đầu tu luyện';
    }
    
    const timeInfo = getCultivationTimeInfo(session.cultivationStartTime);
    
    if (timeInfo.isComplete) {
        return `✅ Hoàn thành (${timeInfo.formattedElapsed})`;
    } else {
        return `🧘‍♂️ Tu luyện... ${timeInfo.formattedProgress} (còn ${timeInfo.formattedRemaining})`;
    }
}

module.exports = {
    formatDuration,
    timeUntil,
    timeSince,
    getTimeGreeting,
    isToday,
    isYesterday,
    getRelativeTime,
    addTime,
    getStartOfDay,
    getEndOfDay,
    getCultivationTimeInfo,
    getCooldownInfo,
    getFileTimestamp,
    parseVietnameseTime,
    getNextResetTime,
    shouldDailyReset,
    formatCultivationSession
};
