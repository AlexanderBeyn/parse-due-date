/* global describe, expect, test */

const moment = require('moment')

const parseDueDate = require('./parseDueDate')

const REF = moment('2017-05-11').toDate()

const VALID_CASES = [
    {prefix: 'in 1', suffix: ' week', date: moment(REF).add(1, 'week').toDate()},
    {prefix: 'in 2', suffix: ' days', date: moment(REF).add(2, 'days').toDate()},
    {prefix: 'in 10', suffix: ' months', date: moment(REF).add(10, 'months').toDate()},
    {prefix: '', suffix: 'today', date: moment(REF).toDate()},
    {prefix: '', suffix: 'tomorrow', date: moment(REF).add(1, 'day').toDate()},
    {
        prefix: 'next ',
        suffix: 'friday',
        match: 'next Friday',
        date: moment(REF).add(1, 'week').startOf('week').add(5, 'days').toDate()
    },
    {
        prefix: 'this',
        suffix: ' saturday',
        match: 'this Saturday',
        date: moment(REF).startOf('week').add(6, 'days').toDate()
    },
    {
        prefix: 'this ',
        suffix: 'monday',
        match: 'this Monday',
        date: moment(REF).add(1, 'week').startOf('week').add(1, 'days').toDate()
    },
    {
        prefix: '',
        suffix: 'tuesday',
        match: 'Tuesday',
        date: moment(REF).add(1, 'week').startOf('week').add(2, 'days').toDate()
    },
    {prefix: '15', suffix: 'th', suffixStart: 0, date: moment('2017-05-15').toDate()},
    {prefix: '3', suffix: 'rd', suffixStart: 0, date: moment('2017-06-03').toDate()},
    {prefix: '7/12', date: moment('2017-07-12').toDate(), match: '7/12/2017'},
    {prefix: '9/12/2020', date: moment('2020-09-12').toDate(), match: '9/12/2020'},
    {prefix: '1/12', date: moment('2018-01-12').toDate(), match: '1/12/2018'},
    {prefix: '1/12/19', date: moment('2019-01-12').toDate(), match: '1/12/2019'},
    {prefix: 'May 12th', date: moment('2017-05-12').toDate(), match: 'May 12th, 2017'},
    {prefix: 'jan 1st', date: moment('2018-01-01').toDate(), match: 'Jan 1st, 2018'},
    {prefix: 'Dec 29, 2019', date: moment('2019-12-29').toDate(), match: 'Dec 29th, 2019'}
]

const INVALID_CASES = [
    'blah',
    'blah blah',
    '',
    ' ',
    '1/35/2012',
    '1rd',
    'June 14nd',
    'June 42',
    null
]

describe('common valid cases', () => {
    VALID_CASES.forEach(({prefix, suffix = '', suffixStart = 1, date, match}) => {
        test(`parses "${prefix + suffix}"`, () => {
            if (suffix) {
                for (let i = suffixStart; i <= suffix.length; i++) {
                    const part = suffix.slice(0, i)
                    const testString = prefix + part
                    expect(parseDueDate(testString, {ref: REF})).toContainEqual({
                        date: date,
                        match: match || prefix + suffix,
                        string: testString
                    })

                    expect(parseDueDate(testString, {ref: REF, endOfDay: true})).toContainEqual({
                        date: moment(date).endOf('day').toDate(),
                        match: match || prefix + suffix,
                        string: testString
                    })
                }
            } else {
                expect(parseDueDate(prefix, {ref: REF})).toContainEqual({
                    date: date,
                    match: match || prefix,
                    string: prefix
                })

                expect(parseDueDate(prefix, {ref: REF, endOfDay: true})).toContainEqual({
                    date: moment(date).endOf('day').toDate(),
                    match: match || prefix,
                    string: prefix
                })
            }
        })
    })
})

describe('common invalid cases', () => {
    INVALID_CASES.forEach(testString => {
        test(`doesn't parse ${JSON.stringify(testString)}`, () => {
            expect(parseDueDate(testString)).toHaveLength(0)
        })
    })
})

describe('specific tests', () => {
    test('only finds intervals for "in 2"', () => {
        const out = parseDueDate('in 2', {ref: moment('2019-03-03').toDate()})
        expect(out).not.toHaveLength(0)
        out.forEach(o => expect(o.match).toMatch(/^in 2/))
    })
})
