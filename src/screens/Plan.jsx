import { useState } from 'react'
import { useStore } from '../store.jsx'
import { FoodImg } from '../ui.jsx'
import { formatWhen, listNames, recipeById, todayISO, weekDates } from '../logic.js'

function weekTitle(offset) {
  if (offset === 0) return 'This week'
  if (offset === 1) return 'Next week'
  if (offset === -1) return 'Last week'
  const [monday] = weekDates(offset)
  const when = formatWhen(monday)
  return `${when.day} ${when.month}`
}

export function eatingNote(store, day) {
  if (day.status === 'out') return 'Eating out'
  const out = store.roommates.filter((person) => day.members[person.id] && !day.members[person.id].eating)
  const eating = store.roommates.filter((person) => day.members[person.id]?.eating)
  if (!eating.length) return 'No one home'
  if (!out.length) return 'Everyone in'
  return `${listNames(out)} out`
}

export function dutyNote(store, day) {
  if (day.status === 'out') return 'The rota skips this day'
  const eating = store.roommates.filter((person) => day.members[person.id]?.eating)
  if (eating.length === 1) return `${eating[0].name} is in alone`
  const cook = store.roommates.find((person) => person.id === day.cookId)
  const dish = store.roommates.find((person) => person.id === day.dishId)
  if (cook && dish && cook.id === dish.id) return `${cook.name} cooks and washes`
  if (cook && dish) return `${cook.name} cooks · ${dish.name} washes`
  if (!cook) return 'No cook free'
  return `${cook.name} cooks`
}

export function PlanScreen() {
  const store = useStore()
  const [offset, setOffset] = useState(0)
  const dates = weekDates(offset)
  const today = todayISO()
  const tonight = store.plans[today]
  const meal = recipeById(store, tonight?.recipeId)
  const cook = store.roommates.find((person) => person.id === tonight?.cookId)
  const dish = store.roommates.find((person) => person.id === tonight?.dishId)

  return (
    <div className="page">
      {tonight?.status === 'out' ? (
        <a className="hero out" href={`#/day/${today}`}>
          <p className="eyebrow">Tonight · {formatWhen(today).weekdayLong}</p>
          <h1>Eating out</h1>
          <p>{tonight.note || 'No cooking, and the rota takes the night off.'}</p>
        </a>
      ) : meal ? (
        <a className="hero" href={`#/cook/${meal.id}?d=${today}`}>
          <FoodImg recipe={meal} className="hero-photo" />
          <div className="hero-copy">
            <p className="eyebrow">Tonight · {formatWhen(today).label}</p>
            <h1>{meal.title}</h1>
            <p>
              {cook ? `${cook.name} cooks` : 'Cook open'}
              {dish ? ` · ${dish.name} washes` : ''}
            </p>
            <span className="btn light">Open the recipe</span>
          </div>
        </a>
      ) : (
        <a className="hero out" href={`#/day/${today}`}>
          <p className="eyebrow">Tonight</p>
          <h1>No dinner picked</h1>
          <p>Choose something, or let the week suggest it.</p>
        </a>
      )}

      <div className="week-bar">
        <button type="button" onClick={() => setOffset((value) => Math.max(-2, value - 1))} aria-label="Previous week">
          ‹
        </button>
        <strong>{weekTitle(offset)}</strong>
        <button type="button" onClick={() => setOffset((value) => Math.min(3, value + 1))} aria-label="Next week">
          ›
        </button>
      </div>
      <div className="row-actions">
        <button type="button" className="btn ghost" onClick={() => store.resuggestWeek(dates)}>
          Resuggest
        </button>
        <button type="button" className="btn ghost" onClick={() => store.balanceWeek(dates)}>
          Shuffle duties
        </button>
      </div>

      <ul className="days">
        {dates.map((date) => {
          const day = store.plans[date]
          if (!day) return null
          const recipe = recipeById(store, day.recipeId)
          const when = formatWhen(date)
          return (
            <li key={date}>
              <a
                className={`day${date === today ? ' today' : ''}${recipe && day.status !== 'out' ? '' : ' no-photo'}`}
                href={`#/day/${date}`}
              >
                <div className="day-date">
                  <span>{when.weekday}</span>
                  <strong>{when.day}</strong>
                </div>
                <div className="day-copy">
                  <strong>{day.status === 'out' ? 'Eating out' : recipe?.title || 'No meal yet'}</strong>
                  <span>{dutyNote(store, day)}</span>
                  <span className="quiet">{eatingNote(store, day)}{day.mealLocked ? ' · Chosen' : recipe ? ' · Suggested' : ''}</span>
                </div>
                {recipe && day.status !== 'out' ? <FoodImg recipe={recipe} className="thumb" /> : null}
              </a>
            </li>
          )
        })}
      </ul>

      </div>
  )
}
