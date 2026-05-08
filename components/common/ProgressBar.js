/**
 * ProgressBar — Unified progress bar component.
 *
 * Wraps react-native-progress with consistent styling.
 * Used across goals list, goal detail, week cards, dashboard.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { Colors } from '../../constants/Colors';

/**
 * @param {Object} props
 * @param {number}  props.progress  - Value between 0 and 1
 * @param {number}  [props.height=12] - Bar height
 * @param {string}  [props.color]   - Override bar color (auto-colors by default)
 * @param {boolean} [props.showPercent=false] - Show percentage text next to bar
 * @param {string}  [props.label]   - Optional label above the bar
 * @param {string}  [props.detailText] - Optional detail text below the bar
 * @param {Object}  [props.style]   - Additional style for the container
 */
const ProgressBar = ({
    progress = 0,
    height = 12,
    color,
    showPercent = false,
    label,
    detailText,
    style,
}) => {
    // Auto-color based on progress level
    let barColor = color;
    if (!barColor) {
        if (progress >= 1) {
            barColor = Colors.palette.success;
        } else if (progress >= 0.85) {
            barColor = Colors.palette.success;
        } else if (progress > 0) {
            barColor = '#ffa726'; // Orange
        } else {
            barColor = Colors.palette.neutral;
        }
    }

    const safeProgress = Math.min(Math.max(progress || 0, 0), 1);
    const percent = Math.round(safeProgress * 100);

    return (
        <View style={[styles.container, style]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View style={styles.barRow}>
                <Progress.Bar
                    progress={safeProgress}
                    width={null}
                    height={height}
                    color={barColor}
                    unfilledColor="#e0e0e0"
                    borderWidth={0}
                    borderRadius={height / 2}
                    style={{ flex: 1 }}
                    animated={true}
                />
                {showPercent && (
                    <Text style={[styles.percentText, { color: barColor }]}>
                        {percent}%
                    </Text>
                )}
            </View>

            {detailText ? (
                <Text style={styles.detailText}>{detailText}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    percentText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
        minWidth: 40,
        textAlign: 'right',
    },
    detailText: {
        textAlign: 'right',
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});

export default ProgressBar;
