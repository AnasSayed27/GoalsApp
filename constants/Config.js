/**
 * App-wide configuration constants.
 * Single source of truth for magic numbers and thresholds.
 */

// --- 12-Week Year System ---
export const DAYS_PER_WEEK = 6; // 12-Week Year uses 6 working days per week (Mon-Sat)
export const DEFAULT_GOAL_WEEKS = 12;

// --- Streak Thresholds ---
export const STREAK_WIN_THRESHOLD_HOURS = 2.5; // Minimum hours to count as a "day won"
export const STREAK_IDEAL_HOURS_PER_DAY = 4.5; // Ideal target hours per day for trend calculation
export const STREAK_MAX_AVG_HOURS_TARGET = 5;   // Target avg hours on active days for max intensity score

// --- Tier System ---
export const TIER_CONSISTENCY_MAX_POINTS = 60;
export const TIER_INTENSITY_MAX_POINTS = 40;

export const TIERS = [
    { min: 90, title: 'Titan',    icon: '🏆', color: '#f1c40f' },
    { min: 70, title: 'Warrior',  icon: '⚔️', color: '#e67e22' },
    { min: 50, title: 'Guardian', icon: '🛡️', color: '#3498db' },
    { min: 25, title: 'Novice',   icon: '🌱', color: '#2ecc71' },
    { min: 0,  title: 'Slacker',  icon: '😴', color: '#95a5a6' },
];

// --- Congratulation Messages ---
export const CONGRATS_MESSAGES = [
    'Great job! 🎉',
    'Well done! 💪',
    "You're on fire! 🔥",
    'Keep it up! ⭐',
    'Awesome work! 👏',
];

// --- Backup ---
export const BACKUP_VERSION = 1;
export const APP_IDENTIFIER = 'com.uac.Goals';
