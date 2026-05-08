/**
 * AppModal — Reusable base modal wrapper.
 *
 * Extracted from detail.js which had 3 inline modals with identical
 * overlay/content patterns. All app modals should use this as their shell.
 */

import React from 'react';
import {
    Modal,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/Colors';

/**
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility
 * @param {Function} props.onClose - Called when overlay tapped or cancel pressed
 * @param {string}  props.title - Modal title
 * @param {string}  [props.subtitle] - Optional subtitle text
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} [props.headerRight] - Optional element in top-right corner
 * @param {Array}   [props.actions] - Array of { label, onPress, primary?, disabled? }
 */
const AppModal = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
    headerRight,
    actions = [],
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={styles.content}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>{title}</Text>
                            {subtitle ? (
                                <Text style={styles.subtitle}>{subtitle}</Text>
                            ) : null}
                        </View>
                        {headerRight || null}
                    </View>

                    {/* Body */}
                    {children}

                    {/* Actions */}
                    {actions.length > 0 && (
                        <View style={styles.actionRow}>
                            {actions.map((action, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        action.primary ? styles.primaryBtn : styles.cancelBtn,
                                        action.disabled && { opacity: 0.5 },
                                    ]}
                                    onPress={action.onPress}
                                    disabled={action.disabled}
                                >
                                    <Text
                                        style={
                                            action.primary
                                                ? styles.primaryBtnText
                                                : styles.cancelBtnText
                                        }
                                    >
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 10,
    },
    cancelBtnText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    primaryBtn: {
        backgroundColor: Colors.palette.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    primaryBtnText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default AppModal;
