import { useState } from 'react'
import { useStore } from '../store.jsx'
import { formatWhen, isoDate, parseISO, todayISO } from '../logic.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toneOf(day, member) {
  if (!day) return 'empty'
  if (day.status === 'out') return 'flat'
  if (!member?.eating) return 'out'
  if (!member.canCook || !member.canDishes) return 'partial'
  return 'in'
}

function toneLabel(tone) {
  if (tone === 'in') return 'In'
  if (tone === 'partial') return 'In, with a limit'
  if (tone === 'out') return 'Out'
  if (tone === 'flat') return 'Eating out'
  return 'Not on the plan'
}

function monthCells(year, month) {
  const first = new Date(year, month, 1)
  const pad = (first.getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(isoDate(new Date(year, month, day)))
  return cells
}

export function AvailabilityScreen({ focus = null }) {
  const store = useStore()
  const today = todayISO()
  const initial = focus && /^\d{4}-\d{2}-\d{2}$/.test(focus) ? focus : today
  const start = parseISO(initial)
  const [cursor, setCursor] = useState({ year: start.getFullYear(), month: start.getMonth() })
  const [selected, setSelected] = useState(initial)
  const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
  const planDates = Object.keys(store.plans).sort()
  const firstPlan = planDates[0] || today
  const lastPlan = planDates[planDates.length - 1] || today
  const cells = monthCells(cursor.year, cursor.month)
  const day = store.plans[selected]
  const me = store.roommates.find((person) => person.id === store.meId)
  const mine = day?.members[store.meId] || { eating: true, canCook: true, canDishes: true }
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  function canShift(delta) {
    const next = new Date(cursor.year, cursor.month + delta, 1)
    const nextPrefix = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    return planDates.some((date) => date.startsWith(nextPrefix))
  }

  function shift(delta) {
    if (!canShift(delta)) return
    const next = new Date(cursor.year, cursor.month + delta, 1)
    const year = next.getFullYear()
    const month = next.getMonth()
    const nextPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
    setCursor({ year, month })
    if (!selected.startsWith(nextPrefix)) {
      const inMonth = planDates.filter((date) => date.startsWith(nextPrefix))
      setSelected(inMonth.includes(today) ? today : inMonth[0])
    }
  }

  return (
    <div className="avail">
      <div className="avail-scroll">
        <a className="back" href="#/plan">
          Week
        </a>
        <h1 className="page-title">Availability</h1>
        <p className="quiet">
          {me?.name || 'You'} this month. Green is in, amber is limited, stone is out. Switch the name at the top to answer for someone else.
        </p>
        <div className="week-bar">
          <button type="button" onClick={() => shift(-1)} disabled={!canShift(-1)} aria-label="Previous month">
            ‹
          </button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => shift(1)} disabled={!canShift(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="month" data-testid="avail-grid">
          {WEEKDAYS.map((label) => (
            <span className="month-label" key={label}>
              {label}
            </span>
          ))}
          {cells.map((date, index) => {
            if (!date) return <span key={`pad-${index}`} />
            const planned = store.plans[date]
            const tone = toneOf(planned, planned?.members[store.meId])
            const when = formatWhen(date)
            const picked = date === selected
            return (
              <button
                type="button"
                key={date}
                className={`month-cell ${tone}${picked ? ' picked' : ''}${date === today ? ' today' : ''}`}
                disabled={!planned}
                aria-pressed={picked}
                aria-label={`${when.weekdayLong} ${when.day} ${when.month}, ${toneLabel(tone)}`}
                onClick={() => planned && setSelected(date)}
              >
                {when.day}
              </button>
            )
          })}
        </div>
        <p className="avail-legend">
          <span><i className="cell in" /> In</span>
          <span><i className="cell partial" /> Limited</span>
          <span><i className="cell out" /> Out</span>
          <span><i className="cell flat" /> Eating out</span>
        </p>
        <p className="quiet">The plan runs {formatWhen(firstPlan).day} {formatWhen(firstPlan).month} to {formatWhen(lastPlan).day} {formatWhen(lastPlan).month}.</p>
      </div>
      <div className="avail-dock" data-testid="avail-dock">
        <div className="panel-label">
          <h2>{day ? formatWhen(selected).label : 'Pick a day'}</h2>
          {day && <a href={`#/day/${selected}`}>Open the day</a>}
        </div>
        {!day && <p>That night is outside the plan.</p>}
        {day?.status === 'out' && <p>The flat is eating out, so nobody cooks. Open the day if dinner moves home.</p>}
        {day && day.status !== 'out' && (
          <div className="toggles">
            <button
              type="button"
              className={mine.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
              aria-pressed={mine.eating}
              onClick={() => store.setMember(selected, store.meId, { eating: !mine.eating })}
            >
              {mine.eating ? 'In' : 'Out'}
            </button>
            <button
              type="button"
              className={mine.canCook && mine.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
              aria-pressed={Boolean(mine.canCook && mine.eating)}
              disabled={!mine.eating}
              onClick={() => store.setMember(selected, store.meId, { canCook: !mine.canCook })}
            >
              {mine.canCook && mine.eating ? 'Cook' : 'No cook'}
            </button>
            <button
              type="button"
              className={mine.canDishes && mine.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
              aria-pressed={Boolean(mine.canDishes && mine.eating)}
              disabled={!mine.eating}
              onClick={() => store.setMember(selected, store.meId, { canDishes: !mine.canDishes })}
            >
              {mine.canDishes && mine.eating ? 'Wash' : 'No wash'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
