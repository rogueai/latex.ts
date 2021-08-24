import fixtures from "./fixtures";

describe('Fixtures', () => {
    describe('Macros', fixtures.runFixtures('macros'));
    describe('Math', fixtures.runFixtures('math'));
    describe('Counters', fixtures.runFixtures('counters'));
    describe('Symbols', fixtures.runFixtures('symbols'));
    describe('Preamble', fixtures.runFixtures('preamble'));
    describe('Groups', fixtures.runFixtures('groups'));
    describe('Sectioning', fixtures.runFixtures('sectioning'));
    
});