import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { RateMeal } from '../ui.jsx'
import { eatersOf, hardBlocks, recipeById, scaleQty, swapsFor, todayISO } from '../logic.js'

export function CookScreen({ id, day }) {
  const store = useStore()
  const recipe = recipeById(store, id)
  const [mode, setMode] = useState('ingredients')
  const [step, setStep] = useState(0)
  const [servings, setServings] = useState(recipe?.serves || 4)
  const storageKey = `dinder.checks.${id}`
  const [checks, setChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checks))
  }, [checks, storageKey])

  useEffect(() => {
    let lock
    let cancelled = false
    navigator.wakeLock
      ?.request('screen')
      .then((held) => {
        if (cancelled) held.release()
        else lock = held
      })
      .catch(() => {})
    return () => {
      cancelled = true
      lock?.release()
    }
  }, [])

  if (!recipe) {
    return (
      <div className="page">
        <a href="#/recipes">Back</a>
        <p>That recipe is gone.</p>
      </div>
    )
  }

  const plan = day ? store.plans[day] : null
  const eaters = plan ? eatersOf(store, plan) : store.roommates
  const blocks = hardBlocks(recipe, eaters)
  const swaps = swapsFor(recipe, eaters)
  const factor = servings / (recipe.serves || 4)
  const done = recipe.ingredients.filter((_, index) => checks[index]).length
  const back = day ? `#/day/${day}` : `#/recipe/${recipe.id}`
  const canRate = Boolean(day && day <= todayISO())

  function leave() {
    window.location.hash = day ? '#/plan' : `#/recipe/${recipe.id}`
  }

  function finish() {
    if (step >= recipe.steps.length - 1) {
      if (canRate) setMode('rate')
      else leave()
      return
    }
    setStep((value) => value + 1)
  }

  return (
    <div className="cook">
      <header className="cook-top">
        <a className="back" href={back}>
          Close
        </a>
        <div>
          <p className="eyebrow">{mode === 'rate' ? 'Rate it' : mode === 'steps' ? `Step ${step + 1} of ${recipe.steps.length}` : 'Ingredients'}</p>
          <h1>{recipe.title}</h1>
        </div>
      </header>
      <div className="progress" aria-hidden="true">
        <span style={{ width: mode === 'ingredients' ? '8%' : `${((step + 1) / recipe.steps.length) * 100}%` }} />
      </div>
      {mode !== 'rate' && (
        <div className="segment cook-seg">
          <button type="button" className={mode === 'ingredients' ? 'on' : ''} data-testid="mode-ingredients" onClick={() => setMode('ingredients')}>
            Ingredients
          </button>
          <button type="button" className={mode === 'steps' ? 'on' : ''} data-testid="mode-steps" onClick={() => setMode('steps')}>
            Steps
          </button>
        </div>
      )}
      <div className="cook-scroll">
        {mode === 'rate' ? (
          <div className="cook-rate">
            <p className="eyebrow">You made it</p>
            <RateMeal recipeId={recipe.id} />
          </div>
        ) : (
          <>
        {blocks.length > 0 && <p className="warn cook-note">{blocks.join(' · ')}</p>}
        {swaps.map((swap) => (
          <p className="swap cook-note" key={swap}>{swap}</p>
        ))}
        {mode === 'ingredients' ? (
          <>
            <div className="servings">
              <span>
                Serves
                <strong>{servings}</strong>
              </span>
              <div>
                <button type="button" onClick={() => setServings((value) => Math.max(1, value - 1))} aria-label="Fewer servings">
                  −
                </button>
                <button type="button" onClick={() => setServings((value) => Math.min(12, value + 1))} aria-label="More servings">
                  +
                </button>
              </div>
            </div>
            <p className="quiet">
              {done} of {recipe.ingredients.length} checked
            </p>
            <ul className="ings">
              {recipe.ingredients.map((item, index) => {
                const on = Boolean(checks[index])
                return (
                  <li key={`${item.item}-${index}`}>
                    <button
                      type="button"
                      className={on ? 'ing-row done' : 'ing-row'}
                      onClick={() => setChecks((current) => ({ ...current, [index]: !current[index] }))}
                    >
                      <span className="box" aria-hidden="true" />
                      <span>
                        <strong>{item.qty ? scaleQty(item.qty, factor) : ''}</strong> {item.item}
                        {item.optional && <em> Optional</em>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="step-text">{recipe.steps[step]}</p>
        )}
          </>
        )}
      </div>
      <footer className="cook-foot">
        {mode === 'rate' ? (
          <button type="button" className="btn full" onClick={leave}>
            Back to the week
          </button>
        ) : mode === 'ingredients' ? (
          <button type="button" className="btn full" onClick={() => setMode('steps')}>
            Start cooking
          </button>
        ) : (
          <div className="step-nav">
            <button type="button" className="btn ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
              Back
            </button>
            <button type="button" className="btn" data-testid="cook-next" onClick={finish}>
              {step >= recipe.steps.length - 1 ? 'Done' : 'Next step'}
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
