import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { AllergenChips, FoodImg } from '../ui.jsx'
import { CATEGORIES } from '../data.js'
import { formatWhen, hardBlocks, recipeById, upcomingDates, worksForEveryone } from '../logic.js'

export function RecipesScreen() {
  const store = useStore()
  const [query, setQuery] = useState('')
  const [safeOnly, setSafeOnly] = useState(false)
  const needle = query.trim().toLowerCase()
  const recipes = store.recipes.filter((recipe) => {
    if (safeOnly && !worksForEveryone(recipe, store.roommates)) return false
    if (!needle) return true
    const hay = [recipe.title, recipe.blurb, ...(recipe.ingredients || []).map((item) => item.item)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(needle)
  })

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Recipes</h1>
        <a className="btn small" href="#/add">
          Add
        </a>
      </div>
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals or ingredients" />
      <button type="button" className={safeOnly ? 'chip-toggle on' : 'chip-toggle'} onClick={() => setSafeOnly((value) => !value)}>
        Everyone can eat
      </button>
      {CATEGORIES.map((category) => {
        const items = recipes.filter((recipe) => recipe.category === category)
        if (!items.length) return null
        return (
          <section key={category}>
            <h2 className="cat-title">{category}</h2>
            <ul className="recipe-list">
              {items.map((recipe) => (
                <li key={recipe.id}>
                  <a href={`#/recipe/${recipe.id}`}>
                    <FoodImg recipe={recipe} className="thumb" />
                    <span>
                      <strong>{recipe.title}</strong>
                      <small>{recipe.minutes} min</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {!recipes.length && <p>Nothing matches. Try a wider search, or add the meal yourself.</p>}
    </div>
  )
}

export function RecipeScreen({ id }) {
  const store = useStore()
  const recipe = recipeById(store, id)
  const days = useMemo(() => upcomingDates(14), [])
  if (!recipe) {
    return (
      <div className="page">
        <a href="#/recipes">Recipes</a>
        <p>That recipe isn't here.</p>
      </div>
    )
  }
  const blocks = hardBlocks(recipe, store.roommates)

  return (
    <div className="page">
      <a className="back" href="#/recipes">
        Recipes
      </a>
      <FoodImg recipe={recipe} className="detail-photo" />
      <div className="pills">
        <AllergenChips recipe={recipe} />
      </div>
      <h1 className="page-title">{recipe.title}</h1>
      <p className="meta">
        {recipe.minutes} min · serves {recipe.serves}
        {recipe.kind === 'veg' ? ' · vegetarian' : recipe.kind === 'fish' ? ' · fish' : ''}
      </p>
      <p>{recipe.blurb}</p>
      {blocks.length > 0 && <p className="warn">{blocks.join(' · ')}</p>}
      <a className="btn full" href={`#/cook/${recipe.id}`}>
        Cook this
      </a>
      <label className="field">
        Put it on the plan
        <select
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return
            store.chooseRecipe(event.target.value, recipe.id)
            window.location.hash = `#/day/${event.target.value}`
          }}
        >
          <option value="">Choose a day</option>
          {days.map((date) => (
            <option key={date} value={date}>
              {formatWhen(date).label}
            </option>
          ))}
        </select>
      </label>
      <h2>Ingredients</h2>
      <ul className="plain">
        {recipe.ingredients.map((item, index) => (
          <li key={`${item.item}-${index}`}>
            {item.qty ? `${item.qty} ` : ''}
            {item.item}
            {item.optional ? ' (optional)' : ''}
          </li>
        ))}
      </ul>
      {recipe.custom && (
        <button type="button" className="text-btn danger" onClick={() => { store.deleteRecipe(recipe.id); window.location.hash = '#/recipes' }}>
          Delete this recipe
        </button>
      )}
    </div>
  )
}
