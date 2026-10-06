import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Avatar } from '../ui.jsx'
import { ALLERGENS, allergenLabel } from '../data.js'

export function HouseScreen() {
  const store = useStore()
  const [name, setName] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')

  function exportHouse() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dinder.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function importHouse(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed.roommates || !parsed.recipes || !parsed.plans) {
          setMessage("That file isn't a Dinder household.")
          return
        }
        store.replace(parsed)
        setMessage('Household imported on this phone.')
      } catch {
        setMessage("Couldn't read that file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <h1 className="page-title">The flat</h1>
      <p className="lede">
        Jonas, Maja, Noah, Linnea, and Sam already live here. Maja avoids dairy, Noah avoids nuts, Linnea eats vegetarian, Sam avoids shellfish. Switch person from the name at the top — swipes stay with whoever is holding the phone.
      </p>

      {store.roommates.map((person) => (
        <PersonCard key={person.id} person={person} canRemove={store.roommates.length > 1} />
      ))}

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          store.addRoommate(name)
          setName('')
          setMessage('They join dinner from today, and the rota starts offering them turns.')
        }}
      >
        <h2>Add someone</h2>
        <label className="field">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} placeholder="Name" />
        </label>
        <button type="submit" className="btn">
          Add to the flat
        </button>
      </form>

      <section className="panel">
        <h2>Move the household</h2>
        <p className="quiet">This phone keeps the data. Export the file and import it on someone else's phone to share the plan.</p>
        <div className="row-actions">
          <button type="button" className="btn ghost" onClick={exportHouse}>
            Export
          </button>
          <label className="btn ghost file">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) importHouse(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {message && <p>{message}</p>}
        {confirmReset ? (
          <div className="row-actions">
            <button type="button" className="btn tomato" onClick={() => { store.reset(); setConfirmReset(false) }}>
              Erase and restore the demo
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="text-btn danger" onClick={() => setConfirmReset(true)}>
            Reset household
          </button>
        )}
      </section>
      <p className="quiet">Allergen labels in use: {ALLERGENS.map((item) => allergenLabel(item[0])).slice(0, 3).join(', ')} and the rest, edited per person.</p>
    </div>
  )
}

function PersonCard({ person, canRemove }) {
  const store = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <section className="panel">
      <div className="person-name">
        <Avatar person={person} size={40} />
        <strong>{person.name}</strong>
      </div>
      <div className="segment">
        <button type="button" className={person.diet !== 'vegetarian' ? 'on' : ''} onClick={() => store.updateRoommate(person.id, { diet: 'omnivore' })}>
          Omnivore
        </button>
        <button type="button" className={person.diet === 'vegetarian' ? 'on' : ''} onClick={() => store.updateRoommate(person.id, { diet: 'vegetarian' })}>
          Vegetarian
        </button>
      </div>
      <p className="quiet">Allergies</p>
      <div className="toggles wrap">
        {ALLERGENS.map(([id, label]) => {
          const on = person.allergies.includes(id)
          return (
            <button
              type="button"
              key={id}
              className={on ? 'chip-toggle on' : 'chip-toggle'}
              onClick={() => {
                const allergies = on ? person.allergies.filter((item) => item !== id) : [...person.allergies, id]
                store.updateRoommate(person.id, { allergies })
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      {canRemove &&
        (confirm ? (
          <button type="button" className="text-btn danger" onClick={() => store.removeRoommate(person.id)}>
            Remove {person.name}
          </button>
        ) : (
          <button type="button" className="text-btn" onClick={() => setConfirm(true)}>
            Remove
          </button>
        ))}
    </section>
  )
}
