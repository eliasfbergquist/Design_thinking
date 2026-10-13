import { useStore } from '../store.jsx'
import { FoodImg } from '../ui.jsx'

const GROUPS = [
  ['Loved', 'love'],
  ['Yes', 'yes'],
  ['Nope', 'no'],
]

export function SwipesScreen() {
  const store = useStore()
  const me = store.roommates.find((person) => person.id === store.meId)
  const mine = store.votes[store.meId] || {}
  const total = Object.keys(mine).length

  return (
    <div className="page">
      <a className="back" href="#/swipe">
        Swipe
      </a>
      <h1 className="page-title">{me?.name}'s swipes</h1>
      <p className="quiet">These stay with whoever is holding the phone. The plan is shared.</p>
      {total === 0 && <p>Nothing swiped yet. The deck is still full.</p>}
      {GROUPS.map(([label, choice]) => {
        const items = store.recipes.filter((recipe) => mine[recipe.id] === choice).sort((a, b) => a.title.localeCompare(b.title))
        return (
          <section key={choice} className="panel">
            <div className="panel-label">
              <h2>{label}</h2>
              <span>{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="quiet">None yet.</p>
            ) : (
              items.map((recipe) => (
                <a className="pick" key={recipe.id} href={`#/recipe/${recipe.id}`}>
                  <FoodImg recipe={recipe} className="thumb" />
                  <span>
                    <strong>{recipe.title}</strong>
                    <small>{recipe.minutes} min</small>
                  </span>
                </a>
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}
