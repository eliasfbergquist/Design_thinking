import { useState } from 'react'
import { useStore } from '../store.jsx'
import { CravingForm, FoodImg, Sheet, VoteBreakdown } from '../ui.jsx'
import { formatWhen, listNames, recipeById, shoppingList, todayISO, weekDates, weekOffset } from '../logic.js'

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
  const [earlier, setEarlier] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const today = todayISO()
  const week = weekDates(offset)
  const dates = offset === 0 && !earlier ? week.filter((date) => date >= today) : week
  const pastInWeek = week.filter((date) => date < today)
  const offsets = Object.keys(store.plans).map((date) => weekOffset(date))
  const minOffset = offsets.length ? Math.min(...offsets) : -4
  const maxOffset = offsets.length ? Math.max(...offsets) : 10
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

      {tonight?.status !== 'out' && <CravingForm date={today} heading="I want something tonight" />}

      <div className="week-bar">
        <button
          type="button"
          onClick={() => {
            setEarlier(false)
            setOffset((value) => Math.max(minOffset, value - 1))
          }}
          disabled={offset <= minOffset}
          aria-label="Previous week"
        >
          ‹
        </button>
        <strong>{weekTitle(offset)}</strong>
        <button
          type="button"
          onClick={() => {
            setEarlier(false)
            setOffset((value) => Math.min(maxOffset, value + 1))
          }}
          disabled={offset >= maxOffset}
          aria-label="Next week"
        >
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
      <a className="btn ghost full" href="#/availability" data-testid="open-availability">
        Availability
      </a>
      <button type="button" className="btn full" data-testid="shopping-list" onClick={() => setShopOpen(true)}>
        Shopping list
      </button>

      {offset === 0 && pastInWeek.length > 0 && (
        <button type="button" className="text-btn" onClick={() => setEarlier((value) => !value)}>
          {earlier ? 'Hide earlier days' : 'Earlier this week'}
        </button>
      )}

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
                  <span className="quiet">{eatingNote(store, day)}{day.mealLocked ? ' · Chosen' : recipe && day.status !== 'out' ? ' · Suggestion' : ''}</span>
                  {recipe && day.status !== 'out' ? <VoteBreakdown recipeId={recipe.id} compact /> : null}
                </div>
                {recipe && day.status !== 'out' ? <FoodImg recipe={recipe} className="thumb" /> : null}
              </a>
            </li>
          )
        })}
      </ul>

      {shopOpen && <ShopSheet store={store} dates={dates} title={weekTitle(offset)} onClose={() => setShopOpen(false)} />}
      </div>
  )
}

function ShopSheet({ store, dates, title, onClose }) {
  const [picked, setPicked] = useState(() =>
    dates.filter((date) => {
      const day = store.plans[date]
      return day && day.status !== 'out' && day.recipeId
    }),
  )
  const [checked, setChecked] = useState({})
  const chosen = dates.filter((date) => picked.includes(date))
  const { meals, items, skipped } = shoppingList(store, chosen)
  const needed = items.filter((item) => !item.optional)
  const optional = items.filter((item) => item.optional)
  function toggle(key) {
    setChecked((current) => ({ ...current, [key]: !current[key] }))
  }
  function toggleDate(date) {
    setPicked((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]))
  }
  return (
    <Sheet title={`${title} shopping`} onClose={onClose} testId="shop-sheet">
      <div className="shop-days" data-testid="shop-days">
        {dates.map((date) => {
          const when = formatWhen(date)
          const on = picked.includes(date)
          return (
            <button
              type="button"
              key={date}
              className={on ? 'chip-toggle on' : 'chip-toggle'}
              aria-pressed={on}
              onClick={() => toggleDate(date)}
            >
              {when.weekday} {when.day}
            </button>
          )
        })}
      </div>
      {chosen.length === 0 ? (
        <p>Pick the nights you're shopping for.</p>
      ) : meals.length === 0 ? (
        <p>Those nights have no home dinner, so there is nothing to buy.</p>
      ) : (
        <>
          <div className="shop-head">
            <p>{meals.map((meal) => meal.title).join(' · ')}</p>
            {skipped > 0 && <p className="quiet">Eating out and empty nights are left off.</p>}
          </div>
          <ShopGroup label="To buy" items={needed} checked={checked} onToggle={toggle} />
          <ShopGroup label="On the side" items={optional} checked={checked} onToggle={toggle} />
        </>
      )}
    </Sheet>
  )
}

function ShopGroup({ label, items, checked, onToggle }) {
  if (!items.length) return null
  return (
    <section>
      <h3 className="group-label">{label}</h3>
      <ul className="shop-list">
        {items.map((item) => (
          <li key={item.key}>
            <button type="button" className={checked[item.key] ? 'shop-row done' : 'shop-row'} onClick={() => onToggle(item.key)} aria-pressed={Boolean(checked[item.key])}>
              <span className="box" aria-hidden="true" />
              <span>
                <strong>{item.line}</strong>
                {item.note && <small>{item.note}</small>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
