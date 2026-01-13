// Global test utilities
global.fail = (message) => {
  throw new Error(message || 'Test failed');
};

beforeEach(() => {
  jest.clearAllMocks();
});