# Testing

## ADDED Requirements

### Requirement: Test Coverage Threshold

The project MUST maintain a minimum of 90% code coverage across all packages.

#### Scenario: Coverage Enforcement
- Given the test suite
- When running `npm run test:coverage`
- Then coverage for lines, branches, functions, and statements is >= 90%
- And the command exits with code 0

### Requirement: CI Test Execution

All tests MUST run automatically in the CI pipeline on every push and pull request.

#### Scenario: PR Test Run
- Given a pull request to main branch
- When the CI workflow runs
- Then all tests are executed
- And test results are reported
- And coverage report is generated

### Requirement: Coverage Non-Regression

The CI MUST prevent merging code that decreases coverage compared to the main branch.

#### Scenario: Coverage Regression Block
- Given a PR with lower coverage than main
- When the CI workflow completes
- Then the coverage check fails
- And a comment is posted on the PR showing the regression

#### Scenario: Coverage Improvement Allowed
- Given a PR with equal or higher coverage than main
- When the CI workflow completes
- Then the coverage check passes

### Requirement: Component Testing

React components MUST be tested using @testing-library/react to verify rendering and user interactions.

#### Scenario: Component Render Test
- Given a React component with props
- When the component is rendered in a test
- Then the expected elements are present in the DOM
- And accessibility queries can find interactive elements

#### Scenario: Component Interaction Test
- Given a rendered component with interactive elements
- When a user interaction is simulated (click, change, etc.)
- Then the component state updates correctly
- And callbacks are invoked with expected arguments

### Requirement: Testing Documentation

The project MUST provide clear documentation on how to write and run tests.

#### Scenario: Developer Onboarding
- Given a new developer joining the project
- When they read `docs/TESTING.md`
- Then they understand the test file conventions
- And they know how to run tests locally
- And they understand the coverage requirements

#### Scenario: Test Writing Guidance
- Given a developer writing new tests
- When they consult the testing documentation
- Then they find examples of good test patterns
- And they understand the Arrange-Act-Assert structure
- And they know how to test React components with @testing-library/react
