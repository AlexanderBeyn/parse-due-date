# parse-due-date

A JavaScript library for parsing human readable due dates.

## Overview

`parse-due-date` will parse several formats of dates and intervals, such as
`"4/15"` or `"in 3 weeks"`. Because it concerns mostly with due dates, it will
resolve ambiguity by selecting a date in the future instead of one in the past.

`parse-due-date` tries to resolve partial input, and return all possible
resolutions. For example, `"next t"` will result in two entries,
`"next tuesday"` and `"next thursday"`.

Date parsing is US-centric, in that `"1/2/2017"` is treated as January 2nd, 2017.

## Usage

### Parameters

```javascript
parseDueDate(string, {ref: refDate, endOfDay: false})
```
  - string
    - String to parse
  - ref
    - The Date object to use instead of now for relative dates
  - endOfDay
    - Return Date objects at the very end of the day, instead of very
      beginning. Defaults to `false`.

### Output
`parseDueDate` returns an array of objects with the following shape:
  - date
    - Date object with the parsed date. This will be at the beginning or end
      of the day depending on `endOfDay` parameter.
  - match
    - The fully resolved string, with
  - string
    - String originally passed to `parseDueDate`


### Example

```javascript
const parseDueDate = require('parse-due-date')

const possibleDates = parseDueDate('in 2')

/* possibleDates = [ { date: 2017-05-06T07:00:00.000Z,
                       match: 'in 2 days',
                       string: 'in 2' },
                     { date: 2017-05-18T07:00:00.000Z,
                       match: 'in 2 weeks',
                       string: 'in 2' },
                     { date: 2017-07-04T07:00:00.000Z,
                       match: 'in 2 months',
                       string: 'in 2' },
                     { date: 2019-05-04T07:00:00.000Z,
                       match: 'in 2 years',
                       string: 'in 2' } ]
*/
```




## Supported formats

See `parseDueDate.spec.js` for details. A general list:

  - "in 1 week"
  - "in 2 days"
  - "in 10 months"
  - "today"
  - "tomorrow"
  - "next friday"
    - Friday of next week
  - "this tue"
    - Tuesday of this week, or next week if that's in the past
  - "tuesday"
    - Tuesday of this week, or next week if that's in the past
  - "15th"
    - 15th of this month, or next month if that's in the past
  - "7/12"
    - July 12th of this year, or next year if that's in the past
  - "9/12/2020"
  - "1/12/19"
  - "May 12th"
    - May 12th of this year, or next year if that's in the past
  - "Dec 29, 2019"
