import { useState } from 'react'
import { useStore } from '../store.jsx'
import { ALLERGENS, CATEGORIES } from '../data.js'

const EMPTY = {
  title: '',
  minutes: 30,
  serves: 4,
  kind: 'veg',
  category: 'Weeknights',
  spicy: false,
  allergens: [],
  blurb: '',
  ingredientsText: '',
  stepsText: '',
  image: '',
}

export function AddRecipeScreen() {
  const store = useStore()
  const [draft, setDraft] = useState(EMPTY)
  const [error, setError] = useState('')

  function set(patch) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function onFile(file) {
    if (!file) return
    const data = await resizeImage(file)
    set({ image: data })
  }

  function save(event) {
    event.preventDefault()
    const ingredients = draft.ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseLine)
    const steps = draft.stepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (!draft.title.trim() || !ingredients.length || !steps.length) {
      setError('Add a title, at least one ingredient, and one step.')
      return
    }
    store.addRecipe({ ...draft, ingredients, steps })
    window.location.hash = '#/recipes'
  }

  return (
    <form className="page" onSubmit={save}>
      <a className="back" href="#/recipes">
        Recipes
      </a>
      <h1 className="page-title">New recipe</h1>
      <label className="field">
        Title
        <input value={draft.title} onChange={(event) => set({ title: event.target.value })} placeholder="Tuesday lentils" />
      </label>
      <div className="split">
        <label className="field">
          Minutes
          <input type="number" min="5" max="240" value={draft.minutes} onChange={(event) => set({ minutes: event.target.value })} />
        </label>
        <label className="field">
          Serves
          <input type="number" min="1" max="12" value={draft.serves} onChange={(event) => set({ serves: event.target.value })} />
        </label>
      </div>
      <div className="segment three">
        {[
          ['veg', 'Vegetarian'],
          ['fish', 'Fish'],
          ['meat', 'Meat'],
        ].map(([id, label]) => (
          <button type="button" key={id} className={draft.kind === id ? 'on' : ''} onClick={() => set({ kind: id })}>
            {label}
          </button>
        ))}
      </div>
      <p className="quiet">A vegetarian dish with no dairy, eggs, or fish is treated as vegan. Fish is fine for a pescetarian. Gluten-free means gluten is not a hard allergen.</p>
      <label className="field">
        Shelf
        <select value={draft.category} onChange={(event) => set({ category: event.target.value })}>
          {CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="check-line">
        <input type="checkbox" checked={draft.spicy} onChange={(event) => set({ spicy: event.target.checked })} />
        Spicy
      </label>
      <p className="quiet">Hard allergens. If an ingredient can be left out, mark it in the list instead.</p>
      <div className="toggles wrap">
        {ALLERGENS.map(([id, label]) => {
          const on = draft.allergens.includes(id)
          return (
            <button
              type="button"
              key={id}
              className={on ? 'chip-toggle on' : 'chip-toggle'}
              onClick={() => set({ allergens: on ? draft.allergens.filter((item) => item !== id) : [...draft.allergens, id] })}
            >
              {label}
            </button>
          )
        })}
      </div>
      <label className="field">
        Ingredients, one per line
        <textarea
          rows={6}
          value={draft.ingredientsText}
          onChange={(event) => set({ ingredientsText: event.target.value })}
          placeholder={'400 g spaghetti\n4 eggs\n40 g parmesan [dairy]'}
        />
      </label>
      <p className="quiet">A line ending in [dairy] is optional and only blocks someone if they can't skip it.</p>
      <label className="field">
        Steps, one per line
        <textarea rows={6} value={draft.stepsText} onChange={(event) => set({ stepsText: event.target.value })} placeholder={'Boil the pasta.\nToss it with the sauce.'} />
      </label>
      <label className="field">
        One-line description
        <input value={draft.blurb} onChange={(event) => set({ blurb: event.target.value })} />
      </label>
      <label className="field">
        Photo
        <input type="file" accept="image/*" onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
      {draft.image && <img className="preview" src={draft.image} alt="" />}
      {error && <p className="warn">{error}</p>}
      <button type="submit" className="btn full">
        Save recipe
      </button>
    </form>
  )
}

function parseLine(line) {
  const tagged = line.match(/^(.*)\s+\[([a-z]+)\]$/i)
  const body = tagged ? tagged[1] : line
  const allergen = tagged ? tagged[2].toLowerCase() : null
  if (!/^\d/.test(body)) return { qty: '', item: body, optional: Boolean(allergen), allergen }
  const match = body.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?(?:\s+[a-zA-Z]+)?)\s+(.+)$/)
  if (!match) return { qty: '', item: body, optional: Boolean(allergen), allergen }
  return { qty: match[1], item: match[2], optional: Boolean(allergen), allergen }
}

function resizeImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 900 / image.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => resolve('')
    image.src = url
  })
}
