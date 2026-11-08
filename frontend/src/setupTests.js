import "@testing-library/jest-dom";

// Interaction tests (userEvent typing, Radix dialogs) can exceed Jest's 5s
// default when every suite runs in parallel on a slower machine.
jest.setTimeout(15000);
