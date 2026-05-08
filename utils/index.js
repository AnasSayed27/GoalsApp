/**
 * Utils — Barrel export for all utility functions.
 */

// Date helpers
export {
    toUTCDate,
    toDateString,
    getTodayString,
    getTodayUTC,
    formatDateShort,
    formatDateLong,
    getUTCDateString,
    daysBetween,
    weeksBetween,
    isDateInRange,
    addDays,
    getStartOfWeek,
} from './dateHelpers';

// Week building
export {
    getWeeksBetweenDates,
    rebuildParentWeeks,
    initializeWeeks,
    getWeekIndex,
    getSortedWeeks,
} from './weekBuilder';

// Progress calculations
export {
    getTacticCompletion,
    calculateWeekProgress,
    isWeekComplete,
    calculateGoalProgress,
    calculateDailyTaskStats,
} from './progressCalculator';

// Pace calculations
export {
    calculateTacticDailyPace,
    buildTodayTactics,
} from './paceCalculator';

// Goal conversion
export {
    convertGoalToSubgoal,
    convertSubgoalToGoal,
    calculateConsumedWeeks,
} from './goalConverter';
