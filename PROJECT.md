# Dinder

A phone-first prototype for a flat that eats together. Roommates swipe meals, the week fills in from what everyone can actually eat, and cooking and dishes rotate with a quiet lean toward fairness.

This file is the project brain. Update it when the product, the rules, or the build change. It is written so another person can keep going without a walkthrough: what the app is for, where the code lives, and which numbers the planner actually uses.

## Status

- Step 1 is in the browser: swipe, a shared week, cook mode, allergies, and a rota.
- The app is called Dinder. The header mark is a flame sitting in a bowl.
- Stack: Vite 6 + React 18, JSX, no TypeScript, no router library, no backend. State is one object in `localStorage`.
- Demo flat: Elias, Luca, Lars Kristian, Lisa, Pavle, Shahrzad, Tobias. Thirty-eight dinners, each with a photograph in `public/food`. A drawn plate only appears if a photo fails to load.
- Run `npm run dev` and open the URL Vite prints (port 5173). On a laptop the app sits in a phone frame. On a narrow screen it is full bleed. Same Wi-Fi: use the Network URL on a phone.

## Why this shape

The useful thing to prototype is the daily loop, not accounts or scale.

1. Someone has the phone and swipes a few dinners.
2. The week proposes meals the people who are actually home can eat.
3. Cook and dishes fall to whoever is free, leaning toward people who have done it less, without turning that into a score.
4. Tonight opens into a cook view you can leave on the counter.

Web is only the delivery wrapper. Layout, type, and tap targets are for a phone held in one hand. Keep changes small and reversible. If a rule is wrong, change it in `src/logic.js` and describe the new rule here.

## Non-goals

- Accounts, sync, or a real backend.
- Nutrition math or grocery checkout.
- Hardening, tests-as-a-product, or scale.
- Treating two similar dinners as one dish with inherited votes. Each recipe is its own card.

## Product rules

### Eating together

The default is that everyone is in for dinner. A person can sit out a day. The whole flat can mark a day as eating out (no meal, no duties, rota does not move).

Availability (`#/availability`) is a month for the person holding the phone. A day is green when they are in and can cook and wash, amber when they are in but cannot cook or cannot wash, stone when they are out, and striped when the flat is eating out. The selected day has a dark ring, and In, Cook, and Wash stay pinned under the month. Switch the name at the top to answer for someone else. The day screen still has Who's in for that one night, with the same rule: green means selected, stone means not, and other people's rows stay readable and do not take taps.

The saved plan used to stop a few weeks after it was first created, so November and later opened as empty days. On each load the app now keeps every existing day and fills any gap from four weeks before this Monday through the Sunday ten weeks ahead.

### Swipes

Swipes belong to whoever is marked as holding the phone. The plan is shared.

- **Yes** — I'd eat this. Worth 1.6 when that person is eating.
- **Love** — you want this dinner. Worth 3. The card stamps Love. There is no separate "soon".
- **Nope** — don't plan this for me while I'm eating. Worth −3, and it moves the meal into the "dislike" band so automatic planning skips it. The button, the stamp, and the notes all say "nope". The saved vote is still `'no'`.

A nope is a veto for *automatic* planning only. The flat can still pick that meal by hand. Unseen meals score 0. Nopes do not expire.

The suggested dinner, and each home night on the week plan, shows who loved it, said yes, said nope, or has not swiped. On the day that is a labeled list. On the plan it is a row of faces: rust ring for love, green for yes, tomato for nope, faded for not yet. `#/swipes` lists the phone holder's own votes, grouped Loved, Yes, and Nope. It opens from the name at the top. Switching person shows that person's list.

A dinner that has already happened, and the end of cook mode for today or a past night, can be rated Love, Yes, or Nope. That write replaces the swipe already stored for the person holding the phone.

The deck is shuffled once per person. Voting removes a card, and the card behind it stays next, because the shuffle is of the whole catalog and then the seen cards are skipped. Clearing your swipes deals a new order. A dish the person holding the phone cannot eat, because of their diet or a hard allergy, is not in their deck. The rest of the flat can still be planned that meal. The card shows a leaf for vegan or vegetarian, and a crossed leaf for gluten-free, when those apply. Vegan already counts as vegetarian, so only one of those two is shown.

### Allergies, diet, and swaps

Hard conflicts are never auto-planned:

- An allergen on a required ingredient (`recipe.allergens`).
- Meat (`kind === 'meat'`) for a pescetarian. Fish and vegetarian dishes stay open. The UI word is Pescetarian.
- Meat or fish for a vegetarian. The copy says "fish" when `kind === 'fish'`, otherwise "meat". Shrimp dishes are marked `fish` so a vegetarian is blocked, and they also carry the `shellfish` allergen.
- Anything that is not vegan for a vegan. A dish is vegan when `kind === 'veg'` and the hard allergens do not include dairy, eggs, fish, or shellfish. Optional cheese on the side does not block them. The copy says "eats vegan" when the dish is vegetarian but has dairy or eggs.

**Table swaps** are optional ingredients with an allergen (cheddar on the tacos, parmesan on the tomato pasta). The meal stays eligible. The cook view names who needs the swap. Allergen chips turn red only when someone in the flat has that allergy. Optional allergens render as "X on the side" and are not red.

Allergies and diet are editable. Unlocked future dinners are re-picked when they change. Dinners someone explicitly chose stay put, with a warning if they no longer fit.

### Planning

The app pre-fills ten weeks ahead, plus four weeks of history, and tops that up on load without wiping what is already saved. Suggested meals stay unlocked (`mealLocked: false`).

The week list opens on today. Days earlier in the same week are behind "Earlier this week", for re-rating. Other weeks use the arrows, as far as the plan goes.

On the plan and on a day, "I want something" takes a few words (chicken, soup, rice) and suggests one dinner. Blocked meals stay out. Votes, a nope, and "already this week" still count. The suggestion is unlocked, so it still has to be accepted. If nothing eligible matches, the night is left as it was.

- **Accept this dinner** locks the suggestion that is already showing.
- **Another idea** on a suggestion draws a new one and leaves it unlocked, so you can look and then accept. On a chosen dinner it replaces the meal and stays locked.
- Picking from the list locks that dinner.
- **Make this a suggestion again** clears the lock and keeps the same meal. It does not draw a new one.
- **Resuggest** draws again for every unlocked night in the week on screen. It refuses the meal that was just there if anything else is eligible. Loved and yes votes are more likely. Unseen meals can still surface. A dinner already on this calendar week is pushed down.
- The first fill is deterministic from the date, so a reload does not shuffle a saved week. Resuggest is the shuffle, because it uses a fresh salt.
- If nothing is safe, the day stays empty and says so.

### Duties

Cooking and washing are separate. The suggestion is a weighted draw among people who are eating and free for that job. It is not "whoever is furthest behind always goes."

- Share is `times they did it / nights they were free`, over the 28 days before the dinner.
- A night counts as free when they were eating, not blocked for that job, at least two people were eating, and the flat was home.
- Eating out, sitting out, or "can't cook / can't wash" excuses that night. It does not create a debt.
- Someone with no history yet is treated as if they are at the group's lowest current rate, so a new flatmate is not dumped on.
- There is no scoreboard. `fairnessRows` still exists for scripts. Do not put the counts back on House or the day screen unless the product decision changes.
- **Shuffle duties** draws again. A cook or dishwasher set by hand sticks until then.
- Solo dinners: they can cook for themselves. Dishes are not assigned, and the rota does not move.
- The dishwasher is picked from everyone except the cook. If that leaves nobody, the cook can wash too.

### Demo flat

Everyone is an omnivore with no allergies and no swipes. Elias holds the phone. Nobody is sitting out, blocked from a duty, or booked for eating out. The week is still filled, but only from the catalog, because unseen meals score 0.

| Person | id | Constraint |
| --- | --- | --- |
| Elias | `elias` | None. Default phone holder |
| Luca | `luca` | None |
| Lars Kristian | `lars-kristian` | None |
| Lisa | `lisa` | None |
| Pavle | `pavle` | None |
| Shahrzad | `shahrzad` | None |
| Tobias | `tobias` | None |

The dishes themselves are an output of the scorer, so they move when votes or `SEED_VERSION` change. History is generated by the same `applyAuto` as the live app, walking forward from four weeks before this Monday.

## Repository

```
README.md               how to run it. This file is the rest
index.html              fonts, title, favicon, viewport
vite.config.js          host true, port 5173
src/main.jsx            React root, StrictMode
src/App.jsx             hash router and the phone shell
src/store.jsx           localStorage and the action API
src/logic.js            dates, scoring, rota, reducer. Change rules here
src/data.js             allergens, flat, votes, the first 20 recipes, SEED_VERSION
src/more-recipes.js     the other 80 recipes
src/ui.jsx              avatar, logo, food image, drawn plate, vote faces, sheet, icons
src/styles.css          the whole visual system
src/screens/            one file per surface
public/food/            JPEGs for the original 20, named {recipeId}.jpg
public/favicon.svg      the flame-in-a-bowl mark
scripts/preview-week.mjs
scripts/shots.mjs
scripts/fetch-images.mjs
```

There is no test suite. `npm run week` prints this week, next week, and the hidden duty counts. Use it after touching `logic.js`.

## Run

```bash
npm install
npm run dev
```

Vite binds `0.0.0.0:5173`. The laptop URL is `http://localhost:5173/`. The Network URL is the one to open on a phone.

```bash
npm run build      # static build in dist/
npm run preview    # serve that build
npm run week       # print the seeded week
npm run shots      # phone screenshots into shots/
npm run images     # re-download the original Unsplash JPEGs
```

`shots/` is gitignored. Screenshots use Playwright against installed Microsoft Edge (`channel: 'msedge'`), because downloading Playwright's own Chrome failed in this environment (`cdn.playwright.dev` did not resolve). Override the base URL with `SUPPER_URL` if the port is not 5173. The script reloads with `?shot=` before the hash so a sheet left open does not stick across routes.

Node was not on the machine originally. It is OpenJS Node.js LTS, installed for the user. A new shell needs the user and machine `Path` refreshed before `npm` is visible.

## Routing

There is no react-router. `src/App.jsx` reads `location.hash`.

| Hash | Screen | Notes |
| --- | --- | --- |
| `#/swipe` | `SwipeScreen` | Default. Also the fallback for an unknown route |
| `#/plan` | `PlanScreen` | Brand mark links here |
| `#/day/YYYY-MM-DD` | `DayScreen` | |
| `#/recipes` | `RecipesScreen` | |
| `#/recipe/:id` | `RecipeScreen` | |
| `#/cook/:id` | `CookScreen` | Optional `?d=YYYY-MM-DD` ties swaps to that day's eaters |
| `#/house` | `HouseScreen` | |
| `#/add` | `AddRecipeScreen` | |
| `#/availability` | `AvailabilityScreen` | Optional `?d=YYYY-MM-DD` opens that day. Plan and the day screen link here |
| `#/swipes` | `SwipesScreen` | The phone holder's own yes, love, and nope list |

Cook mode hides the header and the tab bar. The shell sets `document.title` to `{screen} · Dinder` and `data-today` / `data-screen` on the app root for the screenshot script. `DayScreen` is keyed by the date, so a sheet open on one night does not stay open after the hash moves to another day.

The "Tonight" link under the logo opens cook mode when there is a meal, otherwise the day. Eating out opens the day.

Bottom nav: Swipe, Plan, Recipes, House. The Recipes tab stays active on a recipe detail page.

## State

`src/store.jsx` loads once, then `useReducer(reducer)`. Every change is written to `localStorage` key `dinder.v1`.

On load, missing data, bad JSON, or `seedVersion !== SEED_VERSION` throws the saved flat away and calls `createInitialState()`. Bump `SEED_VERSION` in `src/data.js` when seed people, seed votes, seed recipes, or the shape of a saved plan changes. A scoring tweak does not need a bump: saved weeks stay until someone hits Resuggest or Reset. A bump is still the easy way to see a fresh demo.

The current demo is version 6. Versions 3 through 6 all landed on 2026-10-13. A browser that still has an older save is replaced by the clean flat on the next load. See the changelog for what each bump threw away.

`whoOpen` is React state, not part of the saved source of truth. A `whoOpen` field inside the saved object is leftover and ignored.

The household export is `JSON.stringify(store)`. Functions on the store API disappear. Import accepts any object with `roommates`, `recipes`, and `plans`, and replaces the whole state. It does not check `seedVersion`.

Ingredient checkmarks in cook mode are a second key, `dinder.checks.{recipeId}`. They are not part of the household file.

### Saved object

```js
{
  seedVersion,          // number, currently 6
  meId,                 // roommate id holding the phone. Seed is 'elias'
  dismissedTip,         // swipe hint closed
  whoOpen,              // ignored; see above
  roommates: [{
    id, name, color,    // color is the avatar fill
    diet,               // 'omnivore' | 'vegetarian'
    allergies: [],      // ids from ALLERGENS
    order,              // tie-break only, lower first
  }],
  recipes: [Recipe],
  votes: { [personId]: { [recipeId]: 'yes' | 'love' | 'no' } },
  plans: { [isoDate]: Day },
}
```

### Recipe

```js
{
  id, title,
  category,             // one of CATEGORIES, or it falls into the leftover deck pile
  minutes, serves,
  kind,                 // 'veg' | 'fish' | 'meat'
  spicy,                // boolean, chip only
  allergens: [],        // hard blocks. Ids: gluten, dairy, eggs, nuts, peanuts, soy, fish, shellfish, sesame
  color,                // fallback and the drawn-plate background
  image,                // optional data URL or path. Empty means "use the rule below"
  illustrated,          // true skips the JPEG and draws a plate
  blurb,
  ingredients: [{ qty, item, optional?, allergen? }],
  steps: [],            // one string per step, shown large in cook mode
  custom,               // true if added in the app. Only custom recipes can be deleted
}
```

The first twenty recipes still carry `family`, `variationOf`, and `twist`. Those fields are ignored. Do not revive them. Variations were dropped on purpose: similar dishes are separate cards and do not inherit swipes.

`recipeImage` in `logic.js`: use `recipe.image` if set, else nothing when `illustrated` is true, else `/food/{id}.jpg`. `FoodImg` draws `FoodArt` when there is no URL or the image errors.

### Day

```js
{
  date,                 // 'YYYY-MM-DD', local calendar, not UTC
  status,               // 'home' | 'out'
  note,
  recipeId,             // null if nothing fits or the flat is out
  mealLocked,           // true after Accept, Choose, a Different idea on an already chosen night, or "Put it on the plan"
  cookId, dishId,       // null when the job is not assigned
  cookLocked, dishLocked,
  members: {
    [personId]: { eating, canCook, canDishes }  // all default true
  },
}
```

Dates are local `YYYY-MM-DD` built in `isoDate`. Do not use `toISOString()`, which shifts the day in timezones ahead of UTC. The week starts Monday (`startOfWeek`).

`buildPlans` writes 49 days: from 28 days before this Monday through the Monday three weeks ahead. That is the whole horizon. Days outside it render as "isn't on the plan yet."

## How a decision is made

All of this is in `src/logic.js`. The screens should not reimplement it.

### Meals

`rankRecipes(state, day, plans)` scores every recipe for the people eating that night.

| Signal | Effect |
| --- | --- |
| Love from an eater | +3 |
| Yes from an eater | +1.6 |
| Nope from an eater | −3, and band `dislike` |
| No vote | 0 |
| Same recipe anywhere else in this Monday–Sunday | −5, and band `ok`. Automatic planning skips it until no other eligible meal exists |
| Same recipe in the 14 days before this date, but not this week | −3, note "Cooked recently" |
| Hard block for an eater | band `blocked` |

Bands, in order: `blocked`, `dislike`, `ok` (already this week), otherwise `great`. Sort is score descending, then `id`.

`chooseRecipe` never picks `blocked`.

- Normal fill (`fresh` false, salt defaults to `seed:{date}`): take `great` meals that are not already on this Monday–Sunday. If none, take a `dislike` that is also new this week. A repeat (`ok`) is only allowed when nothing else is eligible. Keep those within 1.6 points of the best, at most 8. Weight is `exp((score - best) / 1.8)`. The roll is a FNV-1a hash of the salt, so the same votes and the same date always pick the same dinner.
- Resuggest and Another idea (`fresh` true): drop the current recipe if any other candidate exists, and still refuse a meal already on this Monday–Sunday until nothing else is eligible. Take the top 18 of that pool. Weight is `exp((score - best) / 4.2)`, so a weaker meal can win. Salt includes `Date.now()` and `Math.random()`, so each tap differs. Choosing by hand can still repeat a dinner.

Resuggest walks the week's dates in order and writes each new pick into `plans` before the next day, so "already this week" sees the new menu rather than the old one. Locked meals and eating-out days are left alone. Resuggest does not move cooks.

`Another idea` keeps the lock state it found: a suggestion stays a suggestion, a chosen dinner stays chosen. `Unlock` ("Make this a suggestion again") only clears the lock.

Changing who is eating re-runs the meal picker for an unlocked day, with the stable salt, so the same group gets the same suggestion. Changing only "can cook" does not change the meal. If the current cook is no longer allowed, duties are redrawn with the stable salt. Shuffle is the only path that forces a new duty draw (`forceDuties`).

### Duties

`dutyRecord` looks at dates strictly before the dinner, inside `DUTY_WINDOW` (28). `fairnessRows` is the same data for scripts. Pass `{ includeEnd: true }` to count the given day too.

`pickPerson` drops the cook when choosing a washer. Weights, relative to the lowest share in the pool:

```
idle = 1.35 if they have never done this job, else 1
weight = idle / (0.55 + (theirShare - lowestShare) * 6)
```

Equal shares are an even draw, with a small edge to someone who has never done it. A person 0.25 ahead (one extra turn in four) is several times less likely, not impossible. One eligible person is just picked.

`assignDuties` returns `{ cookId, dishId }`. A locked cook who is still eligible is kept and excluded from washing. Solo: cook if they can, `dishId` null.

### Deck

`deckFor` filters out recipes this person has already voted on, then uses `catalogOrder`:

1. Custom recipes, in array order (newest first, because add prepends).
2. Everyone else, round-robin across `CATEGORIES`, each category sorted by `id`.

The round-robin is computed on the full catalog and then filtered. Removing a voted card must not pull a later category forward. That was the swipe bug: the peek was `deck[1]` of a freshly interleaved list, and the card that landed was a different recipe.

Swipe shows two cards. The back one is `deck[1]`, scaled and shifted down, `pointer-events: none`, `z-index: 1`. The top card is `z-index: 2`. The whole top card is the drag surface, photo and text. The text does not scroll on its own, and stamps ignore pointers, so a drag that starts on the title moves the card. Commit waits 220ms so the exit animation can finish, then dispatches `vote`. Thresholds: x > 96 yes, x < −96 nope, y < −88 and |x| < 80 love. Arrow keys do the same, except while an input is focused. Empty deck offers Browse and "Swipe them again" (`clear-my-votes` for the current person only). There is no vote button row. The first open shows a coach until `coachVersion` is 1. Arrow keys still vote, except while an input is focused. The nope stamp says Nope. The up stamp says Love.

### Reducer actions

Screens call methods on `useStore()`. Those dispatch:

| Action | What it does |
| --- | --- |
| `vote` | Sets `votes[meId][recipeId]`. Does not touch the plan |
| `clear-my-votes` | Clears votes for `meId` only |
| `set-me` | Changes who holds the phone. Closes the sheet |
| `dismiss-tip` | Hides the swipe hint |
| `set-eating-out` | `status` home/out. Coming home refills meal and duties |
| `set-member` | Patches one person's flags, then meal + duties. Refuses the patch unless that person is `meId` |
| `set-note` | Note only |
| `choose-recipe` | Sets the recipe, locks it, status home, refreshes duties |
| `another-recipe` | Fresh draw avoiding the current id. Stays locked only if the day was already locked |
| `unlock-meal` | Clears the lock and keeps the current meal |
| `set-cook` / `set-dish` | Manual assignment. Locks that job. Passing a falsy id clears the lock |
| `balance-day` / `balance-week` | Clears duty locks and force-draws. The buttons say Shuffle |
| `resuggest-week` | Fresh meals for unlocked home days in the given date list |
| `update-roommate` | Diet or allergies. Refills unlocked meals from today forward |
| `add-roommate` | Id `mate-{timestamp}`, omnivore, no allergies, next palette color. Added only to today and future days. Switches the phone to them |
| `remove-roommate` | Refuses if they are the last person. Refills unlocked meals. Reassigns a future duty they were holding |
| `add-recipe` | Prepends a `custom` recipe. Slug of the title, plus a timestamp if the id exists |
| `delete-recipe` | Custom only. Clears that recipe off any day and unlocks those meals |
| `reset` | `createInitialState()` |
| `replace` | Import path. Trusts the object |

`writeDay` clones the day, runs the mutator, then `applyAuto`. New roommates missing from an old day are filled in as eating and available.

## Screens

### Swipe — `src/screens/Swipe.jsx`

Deck for `meId`. There are no Yes, Love, or Nope buttons. Drag the card: right for yes, left for nope, up for love. The first visit shows that as a coach card until Got it. The card names allergens, spicy, quick (25 minutes or under), the blurb, who else already said yes or love, hard blocks, and the first swap. Love throws confetti and stamps the card Love. Swipe history is only in the name menu.

### Plan — `src/screens/Plan.jsx`

Hero for today, then a week. Offset runs from −2 to 3. Eating-out rows and empty rows drop the thumbnail (`no-photo`). Today gets a highlight. `eatingNote` and `dutyNote` are shared with the day screen. Each home dinner shows a row of faces: a rust ring loved it, green said yes, tomato said nope, faded has not swiped. **Availability** opens the month. **Shopping list** opens a sheet for the week on screen. The nights in that week start selected when they have a home dinner, and each can be turned off. Quantities with the same item and unit are added. Optional ingredients sit under "On the side". Eating out and empty nights are left off. Ticks last only while the sheet is open.

### Day — `src/screens/Day.jsx`

At home / Eating out. Meal row links into cook mode. A suggestion shows an amber rail, who loved it, said yes, said nope, or has not swiped, and **Accept this dinner**, plus Another idea (still a suggestion) and Pick instead. Today and past home dinners can be rated, which replaces that person's swipe. A chosen dinner shows a green rail, Different idea, Change dinner, and Make this a suggestion again. Who's in lists the phone holder first. Only that row can change In, Cook, and Wash. Green means selected, stone means not. Other rows stay readable and do not accept taps. Duties line plus Shuffle. Past days are labeled "already happened" and stay editable, which will rewrite history the rota later reads. Choose dinner is a sheet with search. With no query it hides blocked meals, because there are a hundred recipes. Search includes them. A nope shows up as "Someone said nope".

### Recipes — `src/screens/Recipes.jsx`

Search matches title, blurb, and ingredient names. "Everyone can eat" uses `worksForEveryone` against the whole flat, not whoever is in tonight. Grouped by `CATEGORIES`. A recipe page can drop the meal onto one of the next 14 days, which locks it. Ingredients list optional items. Custom recipes have Delete.

### Cook — `src/screens/Cook.jsx`

Ingredients or one step at a time. Servings scale with `scaleQty`: quantities become quarters (¼ ½ ¾), and amounts of 40 or more snap to the nearest 5. Checks persist per recipe id. If `?d=` is set, blocks and swaps use that day's eaters; otherwise the whole flat. Requests a screen wake lock and ignores failure. Done on the last step of today or a past night asks for a rating, which replaces that person's swipe, then returns to the plan. A future night, or a recipe opened with no day, skips the rating and returns to the recipe.

### House — `src/screens/House.jsx`

Intro names the seven people. The seed has no diets, allergies, or swipes. Diet toggle and allergen chips per person. Add someone. Export `dinder.json` / import. Reset asks for confirmation, then restores the demo. No duty bars.

### Availability — `src/screens/Availability.jsx`

One month for the phone holder. Days outside the plan are blank. The selected day has a dark ring, and In, Cook, and Wash stay pinned at the bottom. Eating out has no toggles. `?d=` opens that date. "Open the day" goes to `#/day/{date}`. The plan and the day's Who's in both link here.

### Swipes — `src/screens/Swipes.jsx`

Loved, yes, and nope for `meId`, each recipe linking to its page. The name menu opens it.

### Add recipe — `src/screens/AddRecipe.jsx`

Title, minutes, serves, kind, shelf, spicy, hard allergens, ingredients, steps, blurb, optional photo. There is no "variation of" field.

Ingredient lines:

```
400 g spaghetti
4 eggs
40 g parmesan [dairy]
```

A trailing `[allergen]` marks that line optional and tags the allergen. A line that does not start with a number has an empty quantity. The photo is resized on a canvas to max width 900 and stored as a JPEG data URL at quality 0.82.

## Visual system

Tokens live at the top of `src/styles.css`.

- Paper background `#f3eee6`, ink `#1e1814`, tomato `#c2410c`, yes green `#166534`.
- Fraunces for titles and the logo word. Outfit for UI. Both come from Google Fonts in `index.html`. If the font request fails, Georgia and Segoe UI stand in.
- The app is a column of header, scrolling main, and a tab bar that is not an overlay. Height is `100dvh`, with safe-area padding.
- At `min-width: 540px` the page background goes dark (`#241c17`) and `#root` becomes a 400px phone, max height `100dvh - 32px`, 8px border, 36px radius.
- `prefers-reduced-motion` kills transitions and hides the love confetti.
- Logo component is `Logo` in `src/ui.jsx`. The same mark is `public/favicon.svg`. Use it anywhere the product name is shown. Do not set the word "Dinder" as plain text in the header.

`FoodArt` picks a plate, taco, bowl, stacked burger, rice bowl, salad, baking dish, or skillet from `recipe.category`, tinted with `recipe.color`. It has to read at a 54px thumbnail and on the swipe card.

## Images

`public/food/{id}.jpg` is served as `/food/{id}.jpg`. Every catalog dinner has one. The original twenty came from Unsplash, with a few later swapped from Wikimedia Commons after the first downloads were the wrong dish. `carbonara-peas.jpg` is a copy of `carbonara.jpg` on purpose. `npm run images` re-fetches that original Unsplash set and can undo those corrections. Do not run it unless you are ready to look at every photo again.

Dishes that never got a photo that matched the food were dropped or renamed to the picture. `src/more-recipes.js` still holds the unused recipes, and only exports the ones in `WITH_PHOTOS`. A drawn plate is the fallback when a file is missing.

## Changing a rule

1. Change the function in `src/logic.js`, not a screen.
2. Write the new behavior in the product-rules section above, including the numbers if a designer will care.
3. If saved browsers should drop their old week, bump `SEED_VERSION`.
4. Run `npm run week` and read one home day, one eating-out day, and the duty spread.
5. If the change is visible, run `npm run shots` and look at swipe, plan, the day, and house.

Things that look like one-line fixes and are not:

- Re-sorting the swipe deck from the unseen list. The peek will lie again.
- Showing `fairnessRows` in the UI. The product choice is that the lean stays invisible.
- Giving variations a shared `family` and transferring votes. That model was removed because it was hard to explain on a card.
- Using UTC dates. The week will slip a day for this timezone.

## Known leftovers

- `family`, `variationOf`, and `twist` on the original recipes. Safe to delete when touching `data.js`. Nothing reads them.
- `fairnessRows` is exported and used by `scripts/preview-week.mjs` only.
- `whoOpen` is both a dead field on the saved state and a live `useState` in the store.
- The screenshot env var is still named `SUPPER_URL`.
- `fetch-images.mjs` still sends the user agent `SupperPrototype/0.1`.
- Shellfish dishes use `kind: 'fish'`, so a vegetarian is told they "don't eat fish."
- A new roommate is not written onto past days. Their duty history starts empty, and `candidateKey` puts them at the group's minimum rate.
- Reset and a `SEED_VERSION` bump both destroy the in-browser flat, including custom recipes and votes.
- Green curry's blurb says fish sauce is in the paste, so the dish is not vegetarian. That is about the recipe. Blurbs must not say that a named person already skips a food.

## Progress

- 2026-10-06 — Rules, seed flat, and 20 photographed recipes.
- 2026-10-06 — Prototype running locally. Visual pass against phone screenshots.
- 2026-10-06 — Renamed to Dinder. Elias became Jonas, Sam joined. Variations dropped. Deck order fixed. Resuggest redraws the week. Fairness stays in the assigner and off the screen. Eighty more recipes.
- 2026-10-06 — This file expanded into a handoff: routes, saved shape, scores, and where to edit.
- 2026-10-13 — See Changelog. The demo that should be on screen is `SEED_VERSION` 6.

## Changelog

### 2026-10-13

The session made the prototype match this flat, then left a clean demo with no one pre-decided. The app was reloaded after the last change so the trial votes from checking the features are gone.

**The flat.** The five seed people (Jonas, Maja, Noah, Linnea, Sam) became seven: Elias, Luca, Lars Kristian, Lisa, Pavle, Shahrzad, Tobias. Elias holds the phone. An earlier mapping had given Luca dairy, Lars Kristian nuts, Lisa vegetarian, and Pavle shellfish, and had scripted Lisa out on Wednesday, Lars unable to cook on Thursday, the flat eating out on Friday, and Elias unable to wash on Saturday. That is all gone. Everyone is an omnivore with no allergies and no swipes, and every night starts with everyone in. Recipe blurbs that named a person's restriction were rewritten. The week is still filled from the catalog, because an unseen meal scores 0. That fill is not a preference.

**Saying nope.** The left swipe was "Pass" on the button and "Nope" on the stamp. Every user-facing word is now Nope. The stored vote stays `'no'`.

**The swipe card.** A drag that started on the title did nothing, because the text area scrolled and stole the gesture. The whole card now moves. Stamps ignore pointers. Love throws a burst of confetti from the middle of the deck and stamps the card Soon. The burst is hidden when the system asks for reduced motion.

**A single night.** A suggestion has an amber rail and has to be accepted. Accept locks the meal that is already showing. Another idea draws a new one and leaves it unlocked. Pick instead opens the list. A chosen dinner has a green rail: Different idea stays locked, and Make this a suggestion again clears the lock without drawing a new meal. Who's in only edits the person holding the phone. Selected chips are green and unselected chips are stone, including on other people's rows, which stay fully visible and disabled.

**The week.** Plan has a shopping list for the home dinners on screen. Matching quantities are added together. Optional ingredients sit under "On the side". Ticks last only while the sheet is open. Availability is the calendar described under Eating together. The same dinner is not planned twice in one Monday–Sunday unless every other eligible meal is already used. Choosing by hand can still repeat a dish. A nope still only blocks automatic planning.

**What people think.** The suggestion and the week rows show who loved a recipe, said yes, said nope, or has not swiped. `#/swipes` is that person's own history. Voting does not redraw the week; a dinner already on the plan stays there, so a nope can show on a suggestion until someone asks for another idea.

**Seed versions the same day.** `SEED_VERSION` 3 was the rename and the first product fixes. 4 cleared the scripted preferences. 5 added the calendar, confetti, vote faces, the no-repeat rule, and the swipes list. 6 throws away the votes and availability edits made while checking those screens, so a reload is the clean demo again.

### 2026-10-13, later

Availability is one person's month, with In, Cook, and Wash pinned under the calendar. A made dinner can be rated, and that rating replaces the earlier swipe. The swipe deck has no Yes, Love, or Nope buttons. The up-swipe stamp says Love. Swipe history stays in the name menu. The shopping list lets you turn nights off. The first visit to the deck explains the three drags.

### 2026-10-19

Every dinner on the deck is a photograph. Recipes without a matching picture were removed or renamed to the picture. The plan no longer stops at the end of October: loading the app fills any missing day from four weeks back through ten weeks ahead, and leaves days that were already planned. The week opens on today. Diet is now omnivore, pescetarian, vegetarian, or vegan. The swipe deck hides food that person cannot eat and is dealt in a random order that stays put until they clear their swipes. Cards show vegan, vegetarian, and gluten-free when those fit. "I want something" suggests a dinner from that craving plus the usual rules. Initials on the week faces stay white, so they read on the avatar color.

## Open questions

- Should a nope fade after a few months, or stay a veto until they swipe again?
- Is "excused days don't create debt" what this flat actually wants when someone travels for three weeks?
- How strong should the lean be when someone is well ahead on cooking? The current curve is the weight formula in `pickPerson`.
