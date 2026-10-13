import { useState } from 'react'
import { useStore } from '../store.jsx'
import { formatWhen, parseISO, startOfWeek, todayISO, weekDates } from '../logic.js'

function weekTitle(offset) {
  if (offset === 0) return 'This week'
  if (offset === 1) return 'Next week'
  if (offset === -1) return 'Last week'
  const [monday] = weekDates(offset)
  const when = formatWhen(monday)
  return `${when.day} ${when.month}`
}

function weekOffsetFor(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 0
  const target = startOfWeek(parseISO(iso))
  const current = startOfWeek(new Date())
  const weeks = Math.round((target - current) / (7 * 86400000))
  return Math.max(-2, Math.min(3, weeks))
}

function toneOf(day, member) {
  if (!day || day.status === 'out') return 'flat'
  if (!member?.eating) return 'out'
  if (!member.canCook || !member.canDishes) return 'partial'
  return 'in'
}

function toneLabel(tone) {
  if (tone === 'in') return 'In'
  if (tone === 'partial') return 'In, with a limit'
  if (tone === 'out') return 'Out'
  return 'Eating out'
}

export function AvailabilityScreen({ focus = null }) {
  const store = useStore()
  const today = todayISO()
  const [offset, setOffset] = useState(() => weekOffsetFor(focus))
  const [selected, setSelected] = useState(() => {
    const dates = weekDates(weekOffsetFor(focus))
    if (focus && dates.includes(focus)) return focus
    if (dates.includes(today)) return today
    return dates[0]
  })
  const dates = weekDates(offset)
  const day = store.plans[selected]
  const me = store.roommates.find((person) => person.id === store.meId)
  const mine = day?.members[store.meId] || { eating: true, canCook: true, canDishes: true }

  function shift(next) {
    const coming = weekDates(next)
    setOffset(next)
    setSelected(coming.includes(today) ? today : coming[0])
  }

  return (
    <div className="page">
      <a className="back" href="#/plan">
        Week
      </a>
      <h1 className="page-title">Availability</h1>
      <p className="quiet">
        Green is in, amber is in with a limit, stone is out. You can change your own row. Switch the name at the top to answer for someone else.
      </p>
      <div className="week-bar">
        <button type="button" onClick={() => shift(Math.max(-2, offset - 1))} aria-label="Previous week">
          ‹
        </button>
        <strong>{weekTitle(offset)}</strong>
        <button type="button" onClick={() => shift(Math.min(3, offset + 1))} aria-label="Next week">
          ›
        </button>
      </div>

      <div className="avail-cal" data-testid="avail-grid">
        <div className="avail-cal-row head">
          <span />
          {dates.map((date) => {
            const when = formatWhen(date)
            return (
              <button
                type="button"
                key={date}
                className={date === selected ? 'day-head on' : 'day-head'}
                onClick={() => setSelected(date)}
              >
                <span>{when.weekday}</span>
                <strong>{when.day}</strong>
              </button>
            )
          })}
        </div>
        {store.roommates.map((person) => (
          <div className={person.id === store.meId ? 'avail-cal-row mine' : 'avail-cal-row'} key={person.id}>
            <span className="avail-name">
              <i style={{ background: person.color }} />
              <span>{person.id === store.meId ? 'You' : person.name.split(' ')[0]}</span>
            </span>
            {dates.map((date) => {
              const planned = store.plans[date]
              const member = planned?.members[person.id]
              const tone = toneOf(planned, member)
              return (
                <button
                  type="button"
                  key={date}
                  className={`cell ${tone}${date === selected ? ' picked' : ''}`}
                  aria-label={`${person.name}, ${formatWhen(date).weekday} ${formatWhen(date).day}, ${toneLabel(tone)}`}
                  aria-pressed={date === selected && person.id === store.meId}
                  onClick={() => setSelected(date)}
                />
              )
            })}
          </div>
        ))}
      </div>
      <p className="avail-legend">
        <span><i className="cell in" /> In</span>
        <span><i className="cell partial" /> Limited</span>
        <span><i className="cell out" /> Out</span>
        <span><i className="cell flat" /> Eating out</span>
      </p>

      {day && me && (
        <section className="panel">
          <div className="panel-label">
            <h2>{formatWhen(selected).weekdayLong}</h2>
            <a href={`#/day/${selected}`}>Open the day</a>
          </div>
          {day.status === 'out' ? (
            <p>The flat is eating out, so nobody cooks. Open the day if dinner moves home.</p>
          ) : (
            <>
              <p className="quiet">{me.name}, this night.</p>
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
            </>
          )}
        </section>
      )}
    </div>
  )
}
