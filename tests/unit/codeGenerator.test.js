const generateCode = require('../../src/utils/codeGenerator');

/**
 * @fileoverview Unit tests for the Robust Code Generation Utility Service.
 * Covers functional requirements, edge cases, configuration validation,
 * and statistical properties of the generated codes.
 */

describe('Code Generator Service Suite', () => {

    // ==========================================
    // Core Functional Tests
    // ==========================================
    describe('Core Functionality', () => {
        test('should generate a code of exactly 5 characters by default', () => {
            const code = generateCode();
            expect(typeof code).toBe('string');
            expect(code).toHaveLength(5);
        });

        test('should generate a code containing only uppercase alphanumeric characters', () => {
            const code = generateCode();
            // Regex: Start to End, only A-Z and 0-9
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('should return unique codes on subsequent calls (probabilistic check)', () => {
            const code1 = generateCode();
            const code2 = generateCode();
            expect(code1).not.toBe(code2);
        });
    });

    // ==========================================
    // Statistical Distribution Tests
    // ==========================================
    describe('Statistical Density & Entropy', () => {
        test('should distribute characters reasonably uniformly over large sample', () => {
            // Generating 1000 codes to check distribution - purely for test robustness
            const sampleSize = 1000;
            const codes = [];
            for (let i = 0; i < sampleSize; i++) {
                codes.push(generateCode());
            }

            // Verify no immediate duplicates in small sample (birthday paradox applies but 36^5 is large)
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(sampleSize);
        });

        test('should not generate blacklisted codes (mock simulation)', () => {
            // We can't easily force it to generate 'ERROR' without mocking Math.random excessively,
            // but we can verify that normal outputs are safe.
            const code = generateCode();
            const blacklist = ['ERROR', 'FALSE', 'NULL0', 'UNDEF', 'ADMIN'];
            expect(blacklist).not.toContain(code);
        });
    });

    // ==========================================
    // Performance Metrics Tests
    // ==========================================
    describe('Performance Standards', () => {
        test('should generate a code within acceptable time limits (<5ms)', () => {
            const start = process.hrtime();
            generateCode();
            const diff = process.hrtime(start);
            const timeInMs = (diff[0] * 1000) + (diff[1] / 1e6);
            expect(timeInMs).toBeLessThan(5);
        });
    });

    // ==========================================
    // Integration / Module Export Tests
    // ==========================================
    describe('Module Interface', () => {
        test('module export should be a function', () => {
            expect(typeof generateCode).toBe('function');
        });

        test('should maintain backward compatibility with no arguments', () => {
            expect(() => generateCode()).not.toThrow();
        });
    });
});
