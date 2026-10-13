import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import { Avatar, Icon, Logo, Sheet } from './ui.jsx'
import { personById, recipeById, todayISO } from './logic.js'
import { SwipeScreen } from './screens/Swipe.jsx'
import { PlanScreen } from './screens/Plan.jsx'
import { DayScreen } from './screens/Day.jsx'
import { RecipeScreen, RecipesScreen } from './screens/Recipes.jsx'
import { CookScreen } from './screens/Cook.jsx'
import { HouseScreen } from './screens/House.jsx'
import { AddRecipeScreen } from './screens/AddRecipe.jsx'
import { AvailabilityScreen } from './screens/Availability.jsx'
import { SwipesScreen } from './screens/Swipes.jsx'

function parseHash(hash) {
  const raw = (hash || '#/swipe').replace(/^#/, '')
  const [path, query = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  return {
    name: parts[0] || 'swipe',
    param: parts[1] ? decodeURIComponent(parts[1]) : null,
    query: Object.fromEntries(new URLSearchParams(query)),
  }
}

function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/swipe')
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/swipe')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return parseHash(hash)
}

const TITLES = {
  swipe: 'Swipe',
  plan: 'Plan',
  day: 'Day',
  recipes: 'Recipes',
  recipe: 'Recipe',
  cook: 'Cook',
  house: 'House',
  add: 'New recipe',
  availability: 'Availability',
  swipes: 'Swipes',
}

function Shell() {
  const route = useRoute()
  const store = useStore()
  const cooking = route.name === 'cook'
  const today = todayISO()
  const tonight = store.plans[today]
  const meal = recipeById(store, tonight?.recipeId)
  const me = personById(store, store.meId)

  useEffect(() => {
    document.title = `${TITLES[route.name] || 'Dinder'} · Dinder`
  }, [route.name])

  let screen = <SwipeScreen />
  if (route.name === 'plan') screen = <PlanScreen />
  else if (route.name === 'day' && route.param) screen = <DayScreen key={route.param} date={route.param} />
  else if (route.name === 'recipes') screen = <RecipesScreen />
  else if (route.name === 'recipe' && route.param) screen = <RecipeScreen id={route.param} />
  else if (route.name === 'cook' && route.param) screen = <CookScreen id={route.param} day={route.query.d || null} />
  else if (route.name === 'house') screen = <HouseScreen />
  else if (route.name === 'add') screen = <AddRecipeScreen />
  else if (route.name === 'availability') screen = <AvailabilityScreen focus={route.query.d || null} />
  else if (route.name === 'swipes') screen = <SwipesScreen />
  else if (route.name !== 'swipe') screen = <SwipeScreen />

  const tonightHref = tonight?.status === 'out' ? `#/day/${today}` : meal ? `#/cook/${meal.id}?d=${today}` : `#/day/${today}`
  const tonightLabel = tonight?.status === 'out' ? 'Eating out' : meal?.title || 'Nothing picked'

  return (
    <div className={cooking ? 'app cooking' : 'app'} data-today={today} data-screen={route.name}>
      {!cooking && (
        <header className="top">
          <div className="brand-block">
            <a className="brand" href="#/plan" aria-label="Dinder">
              <Logo />
            </a>
            <a className="tonight-link" href={tonightHref}>
              Tonight · <strong>{tonightLabel}</strong>
            </a>
          </div>
          <button type="button" className="who" data-testid="who-open" onClick={() => store.setWhoOpen(true)}>
            <Avatar person={me} size={32} />
            <span>{me?.name}</span>
          </button>
        </header>
      )}
      <main className={route.name === 'swipe' ? 'main deck-main' : cooking ? 'main cook-main' : 'main'}>{screen}</main>
      {!cooking && <Nav name={route.name} />}
      {store.whoOpen && (
        <Sheet title="Who's holding the phone?" onClose={() => store.setWhoOpen(false)} testId="sheet-who">
          <p className="lede">Swipes, and the cook view, belong to this person. The plan is shared.</p>
          <a className="btn ghost full" href="#/swipes" onClick={() => store.setWhoOpen(false)}>
            See your swipes
          </a>
          <div className="stack-list">
            {store.roommates.map((person) => (
              <button
                type="button"
                key={person.id}
                className={person.id === store.meId ? 'pick on' : 'pick'}
                onClick={() => store.setMe(person.id)}
              >
                <Avatar person={person} />
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.id === store.meId ? 'Holding it now' : 'Switch to them'}</small>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

function Nav({ name }) {
  const items = [
    ['swipe', '#/swipe', 'Swipe', 'swipe'],
    ['plan', '#/plan', 'Plan', 'plan'],
    ['recipes', '#/recipes', 'Recipes', 'book'],
    ['house', '#/house', 'House', 'house'],
  ]
  return (
    <nav className="nav">
      {items.map(([id, href, label, icon]) => (
        <a key={id} href={href} className={name === id || (id === 'recipes' && name === 'recipe') ? 'active' : ''} aria-current={name === id ? 'page' : undefined}>
          <Icon name={icon} />
          {label}
        </a>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
