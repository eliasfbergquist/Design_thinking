import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Avatar, FoodImg, RateMeal, Sheet, VoteBreakdown } from '../ui.jsx'
import { formatWhen, hardBlocks, listNames, rankRecipes, recipeById, swapsFor, todayISO } from '../logic.js'
import { dutyNote, eatingNote } from './Plan.jsx'

export function DayScreen({ date }) {
  const store = useStore()
  const day = store.plans[date]
  const [sheet, setSheet] = useState(null)
  if (!day) {
    return (
      <div className="page">
        <p>That day isn't on the plan yet.</p>
        <a href="#/plan">Back to the week</a>
      </div>
    )
  }

  const recipe = recipeById(store, day.recipeId)
  const when = formatWhen(date)
  const eaters = store.roommates.filter((person) => day.members[person.id]?.eating)
  const blocks = recipe ? hardBlocks(recipe, eaters) : []
  const swaps = recipe ? swapsFor(recipe, eaters) : []
  const past = date < todayISO()

  return (
    <div className="page">
      <a className="back" href="#/plan">
        Week
      </a>
      <p className="eyebrow">{when.weekdayLong}{past ? ' · already happened' : ''}</p>
      <h1 className="page-title">{when.day} {when.month}</h1>
      <div className="segment">
        <button type="button" className={day.status === 'home' ? 'on' : ''} onClick={() => store.setEatingOut(date, false)}>
          At home
        </button>
        <button type="button" className={day.status === 'out' ? 'on' : ''} onClick={() => store.setEatingOut(date, true)}>
          Eating out
        </button>
      </div>

      {day.status === 'out' ? (
        <section className="panel">
          <h2>No dinner at home</h2>
          <p>Cooking and dishes are skipped. The rota does not treat this as a debt.</p>
          <label className="field">
            Note
            <input value={day.note} onChange={(event) => store.setNote(date, event.target.value)} placeholder="Where, or what time" />
          </label>
        </section>
      ) : (
        <>
          <section className={recipe ? (day.mealLocked ? 'panel meal-chosen' : 'panel meal-suggested') : 'panel'}>
            <div className="panel-label">
              <h2>Dinner</h2>
              {recipe && (
                <span className={day.mealLocked ? 'meal-state chosen' : 'meal-state suggested'}>
                  {day.mealLocked ? 'Chosen' : 'Suggestion'}
                </span>
              )}
            </div>
            {recipe ? (
              <>
                <a className="meal-row" href={`#/cook/${recipe.id}?d=${date}`}>
                  <FoodImg recipe={recipe} className="thumb" />
                  <span>
                    <strong>{recipe.title}</strong>
                    <small>{recipe.minutes} min</small>
                  </span>
                </a>
                <p className="quiet">
                  {day.mealLocked
                    ? 'Locked in. Resuggest leaves this night alone.'
                    : 'A suggestion for who’s home. Accept it, or look at another before you do.'}
                </p>
                <VoteBreakdown recipeId={recipe.id} />
                {(past || date === todayISO()) && <RateMeal recipeId={recipe.id} />}
              </>
            ) : (
              <p>Nothing fits the people who are in. Someone may need to sit out, or add a recipe.</p>
            )}
            {blocks.length > 0 && <p className="warn">{blocks.join(' · ')}</p>}
            {swaps.map((swap) => (
              <p className="swap" key={swap}>{swap}</p>
            ))}
            {recipe && !day.mealLocked && (
              <button type="button" className="btn" data-testid="accept-meal" onClick={() => store.chooseRecipe(date, recipe.id)}>
                Accept this dinner
              </button>
            )}
            <div className="row-actions">
              {recipe && (
                <button type="button" className="btn ghost" onClick={() => store.anotherRecipe(date)}>
                  {day.mealLocked ? 'Different idea' : 'Another idea'}
                </button>
              )}
              <button type="button" className="btn ghost" data-testid="choose-meal" onClick={() => setSheet('meal')}>
                {day.mealLocked ? 'Change dinner' : recipe ? 'Pick instead' : 'Choose dinner'}
              </button>
            </div>
            {day.mealLocked && (
              <button type="button" className="text-btn" onClick={() => store.unlockMeal(date)}>
                Make this a suggestion again
              </button>
            )}
          </section>

          <label className="field">
            Note
            <input value={day.note} onChange={(event) => store.setNote(date, event.target.value)} placeholder="Leftovers, guests, a late night" />
          </label>

          <section className="panel" data-testid="whos-in">
            <div className="panel-label">
              <h2>Who's in</h2>
              <a href={`#/availability?d=${date}`}>Week</a>
            </div>
            <p className="quiet">This night only. The week calendar is the easier place to look across days. You can change your own row.</p>
            <ul className="people">
              {[...store.roommates].sort((a, b) => (a.id === store.meId ? -1 : b.id === store.meId ? 1 : a.order - b.order)).map((person) => {
                const member = day.members[person.id] || { eating: true, canCook: true, canDishes: true }
                const mine = person.id === store.meId
                return (
                  <li key={person.id} className={mine ? 'mine' : ''} data-testid={mine ? 'my-availability' : `availability-${person.id}`}>
                    <div className="person-name">
                      <Avatar person={person} size={36} />
                      <strong>{person.name}</strong>
                      {mine && <span className="you-tag">You</span>}
                    </div>
                    <div className="toggles">
                      <button
                        type="button"
                        className={member.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
                        aria-pressed={member.eating}
                        disabled={!mine}
                        onClick={() => store.setMember(date, person.id, { eating: !member.eating })}
                      >
                        {member.eating ? 'In' : 'Out'}
                      </button>
                      <button
                        type="button"
                        className={member.canCook && member.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
                        aria-pressed={Boolean(member.canCook && member.eating)}
                        disabled={!mine || !member.eating}
                        onClick={() => store.setMember(date, person.id, { canCook: !member.canCook })}
                      >
                        {member.canCook && member.eating ? 'Cook' : 'No cook'}
                      </button>
                      <button
                        type="button"
                        className={member.canDishes && member.eating ? 'chip-toggle avail on' : 'chip-toggle avail'}
                        aria-pressed={Boolean(member.canDishes && member.eating)}
                        disabled={!mine || !member.eating}
                        onClick={() => store.setMember(date, person.id, { canDishes: !member.canDishes })}
                      >
                        {member.canDishes && member.eating ? 'Wash' : 'No wash'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="quiet">{eatingNote(store, day)}</p>
          </section>

          <section className="panel">
            <div className="panel-label">
              <h2>Duties</h2>
              <button type="button" className="text-btn" onClick={() => store.balanceDay(date)}>
                Shuffle
              </button>
            </div>
            <p className="duty-line">{dutyNote(store, day)}</p>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => setSheet('cook')}>
                {store.roommates.find((person) => person.id === day.cookId)?.name || 'Set cook'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setSheet('dish')} disabled={eaters.length < 2}>
                {eaters.length < 2 ? 'No dishes rota' : store.roommates.find((person) => person.id === day.dishId)?.name || 'Set wash'}
              </button>
            </div>
            <p className="quiet">
              {day.cookLocked || day.dishLocked
                ? 'Set by hand. Shuffle if you want a new suggestion.'
                : 'Suggested from who’s free, with a lean toward people who have done it less lately.'}
              {eaters.some((person) => !day.members[person.id].canCook) &&
                ` Can't cook: ${listNames(eaters.filter((person) => !day.members[person.id].canCook))}.`}
              {eaters.some((person) => !day.members[person.id].canDishes) &&
                ` Can't wash: ${listNames(eaters.filter((person) => !day.members[person.id].canDishes))}.`}
            </p>
          </section>

          {recipe && (
            <a className="btn full" href={`#/cook/${recipe.id}?d=${date}`}>
              Cook {recipe.title}
            </a>
          )}
        </>
      )}

      {sheet === 'meal' && (
        <MealSheet
          store={store}
          day={day}
          onClose={() => setSheet(null)}
          onPick={(id) => {
            store.chooseRecipe(date, id)
            setSheet(null)
          }}
        />
      )}
      {sheet === 'cook' && (
        <PersonSheet
          title="Who cooks?"
          store={store}
          day={day}
          role="cook"
          onClose={() => setSheet(null)}
          onPick={(id) => {
            store.setCook(date, id)
            setSheet(null)
          }}
        />
      )}
      {sheet === 'dish' && (
        <PersonSheet
          title="Who washes?"
          store={store}
          day={day}
          role="dish"
          onClose={() => setSheet(null)}
          onPick={(id) => {
            store.setDish(date, id)
            setSheet(null)
          }}
        />
      )}
    </div>
  )
}

function MealSheet({ store, day, onClose, onPick }) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const ranked = rankRecipes(store, day).filter((item) => {
    if (!needle) return item.band !== 'blocked'
    const hay = `${item.recipe.title} ${item.recipe.blurb}`.toLowerCase()
    return hay.includes(needle)
  })
  const groups = [
    ['Fits', ranked.filter((item) => item.band === 'great' || item.band === 'ok')],
    ['Someone said nope', ranked.filter((item) => item.band === 'dislike')],
    ["Doesn't work tonight", ranked.filter((item) => item.band === 'blocked')],
  ]
  return (
    <Sheet title="Choose dinner" onClose={onClose} testId="meal-sheet">
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dinners" />
      {groups.map(([label, items]) =>
        items.length ? (
          <section key={label}>
            <h3 className="group-label">{label}</h3>
            {items.map((item) => (
              <button type="button" key={item.recipe.id} className="pick" onClick={() => onPick(item.recipe.id)}>
                <FoodImg recipe={item.recipe} className="thumb" />
                <span>
                  <strong>{item.recipe.title}</strong>
                  <small>{[...item.notes, ...item.blocks, ...item.swaps].slice(0, 2).join(' · ') || item.recipe.blurb}</small>
                </span>
              </button>
            ))}
          </section>
        ) : null,
      )}
    </Sheet>
  )
}

function PersonSheet({ title, store, day, role, onClose, onPick }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {store.roommates.map((person) => {
        const member = day.members[person.id]
        const eating = member?.eating
        const free = role === 'cook' ? member?.canCook : member?.canDishes
        const reason = !eating ? 'Not eating' : !free ? (role === 'cook' ? "Can't cook" : "Can't wash") : ''
        return (
          <button type="button" key={person.id} className="pick" disabled={Boolean(reason)} onClick={() => onPick(person.id)}>
            <Avatar person={person} />
            <span>
              <strong>{person.name}</strong>
              <small>{reason || 'Available'}</small>
            </span>
          </button>
        )
      })}
    </Sheet>
  )
}
