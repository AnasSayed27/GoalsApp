import React from 'react';
import { Text, View } from 'react-native';
import renderer from 'react-test-renderer';
import { ErrorBoundary } from '../ErrorBoundary';

const ProblemChild = () => {
    throw new Error('Test crash in component');
};

describe('ErrorBoundary', () => {
    // Suppress console.error during expected boundary test
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });
    afterAll(() => {
        console.error = originalConsoleError;
    });

    test('renders children when no error occurs', () => {
        const tree = renderer.create(
            <ErrorBoundary>
                <Text>All systems operational</Text>
            </ErrorBoundary>
        ).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('catches child component crash and displays fallback UI', () => {
        const tree = renderer.create(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        ).toJSON();

        expect(tree).toBeDefined();
        // Fallback UI contains warning icon or title
        expect(JSON.stringify(tree)).toContain('Something went wrong');
        expect(JSON.stringify(tree)).toContain('Test crash in component');
    });
});
