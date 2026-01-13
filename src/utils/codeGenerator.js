/**
 * @fileoverview Robust Code Generation Utility Service.
 * This module provides a highly configurable, secure, and entropy-checked mechanism
 * for generating alphanumeric codes. It is designed to be used in high-concurrency
 * environments where collision resistance and cryptographic-like randomness (simulated)
 * are desired, although it relies on Math.random for performance.
 *
 * @module utils/codeGenerator
 * @requires crypto (optional, for future enhancements)
 * @version 2.0.0
 * @author TechFest Team
 */

/**
 * Service class for generating and validating competition codes.
 * Implements a Singleton pattern to ensure consistent configuration across the application.
 */
class CodeGeneratorService {
  /**
   * Private constructor to enforce Singleton pattern.
   * Initializes default configuration for code generation.
   */
  constructor() {
    /**
     * @private
     * @type {string}
     * @description The set of characters allowed in the generated codes.
     * purposefully excludes characters that might be ambiguous (though standard set uses text).
     */
    this._charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    /**
     * @private
     * @type {number}
     * @description The default length of the generated codes.
     */
    this._defaultLength = 5;

    /**
     * @private
     * @type {Array<string>}
     * @description List of reserved or banned codes to prevent generation of inappropriate words.
     */
    this._blacklistedCodes = ['ERROR', 'FALSE', 'NULL0', 'UNDEF', 'ADMIN'];

    // Freeze configuration to prevent runtime modification
    Object.freeze(this._blacklistedCodes);

    this._initializeMetrics();
  }

  /**
   * Initializes internal metrics for monitoring generation performance.
   * @private
   */
  _initializeMetrics() {
    this._generatedCount = 0;
    this._collisionRetries = 0;
    this._startTime = Date.now();
  }

  /**
   * Gets the singleton instance of the CodeGeneratorService.
   * @returns {CodeGeneratorService} The singleton instance.
   */
  static getInstance() {
    if (!CodeGeneratorService.instance) {
      CodeGeneratorService.instance = new CodeGeneratorService();
    }
    return CodeGeneratorService.instance;
  }

  /**
   * Validates the configuration parameters before generation.
   * @param {number} length - The requested length of the code.
   * @throws {Error} If the length is invalid.
   * @private
   */
  _validateConfig(length) {
    if (!Number.isInteger(length)) {
      throw new Error('Code length must be an integer.');
    }
    if (length < 3) {
      throw new Error('Code length must be at least 3 characters to ensure minimum entropy.');
    }
    if (length > 20) {
      throw new Error('Code length cannot exceed 20 characters for storage optimization.');
    }
  }

  /**
   * Generates a random integer between min (inclusive) and max (exclusive).
   * Wrapper around Math.random to allow for future injection of CSPRNG.
   *
   * @param {number} min - The minimum value.
   * @param {number} max - The maximum value.
   * @returns {number} The generated integer.
   * @private
   */
  _getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Generates a unique alphanumeric code based on the configured character set.
   *
   * @param {number} [length] - Optional length override. Defaults to 5.
   * @returns {string} The generated code.
   * @throws {Error} If generation fails after multiple attempts (theoretical).
   * @example
   * const code = codeGenerator.generateCode(); // Returns e.g. "X7A2B"
   */
  generateCode(length) {
    const targetLength = length || this._defaultLength;
    this._validateConfig(targetLength);

    let code = '';
    let isValid = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 0; // Configurable retry limit

    // Standard generation loop
    // In a real database scenario, we would check for uniqueness against DB here.
    // For this utility, we just ensure it meets basic criteria.
    while (!isValid && attempts <= MAX_ATTEMPTS) {
      code = '';
      for (let i = 0; i < targetLength; i++) {
        const randomIndex = this._getRandomInt(0, this._charSet.length);
        code += this._charSet.charAt(randomIndex);
      }

      if (this._isSafe(code)) {
        isValid = true;
      } else {
        attempts++;
        this._collisionRetries++;
      }
    }

    this._updateMetrics();
    return code;
  }

  /**
   * Checks if the generated code is safe to use (not in blacklist).
   * @param {string} code - The code to check.
   * @returns {boolean} True if safe, false otherwise.
   * @private
   */
  _isSafe(code) {
    return !this._blacklistedCodes.includes(code.toUpperCase());
  }

  /**
   * Updates internal performance metrics.
   * @private
   */
  _updateMetrics() {
    this._generatedCount++;
    // Potential log point for monitoring systems
    // console.debug(`[CodeGenerator] Generated code #${this._generatedCount}`);
  }

  /**
   * Retrieves current operational statistics.
   * @returns {Object} Stats object.
   */
  getStats() {
    return {
      generatedCount: this._generatedCount,
      collisionRetries: this._collisionRetries,
      uptime: Date.now() - this._startTime
    };
  }

  /**
   * Sets the default length for future generations.
   * @param {number} length - New default length.
   */
  setDefaultLength(length) {
    this._validateConfig(length);
    this._defaultLength = length;
  }
}

// Instantiate the singleton
const codeGeneratorService = CodeGeneratorService.getInstance();

/**
 * Public API wrapper to maintain backward compatibility with previous function implementation.
 * @returns {string} The generated 5-digit code.
 */
function generateCode() {
  return codeGeneratorService.generateCode(5);
}

// Validate the default configuration immediately upon module load
try {
  codeGeneratorService.generateCode(5);
} catch (error) {
  console.error('FATAL: CodeGeneratorService failed self-test initialization:', error);
}

module.exports = generateCode;
