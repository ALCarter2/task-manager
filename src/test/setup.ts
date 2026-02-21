import '@testing-library/jest-dom'

// jsdom doesn't implement these deprecated execCommand APIs
Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), writable: true })
Object.defineProperty(document, 'queryCommandState', { value: vi.fn(() => false), writable: true })
