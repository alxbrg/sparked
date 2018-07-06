module.exports = {
  testMatch: [ '**/*.spec.js' ],
  testPathIgnorePatterns: [ '/node_modules/', 'fixtures.js' ],
  collectCoverageFrom: [ 'src/**/*.js' ],
  reporters: [ 'default' ],
};
