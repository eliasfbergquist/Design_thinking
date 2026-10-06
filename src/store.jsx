import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { SEED_VERSION, createInitialState, reducer } from './logic.js'

const KEY = 'dinder.v1'
const StoreContext = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (parsed.seedVersion !== SEED_VERSION || !parsed.recipes || !parsed.roommates) return createInitialState()
    return parsed
  } catch {
    return createInitialState()
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const [whoOpen, setWhoOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const api = {
    ...state,
    whoOpen,
    setWhoOpen,
    dispatch,
    vote: (recipeId, choice) => dispatch({ type: 'vote', recipeId, choice }),
    clearMyVotes: () => dispatch({ type: 'clear-my-votes' }),
    setMe: (id) => {
      dispatch({ type: 'set-me', id })
      setWhoOpen(false)
    },
    dismissTip: () => dispatch({ type: 'dismiss-tip' }),
    setEatingOut: (date, out) => dispatch({ type: 'set-eating-out', date, out }),
    setMember: (date, id, patch) => dispatch({ type: 'set-member', date, id, patch }),
    setNote: (date, note) => dispatch({ type: 'set-note', date, note }),
    chooseRecipe: (date, recipeId) => dispatch({ type: 'choose-recipe', date, recipeId }),
    anotherRecipe: (date) => dispatch({ type: 'another-recipe', date }),
    unlockMeal: (date) => dispatch({ type: 'unlock-meal', date }),
    setCook: (date, id) => dispatch({ type: 'set-cook', date, id }),
    setDish: (date, id) => dispatch({ type: 'set-dish', date, id }),
    balanceDay: (date) => dispatch({ type: 'balance-day', date }),
    resuggestWeek: (dates) => dispatch({ type: 'resuggest-week', dates }),
    balanceWeek: (dates) => dispatch({ type: 'balance-week', dates }),
    updateRoommate: (id, patch) => dispatch({ type: 'update-roommate', id, patch }),
    addRoommate: (name) => dispatch({ type: 'add-roommate', name }),
    removeRoommate: (id) => dispatch({ type: 'remove-roommate', id }),
    addRecipe: (draft) => dispatch({ type: 'add-recipe', draft }),
    deleteRecipe: (id) => dispatch({ type: 'delete-recipe', id }),
    reset: () => dispatch({ type: 'reset' }),
    replace: (next) => dispatch({ type: 'replace', state: next }),
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore outside provider')
  return value
}
