/**
 * Pace Calculator — Daily pace and tactic dashboard logic.
 * Extracted from tasks.js getTacticData().
 */

import { DAYS_PER_WEEK } from '../constants/Config';
import { toUTCDate, getTodayString, getTodayUTC } from './dateHelpers';

/**
 * Calculates daily pace for a single target-based tactic.
 */
export const calculateTacticDailyPace = ({ tactic, weekStartStr, todayUTC, todayStr }) => {
    if (!tactic || !tactic.targetValue) {
        return { dailyPace: 0, todayWork: 0, isCompletedBeforeToday: false };
    }

    const weekStart = toUTCDate(weekStartStr);
    const passedDays = Math.max(0, Math.floor((todayUTC - weekStart) / (1000 * 60 * 60 * 24)));
    const daysLeft = Math.max(1, DAYS_PER_WEEK - passedDays);

    const todayWork = tactic.dailyLogs?.[todayStr] || 0;
    const isCompleted = tactic.completed;
    const wasCompletedBeforeToday = isCompleted && tactic.completionDate && tactic.completionDate !== todayStr;

    const remainingBeforeToday = tactic.targetValue - (tactic.currentProgress || 0) + todayWork;
    const dailyPace = remainingBeforeToday > 0 ? Math.ceil(remainingBeforeToday / daysLeft) : 0;

    return { dailyPace, todayWork, isCompletedBeforeToday: wasCompletedBeforeToday };
};

/**
 * Builds the complete "today's tactics" data for the dashboard.
 */
export const buildTodayTactics = (goals) => {
    if (!goals || !Array.isArray(goals)) {
        return { tactics: [], stats: { completed: 0, total: 0, progress: 0 } };
    }

    const todayUTC = getTodayUTC();
    const todayStr = getTodayString();
    const tactics = [];
    let totalScore = 0;
    let completedScore = 0;

    goals.forEach(goal => {
        if (!goal.startDate || !goal.endDate || !goal.weeks) return;
        const goalStart = toUTCDate(goal.startDate);
        const goalEnd = toUTCDate(goal.endDate);
        if (todayUTC < goalStart || todayUTC > goalEnd) return;

        Object.entries(goal.weeks).forEach(([weekKey, weekData]) => {
            if (!weekData || !weekData.startDate || !weekData.endDate) return;
            const wStart = toUTCDate(weekData.startDate);
            const wEnd = toUTCDate(weekData.endDate);
            if (todayUTC < wStart || todayUTC > wEnd) return;

            (weekData.tasks || []).forEach(tactic => {
                const isCompleted = tactic.completed;
                const todayWork = tactic.dailyLogs?.[todayStr] || 0;

                if (tactic.targetValue) {
                    const { dailyPace, isCompletedBeforeToday } = calculateTacticDailyPace({
                        tactic, weekStartStr: weekData.startDate, todayUTC, todayStr,
                    });
                    if (!isCompletedBeforeToday) {
                        if (dailyPace > 0) {
                            totalScore += dailyPace;
                            completedScore += Math.min(todayWork, dailyPace);
                        } else if (todayWork > 0) {
                            totalScore += todayWork;
                            completedScore += todayWork;
                        }
                        if (!isCompleted || tactic.completionDate === todayStr) {
                            tactics.push({
                                ...tactic, type: 'target', goalId: goal.id,
                                goalName: goal.name, weekKey, dailyPace, todayWork,
                            });
                        }
                    }
                } else {
                    const wasCompletedBeforeToday = isCompleted && tactic.completionDate && tactic.completionDate !== todayStr;
                    if (!wasCompletedBeforeToday) {
                        totalScore += 1;
                        completedScore += (isCompleted && tactic.completionDate === todayStr) ? 1 : 0;
                        if (!isCompleted || tactic.completionDate === todayStr) {
                            tactics.push({
                                ...tactic, type: 'simple', goalId: goal.id,
                                goalName: goal.name, weekKey, todayWork: isCompleted ? 1 : 0,
                            });
                        }
                    }
                }
            });
        });
    });

    const progress = totalScore > 0 ? completedScore / totalScore : 0;
    return {
        tactics,
        stats: { completed: Math.round(completedScore * 10) / 10, total: totalScore, progress },
    };
};
