import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { AllergenChips, FoodImg } from '../ui.jsx'
import { deckFor, hardBlocks, listNames, swapsFor } from '../logic.js'

export function SwipeScreen() {
  const store = useStore()
  const deck = deckFor(store)
  const top = deck[0]
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [leaving, setLeaving] = useState(null)
  const [loveBurst, setLoveBurst] = useState(0)
  const point = useRef(null)
  const dragRef = useRef({ x: 0, y: 0 })
  const timer = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function commit(choice) {
    if (!top || leaving) return
    if (choice === 'love') setLoveBurst((count) => count + 1)
    setLeaving(choice)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      store.vote(top.id, choice)
      setLeaving(null)
      dragRef.current = { x: 0, y: 0 }
      setDrag({ x: 0, y: 0 })
    }, 220)
  }

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key === 'ArrowLeft') commit('no')
      if (event.key === 'ArrowRight') commit('yes')
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        commit('love')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!top) {
    return (
      <div className="empty">
        <p className="eyebrow">Caught up</p>
        <h1>You've seen every dinner.</h1>
        <p>New recipes show up here. You can also go through the deck again.</p>
        <a className="btn" href="#/recipes">
          Browse recipes
        </a>
        <button type="button" className="btn ghost" onClick={store.clearMyVotes}>
          Swipe them again
        </button>
        <a className="btn ghost" href="#/swipes">
          Your swipes
        </a>
      </div>
    )
  }

  const shown =
    leaving === 'yes'
      ? { x: 520, y: drag.y }
      : leaving === 'no'
        ? { x: -520, y: 30 }
        : leaving === 'love'
          ? { x: 0, y: -680 }
          : drag

  return (
    <div className="deck">
      {loveBurst > 0 && <LoveConfetti burst={loveBurst} />}
      <a className="deck-link" href="#/swipes" data-testid="your-swipes">
        Your swipes
      </a>
      {!store.dismissedTip && (
        <div className="tip">
          <p>Swiping as {store.roommates.find((person) => person.id === store.meId)?.name}. Right for yes, left for nope, up if you want it soon.</p>
          <button type="button" onClick={store.dismissTip} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <div className="stack">
        {deck.slice(0, 2).reverse().map((recipe, index, list) => {
          const depth = list.length - 1 - index
          const active = depth === 0
          return (
            <article
              key={recipe.id}
              className={active ? 'swipe-card' : 'swipe-card under'}
              data-testid={active ? 'swipe-card' : 'swipe-next'}
              style={
                active
                  ? { zIndex: 2, transform: `translate(${shown.x}px, ${shown.y}px) rotate(${shown.x / 18}deg)` }
                  : { zIndex: 1, transform: 'scale(0.96) translateY(16px)' }
              }
              onPointerDown={
                active
                  ? (event) => {
                      if (leaving) return
                      if (event.pointerType === 'mouse' && event.button !== 0) return
                      event.preventDefault()
                      point.current = { x: event.clientX, y: event.clientY }
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }
                  : undefined
              }
              onPointerMove={
                active
                  ? (event) => {
                      if (!point.current) return
                      const next = { x: event.clientX - point.current.x, y: event.clientY - point.current.y }
                      dragRef.current = next
                      setDrag(next)
                    }
                  : undefined
              }
              onPointerUp={
                active
                  ? () => {
                      if (!point.current) return
                      const { x, y } = dragRef.current
                      point.current = null
                      if (x > 96) commit('yes')
                      else if (x < -96) commit('no')
                      else if (y < -88 && Math.abs(x) < 80) commit('love')
                      else {
                        dragRef.current = { x: 0, y: 0 }
                        setDrag({ x: 0, y: 0 })
                      }
                    }
                  : undefined
              }
              onPointerCancel={
                active
                  ? () => {
                      point.current = null
                      dragRef.current = { x: 0, y: 0 }
                      setDrag({ x: 0, y: 0 })
                    }
                  : undefined
              }
            >
              {active ? <CardBody recipe={recipe} drag={drag} loved={leaving === 'love'} /> : <FoodImg recipe={recipe} className="swipe-photo" />}
            </article>
          )
        })}
      </div>
      <div className="vote-bar">
        <button type="button" className="vote nope" onClick={() => commit('no')}>
          Nope
        </button>
        <button type="button" className="vote love" data-testid="vote-love" onClick={() => commit('love')}>
          Love
        </button>
        <button type="button" className="vote yes" onClick={() => commit('yes')}>
          Yes
        </button>
      </div>
    </div>
  )
}

function LoveConfetti({ burst }) {
  const pieces = Array.from({ length: 54 }, (_, index) => index)
  return (
    <div className="confetti" key={burst} data-testid="love-confetti" aria-hidden="true">
      {pieces.map((index) => {
        const angle = (index / 54) * Math.PI * 2 + (index % 3) * 0.2
        const distance = 90 + (index % 6) * 28
        return (
          <i
            key={index}
            style={{
              background: ['#c2410c', '#f4d7a8', '#166534', '#fffaf4', '#9a3412', '#e7c27a'][index % 6],
              animationDelay: `${(index % 8) * 28}ms`,
              width: index % 3 === 0 ? 11 : 15,
              height: index % 2 === 0 ? 20 : 11,
              borderRadius: index % 4 === 0 ? '50%' : '2px',
              '--drift': `${Math.cos(angle) * distance}px`,
              '--rise': `${Math.sin(angle) * distance - 20}px`,
              '--spin': `${160 + index * 24}deg`,
            }}
          />
        )
      })}
    </div>
  )
}

function CardBody({ recipe, drag, loved }) {
  const store = useStore()
  const others = store.roommates.filter((person) => {
    if (person.id === store.meId) return false
    const vote = store.votes[person.id]?.[recipe.id]
    return vote === 'yes' || vote === 'love'
  })
  const blocks = hardBlocks(recipe, store.roommates)
  const swaps = swapsFor(recipe, store.roommates)
  const yesOpacity = Math.min(1, Math.max(0, drag.x / 90))
  const noOpacity = Math.min(1, Math.max(0, -drag.x / 90))
  const loveOpacity = loved ? 1 : Math.min(1, Math.max(0, -drag.y / 80))

  return (
    <>
      <FoodImg recipe={recipe} className="swipe-photo" />
      <span className="stamp yes" style={{ opacity: yesOpacity }}>
        Yes
      </span>
      <span className="stamp no" style={{ opacity: noOpacity }}>
        Nope
      </span>
      <span className="stamp love" style={{ opacity: loveOpacity }}>
        Soon
      </span>
      <div className="swipe-body">
        <div className="pills">
          <AllergenChips recipe={recipe} />
          {recipe.spicy && <span className="pill">Spicy</span>}
          {recipe.minutes <= 25 && <span className="pill">Quick</span>}
        </div>
        <h2>{recipe.title}</h2>
        <p className="meta">
          {recipe.minutes} min · serves {recipe.serves}
        </p>
        <p className="blurb">{recipe.blurb}</p>
        {others.length > 0 && <p className="social">{listNames(others)} would eat this.</p>}
        {blocks.length > 0 && <p className="warn">{blocks.slice(0, 2).join(' · ')}</p>}
        {blocks.length === 0 && swaps.length > 0 && <p className="swap">{swaps[0]}</p>}
      </div>
    </>
  )
}
