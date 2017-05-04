const SPANS = ['days', 'weeks', 'months', 'years']

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december']
const SHORT_MONTHS = MONTHS.map(m => m.slice(0, 3))

const fixPlural = (string, number) => {
    if (Number(number) === 1) {
        return string.replace(/s$/, '')
    }
    return string.replace(/s?$/, 's')
}

const getNumberSuffix = (number) => {
    switch (number) {
    case 1:
    case 21:
    case 31:
        return 'st'
    case 2:
    case 22:
        return 'nd'
    case 3:
    case 23:
        return 'rd'
    default:
        return 'th'
    }
}

const firstUpper = s => s.charAt(0).toUpperCase() + s.slice(1)

const add = {
    days: (date, days) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + days)
        return newDate
    },
    weeks: (date, weeks) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + (weeks * 7))
        return newDate
    },
    months: (date, months) => {
        const newDate = new Date(date)
        newDate.setMonth(newDate.getMonth() + months)
        return newDate
    },
    years: (date, years) => {
        const newDate = new Date(date)
        newDate.setFullYear(newDate.getFullYear() + years)
        return newDate
    }
}

const start = {
    day: (date) => {
        const newDate = new Date(date)
        newDate.setHours(0, 0, 0, 0)
        return newDate
    },
    week: (date) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() - newDate.getDay())
        return start.day(newDate)
    },
    month: (date) => {
        const newDate = new Date(date)
        newDate.setDate(1)
        return start.day(newDate)
    }
}

const end = {
    day: (date) => {
        const newDate = new Date(date)
        newDate.setHours(23, 59, 59, 999)
        return newDate
    }
}

const makeDate = ({year, month: _month, day}) => {
    const month = Number(_month) || (SHORT_MONTHS.indexOf(_month.slice(0, 3).toLowerCase()) + 1)
    const d = new Date(month + '/' + day + '/' + year)
    return start.day(d)
}

const isValid = date => !Number.isNaN(+date)

// Parsers

const inNumberSpan = (string, ref) => {
    const matches = string.match(/^in (\d+) ?([a-z]*)$/)
    if (!matches) { return }

    const [, _num, span] = matches
    const num = Number(_num)

    const out = []
    SPANS.forEach(testSpan => {
        if (testSpan.startsWith(span)) {
            out.push({
                date: add[testSpan](ref, num),
                match: `in ${num} ${fixPlural(testSpan, num)}`,
                string
            })
        }
    })
    return out
}

const today = (string, ref) => {
    if (string.length && 'today'.startsWith(string)) {
        return [{date: ref, match: 'today', string}]
    }
}

const tomorrow = (string, ref) => {
    if (string.length && 'tomorrow'.startsWith(string)) {
        return [{date: add.days(ref, 1), match: 'tomorrow', string}]
    }
}

const weekday = (string, ref) => {
    const matches = string.match(/^(this|next)? ?([a-z]*)?$/)
    if (!matches) { return }

    const [, which, day = ''] = matches
    if (!which && !day) { return }

    const out = []
    WEEKDAYS.forEach((testDay, idx) => {
        if (testDay.startsWith(day)) {
            let date = add.days(start.week(ref), idx)
            if (date < ref || which === 'next') {
                date = add.weeks(date, 1)
            }
            out.push({
                date,
                match: (which ? which + ' ' : '') + firstUpper(testDay),
                string
            })
        }
    })
    return out
}

const nth = (string, ref) => {
    const matches = string.match(/^(\d*)([a-z]{1,2})?$/)
    if (!matches) { return }

    const [, _num, suffix = ''] = matches
    const num = Number(_num)
    if (Number.isNaN(num) || num < 1 || num > 31) { return }

    const correctSuffix = getNumberSuffix(num)
    if (!correctSuffix.startsWith(suffix)) { return }

    let date = add.days(start.month(ref), num - 1)
    if (date < ref) {
        date = add.months(date, 1)
    }

    return [{
        date,
        match: num + correctSuffix,
        string
    }]
}

const USDate = (string, ref) => {
    const matches = string.match(/^(\d+)\/(\d+)(?:\/(\d*))?$/)
    if (!matches) { return }

    const [, month, day, _year] = matches
    const year = Number(_year) || ref.getFullYear()
    const century = (year > 2000) ? 0 : 2000

    let date = makeDate({year: century + year, month, day})
    if (!isValid(date)) { return }

    if (!_year && date < ref) {
        date = add.years(date, 1)
    }

    return [{
        date,
        match: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        string
    }]
}

const monthDayYear = (string, ref) => {
    const matches = string.match(/^(\w+) (\d+)([a-z]{1,2})?(?:,?\s*(\d*))?$/)
    if (!matches) { return }

    const [, month, day, suffix = '', _year] = matches
    const correctSuffix = getNumberSuffix(Number(day))
    if (!correctSuffix.startsWith(suffix)) { return }

    const year = Number(_year) || ref.getFullYear()

    if (SHORT_MONTHS.indexOf(month.slice(0, 3).toLowerCase()) === -1) { return }

    let date = makeDate({year, month, day})
    if (!isValid(date)) { return }

    if (!_year && date < ref) {
        date = add.years(date, 1)
    }

    const match = firstUpper(SHORT_MONTHS[date.getMonth()]) + ' ' +
        date.getDate() + getNumberSuffix(date.getDate()) + ', ' +
        date.getFullYear()

    return [{
        date,
        match,
        string
    }]
}

const PARSERS = [
    inNumberSpan,
    today,
    tomorrow,
    weekday,
    nth,
    USDate,
    monthDayYear
]

const compareResults = ({date: a}, {date: b}) => {
    if (a.getTime() < b.getTime()) {
        return -1
    }
    if (a.getTime() > b.getTime()) {
        return 1
    }
    return 0
}

const parseDueDate = (s, {ref = new Date(), endOfDay = false} = {}) => {
    if (typeof s !== 'string') { return [] }
    const out = []
    PARSERS.forEach(p => (out.push.apply(out, p(s, ref))))
    if (endOfDay) {
        out.forEach(o => (o.date = end.day(o.date)))
    } else {
        out.forEach(o => (o.date = start.day(o.date)))
    }
    return out.sort(compareResults)
}

module.exports = parseDueDate
