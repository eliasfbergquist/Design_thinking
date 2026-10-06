import { createInitialState, formatWhen, personById, recipeById, todayISO, weekDates, fairnessRows } from '../src/logic.js'

const state = createInitialState()
console.log('today', todayISO())
for (const offset of [0, 1]) {
  console.log(`\nWEEK ${offset}`)
  for (const date of weekDates(offset)) {
    const day = state.plans[date]
    const meal = recipeById(state, day.recipeId)
    const cook = personById(state, day.cookId)
    const dish = personById(state, day.dishId)
    const out = state.roommates.filter((person) => day.members[person.id] && !day.members[person.id].eating).map((person) => person.name)
    const blocks = []
    if (day.members.noah && !day.members.noah.canCook) blocks.push('noah-cant-cook')
    if (day.members.jonas && !day.members.jonas.canDishes) blocks.push('jonas-cant-wash')
    console.log(
      date,
      formatWhen(date).weekday.padEnd(3),
      day.status.padEnd(4),
      (meal?.title || '—').padEnd(24),
      `cook ${cook?.name || '—'}`.padEnd(14),
      `wash ${dish?.name || '—'}`.padEnd(14),
      out.length ? `out ${out.join(',')}` : 'all in',
      blocks.join(' '),
    )
  }
}
console.log('\nFAIRNESS including today')
for (const row of fairnessRows(state, todayISO(), { includeEnd: true })) {
  console.log(
    row.person.name.padEnd(8),
    `cook ${row.cook.done}/${row.cook.available}`,
    `wash ${row.dish.done}/${row.dish.available}`,
  )
}
