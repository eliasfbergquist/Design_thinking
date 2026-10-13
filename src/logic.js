import { CATEGORIES, RECIPES, ROOMMATES, SEED_VERSION, SEED_VOTES, allergenLabel } from './data.js'

export { SEED_VERSION }

export const DUTY_WINDOW = 28

export function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
  return next
}

export function startOfWeek(date) {
  const day = (date.getDay() + 6) % 7
  return addDays(date, -day)
}

export function todayISO() {
  return isoDate(new Date())
}

export function weekDates(offset = 0) {
  const monday = addDays(startOfWeek(new Date()), offset * 7)
  return Array.from({ length: 7 }, (_, i) => isoDate(addDays(monday, i)))
}

export function formatWhen(iso) {
  const date = parseISO(iso)
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    weekdayLong: date.toLocaleDateString('en-GB', { weekday: 'long' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    label: date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

export function listNames(people) {
  const names = people.map((person) => person.name)
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function voteSummary(state, recipeId) {
  const love = []
  const yes = []
  const no = []
  const unseen = []
  for (const person of state.roommates) {
    const vote = state.votes[person.id]?.[recipeId]
    if (vote === 'love') love.push(person)
    else if (vote === 'yes') yes.push(person)
    else if (vote === 'no') no.push(person)
    else unseen.push(person)
  }
  const parts = []
  if (love.length) parts.push(`${listNames(love)} loved it`)
  if (yes.length) parts.push(`${listNames(yes)} said yes`)
  if (no.length) parts.push(`${listNames(no)} said nope`)
  if (unseen.length === state.roommates.length) parts.push('No one has swiped')
  else if (unseen.length === 1) parts.push(`${unseen[0].name} hasn't swiped`)
  else if (unseen.length) parts.push(`${listNames(unseen)} haven't swiped`)
  return { love, yes, no, unseen, line: parts.join(' · ') }
}

export function recipeImage(recipe) {
  if (!recipe) return ''
  if (recipe.image) return recipe.image
  if (recipe.illustrated) return ''
  const base = (import.meta.env && import.meta.env.BASE_URL) || '/'
  return `${base}food/${recipe.id}.jpg`
}

export function blankDay(date, roommates) {
  const members = {}
  for (const person of roommates) {
    members[person.id] = { eating: true, canCook: true, canDishes: true }
  }
  return {
    date,
    status: 'home',
    note: '',
    recipeId: null,
    mealLocked: false,
    cookId: null,
    cookLocked: false,
    dishId: null,
    dishLocked: false,
    members,
  }
}

function eatingIds(day) {
  return Object.entries(day.members || {})
    .filter(([, member]) => member.eating)
    .map(([id]) => id)
}

export function eatersOf(state, day) {
  if (!day || day.status !== 'home') return []
  const ids = new Set(eatingIds(day))
  return state.roommates.filter((person) => ids.has(person.id))
}

export function hardBlocks(recipe, eaters) {
  const reasons = []
  for (const person of eaters) {
    if (person.diet === 'vegetarian' && recipe.kind !== 'veg') {
      reasons.push(`${person.name} doesn't eat ${recipe.kind === 'fish' ? 'fish' : 'meat'}`)
    }
    for (const allergen of recipe.allergens || []) {
      if (person.allergies?.includes(allergen)) {
        reasons.push(`${person.name} can't have ${allergenLabel(allergen).toLowerCase()}`)
      }
    }
  }
  return reasons
}

export function swapsFor(recipe, eaters) {
  const notes = []
  for (const item of recipe.ingredients || []) {
    if (!item.optional || !item.allergen) continue
    const hit = eaters.filter((person) => person.allergies?.includes(item.allergen))
    if (hit.length) {
      notes.push(`Skip ${item.item} (${allergenLabel(item.allergen).toLowerCase()}) for ${listNames(hit)}`)
    }
  }
  return notes
}

export function optionalAllergens(recipe) {
  const ids = []
  for (const item of recipe.ingredients || []) {
    if (item.optional && item.allergen && !ids.includes(item.allergen)) ids.push(item.allergen)
  }
  return ids
}

export function dutyRecord(plans, personId, role, beforeIso) {
  const start = isoDate(addDays(parseISO(beforeIso), -DUTY_WINDOW))
  let done = 0
  let available = 0
  let last = ''
  let seen = false
  for (const date of Object.keys(plans)) {
    if (date >= beforeIso) continue
    const day = plans[date]
    if (!day?.members?.[personId]) continue
    seen = true
    if (date < start || day.status !== 'home') continue
    const member = day.members[personId]
    const eaters = eatingIds(day).length
    if (eaters < 2) continue
    const free = member.eating && (role === 'cook' ? member.canCook : member.canDishes)
    if (!free) continue
    available += 1
    const assigned = role === 'cook' ? day.cookId : day.dishId
    if (assigned === personId) {
      done += 1
      if (date > last) last = date
    }
  }
  return { done, available, last, seen }
}

function rateOf(record) {
  if (!record.available) return null
  return record.done / record.available
}

function candidateKey(plans, person, role, date, pool) {
  const record = dutyRecord(plans, person.id, role, date)
  if (!record.seen || record.available === 0) {
    const others = pool
      .filter((item) => item.id !== person.id)
      .map((item) => dutyRecord(plans, item.id, role, date))
      .map(rateOf)
      .filter((rate) => rate != null)
    const minRate = others.length ? Math.min(...others) : 0
    const yesterday = isoDate(addDays(parseISO(date), -1))
    return { rate: minRate, last: record.seen ? '9999-99-99' : yesterday, order: person.order }
  }
  return { rate: record.done / record.available, last: record.last || '', order: person.order }
}

function unitFrom(text) {
  let hash = 2166136261
  const value = String(text)
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function pickWeighted(items, weights, unit) {
  if (!items.length) return null
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (!total) return items[0]
  let roll = unit * total
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index]
    if (roll <= 0) return items[index]
  }
  return items[items.length - 1]
}

function pickPerson(candidates, plans, role, date, exceptId, salt) {
  let pool = candidates.filter((person) => person.id !== exceptId)
  if (!pool.length) pool = [...candidates]
  if (!pool.length) return null
  if (pool.length === 1) return pool[0].id
  const keys = pool.map((person) => candidateKey(plans, person, role, date, pool))
  const minRate = Math.min(...keys.map((key) => key.rate))
  const weights = keys.map((key) => {
    const behind = Math.max(0, key.rate - minRate)
    const idle = key.last ? 1 : 1.35
    return idle / (0.55 + behind * 6)
  })
  return pickWeighted(pool, weights, unitFrom(`${salt}:${role}:${date}`)).id
}

export function assignDuties(day, roommates, plans, lockedCookId = null, salt = '') {
  if (!day || day.status !== 'home') return { cookId: null, dishId: null }
  const eating = roommates.filter((person) => day.members[person.id]?.eating)
  if (eating.length < 2) {
    const only = eating[0]
    const cookId = only && day.members[only.id].canCook ? only.id : null
    return { cookId, dishId: null }
  }
  const cooks = eating.filter((person) => day.members[person.id].canCook)
  const washers = eating.filter((person) => day.members[person.id].canDishes)
  const cookId =
    lockedCookId && cooks.some((person) => person.id === lockedCookId)
      ? lockedCookId
      : pickPerson(cooks, plans, 'cook', day.date, null, salt)
  const dishId = pickPerson(washers, plans, 'dish', day.date, cookId, salt)
  return { cookId, dishId }
}

export function rankRecipes(state, day, plans = state.plans) {
  const eaters = eatersOf(state, day)
  const recent = new Set()
  const thisWeek = new Set()
  const startRecent = isoDate(addDays(parseISO(day.date), -14))
  const weekStart = isoDate(startOfWeek(parseISO(day.date)))
  const weekEnd = isoDate(addDays(parseISO(weekStart), 7))
  for (const [dayDate, planned] of Object.entries(plans)) {
    if (dayDate === day.date || !planned?.recipeId) continue
    if (dayDate >= startRecent && dayDate < day.date) recent.add(planned.recipeId)
    if (dayDate >= weekStart && dayDate < weekEnd) thisWeek.add(planned.recipeId)
  }

  return state.recipes
    .map((recipe) => {
      const blocks = hardBlocks(recipe, eaters)
      const swaps = swapsFor(recipe, eaters)
      const notes = []
      let score = 0
      const passed = []
      const loved = []
      for (const person of eaters) {
        const vote = state.votes[person.id]?.[recipe.id]
        if (vote === 'love') {
          score += 3
          loved.push(person)
        } else if (vote === 'yes') {
          score += 1.6
        } else if (vote === 'no') {
          score -= 3
          passed.push(person)
        }
      }
      if (loved.length) notes.push(`${listNames(loved)} loved it`)
      if (passed.length) notes.push(`${listNames(passed)} said nope`)
      if (thisWeek.has(recipe.id)) {
        score -= 5
        notes.push('Already this week')
      } else if (recent.has(recipe.id)) {
        score -= 3
        notes.push('Cooked recently')
      }
      let band = 'great'
      if (blocks.length) band = 'blocked'
      else if (passed.length) band = 'dislike'
      else if (thisWeek.has(recipe.id)) band = 'ok'
      return { recipe, score, band, blocks, swaps, notes }
    })
    .sort((a, b) => b.score - a.score || a.recipe.id.localeCompare(b.recipe.id))
}

export function chooseRecipe(state, day, plans = state.plans, options = null) {
  const avoidId = typeof options === 'string' ? options : options?.avoidId || null
  const fresh = Boolean(options && typeof options === 'object' && options.fresh)
  const salt = (options && typeof options === 'object' && options.salt) || `seed:${day.date}`
  let ranked = rankRecipes(state, day, plans).filter((item) => item.band !== 'blocked')
  if (avoidId) {
    const skipped = ranked.filter((item) => item.recipe.id !== avoidId)
    if (skipped.length) ranked = skipped
  }
  const unique = ranked.filter((item) => item.band !== 'ok')
  const repeats = ranked.filter((item) => item.band === 'ok')
  let pool = unique.filter((item) => item.band === 'great')
  if (!pool.length) pool = unique.filter((item) => item.band === 'dislike')
  if (!pool.length) pool = repeats
  if (!pool.length) return null
  const best = pool[0].score
  if (fresh) pool = pool.slice(0, 18)
  else {
    const cluster = pool.filter((item) => item.score >= best - 1.6)
    pool = (cluster.length ? cluster : pool).slice(0, 8)
  }
  const spread = fresh ? 4.2 : 1.8
  const weights = pool.map((item) => Math.exp((item.score - best) / spread))
  return pickWeighted(pool, weights, unitFrom(`${salt}:meal:${day.date}`))
}

function eligible(day, personId, role) {
  const member = day.members[personId]
  if (!member?.eating) return false
  return role === 'cook' ? member.canCook : member.canDishes
}

export function applyAuto(day, state, { meal = false, duties = false, fresh = false, forceDuties = false, salt = null } = {}, plans = state.plans) {
  const next = {
    ...day,
    members: { ...day.members },
  }
  for (const person of state.roommates) {
    if (!next.members[person.id]) {
      next.members[person.id] = { eating: true, canCook: true, canDishes: true }
    }
  }
  if (next.status !== 'home' || eatingIds(next).length === 0) {
    next.recipeId = null
    next.cookId = null
    next.dishId = null
    return next
  }
  const snapshot = { ...state, plans }
  const roll = salt || `seed:${next.date}`
  if (meal && !next.mealLocked) {
    const pick = chooseRecipe(snapshot, next, plans, {
      avoidId: fresh ? next.recipeId : null,
      fresh,
      salt: roll,
    })
    next.recipeId = pick?.recipe.id ?? null
  }
  if (duties) {
    const lockedCook = next.cookLocked && eligible(next, next.cookId, 'cook') ? next.cookId : null
    const assigned = assignDuties(next, state.roommates, plans, lockedCook, roll)
    const cookStillOk = next.cookId && eligible(next, next.cookId, 'cook')
    if (lockedCook) next.cookId = lockedCook
    else if (forceDuties || !cookStillOk) {
      next.cookId = assigned.cookId
      next.cookLocked = false
    }
    const eaters = eatingIds(next).length
    if (eaters < 2) {
      next.dishId = null
      next.dishLocked = false
    } else if (!forceDuties && next.dishLocked && eligible(next, next.dishId, 'dish') && next.dishId !== next.cookId) {
      next.dishId = next.dishId
    } else if (forceDuties || !next.dishId || !eligible(next, next.dishId, 'dish') || next.dishId === next.cookId) {
      next.dishId = assigned.dishId
      next.dishLocked = false
    }
  }
  return next
}

export function buildPlans(recipes, roommates, votes) {
  const state = { recipes, roommates, votes, plans: {} }
  const monday = startOfWeek(new Date())
  const start = addDays(monday, -28)
  const plans = {}
  for (let i = 0; i < 49; i += 1) {
    const date = isoDate(addDays(start, i))
    let day = blankDay(date, roommates)
    day = applyAuto(day, state, { meal: true, duties: true }, plans)
    plans[date] = day
  }
  return plans
}

export function createInitialState() {
  const roommates = ROOMMATES.map((person) => ({ ...person, allergies: [...person.allergies] }))
  const recipes = RECIPES.map((recipe) => ({
    ...recipe,
    allergens: [...recipe.allergens],
    ingredients: recipe.ingredients.map((item) => ({ ...item })),
    steps: [...recipe.steps],
  }))
  const votes = structuredClone(SEED_VOTES)
  for (const person of roommates) {
    votes[person.id] = votes[person.id] || {}
  }
  const plans = buildPlans(recipes, roommates, votes)
  return {
    seedVersion: SEED_VERSION,
    meId: 'elias',
    dismissedTip: false,
    whoOpen: false,
    roommates,
    recipes,
    votes,
    plans,
  }
}

function sortedDates(plans, fromIso) {
  return Object.keys(plans)
    .filter((date) => !fromIso || date >= fromIso)
    .sort()
}

function refillUnlockedMeals(state, fromIso) {
  const plans = { ...state.plans }
  for (const date of sortedDates(plans, fromIso)) {
    const day = plans[date]
    if (day.status !== 'home' || day.mealLocked) continue
    plans[date] = applyAuto(day, state, { meal: true, duties: false }, plans)
  }
  return { ...state, plans }
}

function ensureMembers(day, roommates) {
  const members = { ...day.members }
  for (const person of roommates) {
    if (!members[person.id]) members[person.id] = { eating: true, canCook: true, canDishes: true }
  }
  return { ...day, members }
}

function writeDay(state, date, mutator, auto) {
  const existing = state.plans[date] || blankDay(date, state.roommates)
  let day = ensureMembers(structuredClone(existing), state.roommates)
  day = mutator(day) || day
  const plans = { ...state.plans, [date]: day }
  const nextDay = applyAuto(day, state, auto, plans)
  return { ...state, plans: { ...plans, [date]: nextDay } }
}

export function fairnessRows(state, beforeIso, { includeEnd = false } = {}) {
  const end = includeEnd ? isoDate(addDays(parseISO(beforeIso), 1)) : beforeIso
  return state.roommates.map((person) => ({
    person,
    cook: dutyRecord(state.plans, person.id, 'cook', end),
    dish: dutyRecord(state.plans, person.id, 'dish', end),
  }))
}

function catalogOrder(recipes) {
  const groups = CATEGORIES.map((category) =>
    recipes
      .filter((recipe) => !recipe.custom && recipe.category === category)
      .sort((a, b) => a.id.localeCompare(b.id)),
  ).filter((group) => group.length)
  const leftovers = recipes
    .filter((recipe) => !recipe.custom && !CATEGORIES.includes(recipe.category))
    .sort((a, b) => a.id.localeCompare(b.id))
  if (leftovers.length) groups.push(leftovers)
  const queues = groups.map((group) => [...group])
  const ordered = []
  let moved = true
  while (moved) {
    moved = false
    for (const group of queues) {
      if (group.length) {
        ordered.push(group.shift())
        moved = true
      }
    }
  }
  return [...recipes.filter((recipe) => recipe.custom), ...ordered]
}

export function deckFor(state) {
  const seen = state.votes[state.meId] || {}
  return catalogOrder(state.recipes).filter((recipe) => !seen[recipe.id])
}

export function personById(state, id) {
  return state.roommates.find((person) => person.id === id) || null
}

export function recipeById(state, id) {
  return state.recipes.find((recipe) => recipe.id === id) || null
}

function parseShopQty(qty) {
  const raw = String(qty || '').trim()
  const match = raw.match(/^(\d+(?:[.,]\d+)?)(?:\s*([^\d\s]+))?$/)
  if (!match) return { amount: null, unit: '', raw }
  return { amount: Number(match[1].replace(',', '.')), unit: match[2] || '', raw }
}

function formatShopAmount(amount) {
  const rounded = Math.round(amount * 100) / 100
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) return String(Math.round(rounded))
  return String(rounded)
}

function shopLine(row) {
  if (row.amount != null) {
    const qty = `${formatShopAmount(row.amount)}${row.unit ? ` ${row.unit}` : ''}`.trim()
    return `${qty} ${row.item}`.trim()
  }
  return row.raw ? `${row.raw} ${row.item}`.trim() : row.item
}

export function shoppingList(state, dates) {
  const buckets = new Map()
  const meals = []
  let skipped = 0
  for (const date of dates) {
    const day = state.plans[date]
    if (!day || day.status !== 'home' || !day.recipeId) {
      skipped += 1
      continue
    }
    const recipe = recipeById(state, day.recipeId)
    if (!recipe) {
      skipped += 1
      continue
    }
    meals.push({ date, title: recipe.title })
    for (const ingredient of recipe.ingredients || []) {
      const item = String(ingredient.item || '').trim()
      if (!item) continue
      const parsed = parseShopQty(ingredient.qty)
      const optional = Boolean(ingredient.optional)
      const key = `${item.toLowerCase()}|${parsed.unit}|${optional ? 'opt' : 'need'}`
      const current = buckets.get(key)
      if (!current) {
        buckets.set(key, {
          key,
          item,
          unit: parsed.unit,
          amount: parsed.amount,
          raw: parsed.amount == null ? parsed.raw : '',
          optional,
          allergen: ingredient.allergen || '',
        })
      } else if (parsed.amount != null && current.amount != null) {
        current.amount += parsed.amount
      } else {
        current.raw = [current.raw, parsed.raw].filter(Boolean).join(' + ')
        current.amount = null
      }
    }
  }
  const items = [...buckets.values()]
    .map((row) => ({
      ...row,
      line: shopLine(row),
      note: row.optional ? `Optional${row.allergen ? ` · ${allergenLabel(row.allergen)}` : ''}` : '',
    }))
    .sort((a, b) => Number(a.optional) - Number(b.optional) || a.item.localeCompare(b.item))
  return { meals, items, skipped }
}

function slug(value) {
  return (
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'meal'
  )
}

const PALETTE = ['#9A3412', '#9D174D', '#115E59', '#3730A3', '#3F6212', '#B45309', '#1E40AF', '#7C3AED']

export function reducer(state, action) {
  switch (action.type) {
    case 'replace':
      return action.state
    case 'dismiss-tip':
      return { ...state, dismissedTip: true }
    case 'vote': {
      const meId = state.meId
      return {
        ...state,
        votes: {
          ...state.votes,
          [meId]: { ...state.votes[meId], [action.recipeId]: action.choice },
        },
      }
    }
    case 'clear-my-votes': {
      return { ...state, votes: { ...state.votes, [state.meId]: {} } }
    }
    case 'set-me':
      return { ...state, meId: action.id }
    case 'set-eating-out':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.status = action.out ? 'out' : 'home'
          return day
        },
        { meal: !action.out, duties: true },
      )
    case 'set-member':
      if (action.id !== state.meId) return state
      return writeDay(
        state,
        action.date,
        (day) => {
          day.members[action.id] = { ...day.members[action.id], ...action.patch }
          return day
        },
        { meal: true, duties: true },
      )
    case 'set-note':
      return writeDay(state, action.date, (day) => {
        day.note = action.note
        return day
      }, {})
    case 'choose-recipe':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.recipeId = action.recipeId
          day.mealLocked = true
          day.status = 'home'
          return day
        },
        { duties: true },
      )
    case 'another-recipe': {
      const day = state.plans[action.date]
      if (!day) return state
      const wasLocked = Boolean(day.mealLocked)
      const pick = chooseRecipe(state, { ...day, mealLocked: false }, state.plans, {
        avoidId: day.recipeId,
        fresh: true,
        salt: `another:${Date.now()}:${Math.random()}`,
      })
      if (!pick) return state
      return writeDay(
        state,
        action.date,
        (current) => {
          current.recipeId = pick.recipe.id
          current.mealLocked = wasLocked
          current.status = 'home'
          return current
        },
        { duties: false },
      )
    }
    case 'unlock-meal':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.mealLocked = false
          return day
        },
        { duties: false },
      )
    case 'set-cook':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.cookId = action.id
          day.cookLocked = Boolean(action.id)
          day.status = 'home'
          return day
        },
        {},
      )
    case 'set-dish':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.dishId = action.id
          day.dishLocked = Boolean(action.id)
          return day
        },
        {},
      )
    case 'balance-day':
      return writeDay(
        state,
        action.date,
        (day) => {
          day.cookLocked = false
          day.dishLocked = false
          return day
        },
        { duties: true, forceDuties: true, salt: `shuffle:${Date.now()}:${Math.random()}` },
      )
    case 'resuggest-week': {
      const dates = action.dates
      const salt = `fresh:${Date.now()}:${Math.random()}`
      let plans = { ...state.plans }
      for (const date of dates) {
        const existing = plans[date] || blankDay(date, state.roommates)
        if (existing.status === 'out' || existing.mealLocked) continue
        const day = applyAuto(existing, state, { meal: true, fresh: true, salt: `${salt}:${date}` }, plans)
        plans = { ...plans, [date]: day }
      }
      return { ...state, plans }
    }
    case 'balance-week': {
      const salt = `shuffle:${Date.now()}:${Math.random()}`
      let plans = { ...state.plans }
      for (const date of action.dates) {
        const existing = plans[date]
        if (!existing || existing.status !== 'home') continue
        const day = applyAuto(
          { ...existing, cookLocked: false, dishLocked: false },
          state,
          { duties: true, forceDuties: true, salt: `${salt}:${date}` },
          plans,
        )
        plans = { ...plans, [date]: day }
      }
      return { ...state, plans }
    }
    case 'update-roommate': {
      const roommates = state.roommates.map((person) =>
        person.id === action.id ? { ...person, ...action.patch, allergies: action.patch.allergies || person.allergies } : person,
      )
      return refillUnlockedMeals({ ...state, roommates }, todayISO())
    }
    case 'add-roommate': {
      const name = action.name.trim()
      if (!name) return state
      const id = `mate-${Date.now()}`
      const person = {
        id,
        name,
        color: PALETTE[state.roommates.length % PALETTE.length],
        diet: 'omnivore',
        allergies: [],
        order: state.roommates.length,
      }
      const today = todayISO()
      const plans = { ...state.plans }
      for (const date of Object.keys(plans)) {
        if (date < today) continue
        plans[date] = {
          ...plans[date],
          members: {
            ...plans[date].members,
            [id]: { eating: true, canCook: true, canDishes: true },
          },
        }
      }
      return {
        ...state,
        roommates: [...state.roommates, person],
        votes: { ...state.votes, [id]: {} },
        plans,
        meId: id,
      }
    }
    case 'remove-roommate': {
      if (state.roommates.length < 2) return state
      const roommates = state.roommates.filter((person) => person.id !== action.id)
      const votes = { ...state.votes }
      delete votes[action.id]
      let next = refillUnlockedMeals({ ...state, roommates, votes, meId: state.meId === action.id ? roommates[0].id : state.meId }, todayISO())
      const plans = { ...next.plans }
      for (const date of Object.keys(plans)) {
        if (date < todayISO()) continue
        const day = plans[date]
        if (day.cookId === action.id || day.dishId === action.id) {
          plans[date] = applyAuto({ ...day, cookLocked: day.cookId === action.id ? false : day.cookLocked, dishLocked: day.dishId === action.id ? false : day.dishLocked }, next, { duties: true }, plans)
        }
      }
      return { ...next, plans }
    }
    case 'add-recipe': {
      const title = action.draft.title.trim()
      if (!title) return state
      let id = slug(title)
      if (state.recipes.some((recipe) => recipe.id === id)) id = `${id}-${Date.now()}`
      const recipe = {
        id,
        title,
        category: action.draft.category || 'Weeknights',
        minutes: Number(action.draft.minutes) || 30,
        serves: Number(action.draft.serves) || 4,
        kind: action.draft.kind,
        spicy: Boolean(action.draft.spicy),
        allergens: action.draft.allergens,
        color: '#E6D3BC',
        image: action.draft.image || '',
        blurb: action.draft.blurb.trim() || 'Added by the flat.',
        ingredients: action.draft.ingredients,
        steps: action.draft.steps,
        custom: true,
      }
      return { ...state, recipes: [recipe, ...state.recipes] }
    }
    case 'delete-recipe': {
      const recipe = recipeById(state, action.id)
      if (!recipe?.custom) return state
      const plans = { ...state.plans }
      for (const date of Object.keys(plans)) {
        if (plans[date].recipeId === action.id) {
          plans[date] = { ...plans[date], recipeId: null, mealLocked: false }
        }
      }
      return {
        ...state,
        recipes: state.recipes.filter((item) => item.id !== action.id),
        plans,
      }
    }
    case 'reset':
      return { ...createInitialState(), whoOpen: false }
    default:
      return state
  }
}

export function scaleQty(qty, factor) {
  const text = String(qty || '').trim()
  const match = text.match(/^(\d+(?:[.,]\d+)?)(?:\s*([^\d\s]+))?(.*)$/)
  if (!match || !factor || factor === 1) return text
  const amount = parseFloat(match[1].replace(',', '.')) * factor
  const unit = match[2] || ''
  const rest = match[3] || ''
  return `${formatAmount(amount)}${unit ? ` ${unit}` : ''}${rest}`.trim()
}

function formatAmount(amount) {
  const quarters = Math.round(amount * 4) / 4
  const whole = Math.floor(quarters + 1e-6)
  const fraction = Math.round((quarters - whole) * 4)
  const glyphs = ['', '¼', '½', '¾']
  if (amount >= 40) return String(Math.round(amount / 5) * 5)
  if (fraction === 0) return String(whole)
  if (!whole) return glyphs[fraction]
  return `${whole}${glyphs[fraction]}`
}

export function upcomingDates(count = 14) {
  const start = parseISO(todayISO())
  return Array.from({ length: count }, (_, index) => isoDate(addDays(start, index)))
}

export function worksForEveryone(recipe, roommates) {
  return hardBlocks(recipe, roommates).length === 0
}

