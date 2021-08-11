/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [ "**/test/**/*.(spec|test).[jt]s?(x)" ],
  moduleDirectories: ["node_modules", "src"]
};