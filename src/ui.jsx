import { useState } from 'react'
import { allergenLabel } from './data.js'
import { listNames, recipeImage, voteSummary } from './logic.js'
import { useStore } from './store.jsx'

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return (parts[0] || '?').slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function Avatar({ person, size = 32 }) {
  if (!person) return <span className="avatar empty" style={{ width: size, height: size }} />
  const letters = initials(person.name)
  return (
    <span
      className="avatar"
      style={{ background: person.color, width: size, height: size, fontSize: Math.round(size * (letters.length > 1 ? 0.32 : 0.42)) }}
      aria-hidden="true"
    >
      {letters}
    </span>
  )
}

export function FoodImg({ recipe, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!recipe) return <div className={`food ${className}`} />
  const src = recipeImage(recipe)
  return (
    <div className={`food ${className}`} style={{ background: recipe.color || '#E6D3BC' }}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <FoodArt recipe={recipe} />}
    </div>
  )
}

export function VoteBreakdown({ recipeId, compact = false }) {
  const store = useStore()
  const summary = voteSummary(store, recipeId)
  const kindFor = (person) => {
    const vote = store.votes[person.id]?.[recipeId]
    if (vote === 'love') return 'love'
    if (vote === 'yes') return 'yes'
    if (vote === 'no') return 'nope'
    return 'new'
  }
  const faces = (
    <span className="vote-faces" aria-label={summary.line}>
      {store.roommates.map((person) => (
        <span className={`face face-${kindFor(person)}`} key={person.id} title={`${person.name}`}>
          <Avatar person={person} size={compact ? 18 : 22} />
        </span>
      ))}
    </span>
  )
  if (compact) return faces
  const rows = [
    ['Loved', 'love', summary.love],
    ['Yes', 'yes', summary.yes],
    ['Nope', 'nope', summary.no],
    ["Hasn't swiped", 'new', summary.unseen],
  ].filter(([, , people]) => people.length)
  return (
    <div className="vote-breakdown">
      {faces}
      <ul>
        {rows.map(([label, kind, people]) => (
          <li key={kind}>
            <span className={`vote-tag ${kind}`}>{label}</span>
            <span>{listNames(people)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#C2410C" />
        <path
          fill="#fff"
          d="M16.1 3.8c.3 2.5 1.8 3.7 2.7 5.4.9.1 2.5.7 3.2 2.1.9 1.7.8 3.5-.1 5-.8 1.3-2.1 2.1-3.6 2.2.4-1.4 0-2.7-.9-3.6-.3 1.8-1.9 3-3.6 3.1-2.2.1-4-1.5-4.6-3.6-.7-2.1.2-4 1.4-5.4.8 1.2 1.9 1.7 2.8 1.5-.7-1.8-.5-3.8.6-5.6.8-1.2 1.5-2 2.1-2.1z"
        />
        <path fill="#F6E2C8" d="M6.8 21.4h18.4c-.5 3.8-4.4 6.5-9.2 6.5s-8.7-2.7-9.2-6.5z" />
        <path fill="#C2410C" opacity="0.28" d="M11.2 23.2c1.1 1.5 2.8 2.3 4.8 2.3s3.7-.8 4.8-2.3c-1.4.6-3 .9-4.8.9s-3.4-.3-4.8-.9z" />
      </svg>
      <span className="logo-word">Dinder</span>
    </span>
  )
}

function hashId(id) {
  let hash = 0
  const text = id || 'meal'
  for (let index = 0; index < text.length; index += 1) hash = (hash * 33 + text.charCodeAt(index)) >>> 0
  return hash
}

export function FoodArt({ recipe }) {
  const n = hashId(recipe?.id)
  const bg = recipe?.color || '#E6D3BC'
  return (
    <svg className="food-art" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="240" height="240" fill={bg} />
      <circle cx={30 + (n % 60)} cy="28" r="72" fill="#fff" opacity="0.18" />
      <g transform={`translate(120 124) rotate(${(n % 13) - 6})`}>{plateArt(recipe?.category, n)}</g>
    </svg>
  )
}

function plateArt(category, n) {
  const sauce = ['#c2410c', '#9a3412', '#3f6212', '#b45309', '#7c2d12'][n % 5]
  const cream = '#fffaf4'
  if (category === 'Pasta') {
    return (
      <>
        <ellipse cx="0" cy="16" rx="74" ry="20" fill="#000" opacity="0.08" />
        <ellipse cx="0" cy="6" rx="84" ry="28" fill={cream} />
        <path d="M-52 2c22-20 40 18 64-2" fill="none" stroke={sauce} strokeWidth="9" strokeLinecap="round" />
        <path d="M-48 14c24-16 38 16 60 0" fill="none" stroke="#e7c27a" strokeWidth="8" strokeLinecap="round" />
        <circle cx="34" cy="-6" r="7" fill="#3f6212" />
      </>
    )
  }
  if (category === 'Tacos') {
    return (
      <>
        <path d="M-58 18c18-46 46-46 64 0z" fill="#e7c27a" />
        <path d="M-46 16c14-30 32-30 44 0z" fill="#6b8f4e" />
        <path d="M-28 14c8-16 18-16 24 0z" fill={sauce} />
        <path d="M8 20c16-42 42-42 58 0z" fill="#f0d7a4" />
        <path d="M20 18c12-26 28-26 40 0z" fill="#d4533c" />
      </>
    )
  }
  if (category === 'Curries' || category === 'Soups') {
    return (
      <>
        <ellipse cx="0" cy="28" rx="70" ry="16" fill="#000" opacity="0.1" />
        <path d="M-62 10c0 36 28 58 62 58s62-22 62-58z" fill={cream} />
        <ellipse cx="0" cy="8" rx="62" ry="22" fill={category === 'Soups' ? '#e7a05a' : sauce} />
        <path d="M-18 -36c0 16 8 20 8 32" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M8 -44c0 18 10 22 8 36" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      </>
    )
  }
  if (category === 'Burgers') {
    return (
      <>
        <ellipse cx="0" cy="34" rx="62" ry="16" fill="#e7c27a" />
        <rect x="-58" y="6" width="116" height="22" rx="8" fill={sauce} />
        <rect x="-58" y="-8" width="116" height="12" rx="4" fill="#6b8f4e" />
        <ellipse cx="0" cy="-22" rx="62" ry="18" fill="#f0d7a4" />
        <circle cx="46" cy="-4" r="10" fill="#d4533c" />
      </>
    )
  }
  if (category === 'Rice') {
    return (
      <>
        <ellipse cx="0" cy="30" rx="72" ry="16" fill="#000" opacity="0.08" />
        <path d="M-66 8c4 40 28 62 66 62s62-22 66-62z" fill={cream} />
        <ellipse cx="0" cy="6" rx="58" ry="20" fill="#f3ead4" />
        {[-30, -10, 8, 26, -18, 16].map((x, index) => (
          <ellipse key={x} cx={x} cy={index % 2 ? 2 : 10} rx="7" ry="4" fill="#fff" opacity="0.85" />
        ))}
        <circle cx="20" cy="-2" r="8" fill={sauce} />
      </>
    )
  }
  if (category === 'Salads') {
    return (
      <>
        <ellipse cx="0" cy="18" rx="78" ry="22" fill="#000" opacity="0.08" />
        <ellipse cx="0" cy="8" rx="84" ry="30" fill={cream} />
        <ellipse cx="-20" cy="-2" rx="28" ry="16" fill="#3f6212" transform="rotate(-20)" />
        <ellipse cx="18" cy="4" rx="26" ry="14" fill="#166534" transform="rotate(18)" />
        <ellipse cx="0" cy="-8" rx="16" ry="10" fill="#84cc16" />
        <circle cx="24" cy="-10" r="8" fill="#d4533c" />
      </>
    )
  }
  if (category === 'Bakes') {
    return (
      <>
        <rect x="-70" y="-28" width="140" height="86" rx="16" fill="#9a3412" />
        <rect x="-60" y="-18" width="120" height="66" rx="10" fill={sauce} />
        <ellipse cx="-16" cy="8" rx="18" ry="10" fill="#f0d7a4" />
        <ellipse cx="22" cy="2" rx="16" ry="9" fill="#6b8f4e" />
      </>
    )
  }
  return (
    <>
      <ellipse cx="0" cy="36" rx="78" ry="14" fill="#000" opacity="0.1" />
      <path d="M-78 8c8 28 148 28 156 0 4-8-8-16-78-16s-82 8-78 16z" fill="#3f2a22" />
      <ellipse cx="0" cy="2" rx="62" ry="22" fill={sauce} />
      <circle cx="-16" cy="-2" r="10" fill="#6b8f4e" />
      <circle cx="18" cy="6" r="8" fill="#f0d7a4" />
    </>
  )
}

export function AllergenChips({ recipe }) {
  const store = useStore()
  const hard = recipe.allergens || []
  const affects = (id) => store.roommates.some((person) => person.allergies?.includes(id))
  const optional = []
  for (const item of recipe.ingredients || []) {
    if (item.optional && item.allergen && !optional.includes(item.allergen) && !hard.includes(item.allergen)) {
      optional.push(item.allergen)
    }
  }
  if (!hard.length && !optional.length) {
    return <span className="pill quiet">No common allergens</span>
  }
  return (
    <>
      {hard.map((id) => (
        <span className={affects(id) ? 'pill alert' : 'pill'} key={id}>
          {allergenLabel(id)}
        </span>
      ))}
      {optional.map((id) => (
        <span className="pill" key={id}>
          {allergenLabel(id)} on the side
        </span>
      ))}
    </>
  )
}

export function Sheet({ title, onClose, children, testId }) {
  return (
    <div className="sheet-back" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-label={title} data-testid={testId} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Icon({ name }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'swipe') {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M8 12h8" />
      </svg>
    )
  }
  if (name === 'plan') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }
  if (name === 'book') {
    return (
      <svg {...common}>
        <path d="M5 4.5h6.5a2 2 0 0 1 2 2V20a2 2 0 0 0-2-1.5H5z" />
        <path d="M19 4.5h-6.5a2 2 0 0 0-2 2V20a2 2 0 0 1 2-1.5H19z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}
