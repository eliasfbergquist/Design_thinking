# Dinder

A phone-first prototype for a flat that eats together. Roommates swipe meals, the week fills in from what everyone can actually eat, and cooking and dishes rotate with a quiet lean toward fairness.

This file is the project brain. Update it when the product, the rules, or the build change. It is written so another person can keep going without a walkthrough: what the app is for, where the code lives, and which numbers the planner actually uses.

## Status

- Step 1 is in the browser: swipe, a shared week, cook mode, allergies, and a rota.
- The app is called Dinder. The header mark is a flame sitting in a bowl.
- Stack: Vite 6 + React 18, JSX, no TypeScript, no router library, no backend. State is one object in `localStorage`.
- Demo flat: Jonas, Maja, Noah, Linnea, Sam. One hundred dinners. Twenty are photographs in `public/food`. The other eighty are drawn in the app.
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

### Swipes

Swipes belong to whoever is marked as holding the phone. The plan is shared.

- **Yes** — I'd eat this. Worth 1.6 when that person is eating.
- **Love** — cook it soon. Worth 3.
- **Pass** — don't plan this for me while I'm eating. Worth −3, and it moves the meal into the "dislike" band so automatic planning skips it.

A pass is a veto for *automatic* planning only. The flat can still pick that meal by hand. Unseen meals score 0. Passes do not expire.

The deck order is fixed for the catalog. Voting removes a card. The card that was behind it is the next one. Do not rebuild the order from the remaining cards or the peek and the landing card will disagree.

### Allergies, diet, and swaps

Hard conflicts are never auto-planned:

- An allergen on a required ingredient (`recipe.allergens`).
- Meat or fish (`kind` is not `veg`) for a vegetarian who is eating that night. The copy says "fish" when `kind === 'fish'`, otherwise "meat". Shrimp dishes are marked `fish` so a vegetarian is blocked, and they also carry the `shellfish` allergen.

**Table swaps** are optional ingredients with an allergen (cheddar on the tacos, parmesan on the tomato pasta). The meal stays eligible. The cook view names who needs the swap. Allergen chips turn red only when someone in the flat has that allergy. Optional allergens render as "X on the side" and are not red.

Allergies and diet are editable. Unlocked future dinners are re-picked when they change. Dinners someone explicitly chose stay put, with a warning if they no longer fit.

### Planning

The app pre-fills about three weeks ahead, plus four weeks of history, so there is something to react to and the rota has a past. Suggested meals stay unlocked (`mealLocked: false`).

- **Another idea** or picking from the list locks that dinner.
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

| Person | id | Constraint | Why it's here |
| --- | --- | --- | --- |
| Jonas | `jonas` | No allergies, omnivore | Default phone holder. Likes most things, passed on shakshuka |
| Maja | `maja` | Dairy | Forces optional-cheese swaps and blocks creamy dishes |
| Noah | `noah` | Nuts and peanuts | Blocks pesto and massaman |
| Linnea | `linnea` | Vegetarian | Meat and fish nights only work when she sits out |
| Sam | `sam` | Shellfish | Blocks shrimp, prawns, and clam chowder |

Seeded shape of the current week (dates are computed from this Monday, not hardcoded):

- Wednesday: Linnea is out, so a meat dinner can win.
- Thursday: Noah can't cook.
- Friday: eating out, note "Table at the corner place, 19:00". Rota skips the day.
- Saturday: Jonas can't wash.

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
src/ui.jsx              avatar, logo, food image, drawn plate, sheet, icons
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

Cook mode hides the header and the tab bar. The shell sets `document.title` to `{screen} · Dinder` and `data-today` / `data-screen` on the app root for the screenshot script.

The "Tonight" link under the logo opens cook mode when there is a meal, otherwise the day. Eating out opens the day.

Bottom nav: Swipe, Plan, Recipes, House. The Recipes tab stays active on a recipe detail page.

## State

`src/store.jsx` loads once, then `useReducer(reducer)`. Every change is written to `localStorage` key `dinder.v1`.

On load, missing data, bad JSON, or `seedVersion !== SEED_VERSION` throws the saved flat away and calls `createInitialState()`. Bump `SEED_VERSION` in `src/data.js` when seed people, seed votes, seed recipes, or the shape of a saved plan changes. A scoring tweak does not need a bump: saved weeks stay until someone hits Resuggest or Reset. A bump is still the easy way to see a fresh demo.

`whoOpen` is React state, not part of the saved source of truth. A `whoOpen` field inside the saved object is leftover and ignored.

The household export is `JSON.stringify(store)`. Functions on the store API disappear. Import accepts any object with `roommates`, `recipes`, and `plans`, and replaces the whole state. It does not check `seedVersion`.

Ingredient checkmarks in cook mode are a second key, `dinder.checks.{recipeId}`. They are not part of the household file.

### Saved object

```js
{
  seedVersion,          // number, currently 2
  meId,                 // roommate id holding the phone. Seed is 'jonas'
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
  mealLocked,           // true after Another idea, Choose, or "Put it on the plan"
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
| Pass from an eater | −3, and band `dislike` |
| No vote | 0 |
| Same recipe anywhere else in this Monday–Sunday | −5, and band `ok` |
| Same recipe in the 14 days before this date, but not this week | −3, note "Cooked recently" |
| Hard block for an eater | band `blocked` |

Bands, in order: `blocked`, `dislike`, `ok` (already this week), otherwise `great`. Sort is score descending, then `id`.

`chooseRecipe` never picks `blocked`.

- Normal fill (`fresh` false, salt defaults to `seed:{date}`): take `great` meals, or `ok` if there is no `great`, or `dislike` if that is all that exists. Keep those within 1.6 points of the best, at most 8. Weight is `exp((score - best) / 1.8)`. The roll is a FNV-1a hash of the salt, so the same votes and the same date always pick the same dinner.
- Resuggest, Another idea, and Unlock (`fresh` true): drop the current recipe if any other candidate exists. Take the top 18 of the preferred band. Weight is `exp((score - best) / 4.2)`, so a weaker meal can win. Salt includes `Date.now()` and `Math.random()`, so each tap differs.

Resuggest walks the week's dates in order and writes each new pick into `plans` before the next day, so "already this week" sees the new menu rather than the old one. Locked meals and eating-out days are left alone. Resuggest does not move cooks.

`Another idea` locks the new pick. `Unlock` ("Let the flat decide again") clears the lock and draws fresh.

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

Swipe shows two cards. The back one is `deck[1]`, scaled and shifted down, `pointer-events: none`, `z-index: 1`. The top card is `z-index: 2`. Commit waits 220ms so the exit animation can finish, then dispatches `vote`. Thresholds: x > 96 yes, x < −96 pass, y < −88 and |x| < 80 love. Arrow keys do the same, except while an input is focused. Empty deck offers Browse and "Swipe them again" (`clear-my-votes` for the current person only).

### Reducer actions

Screens call methods on `useStore()`. Those dispatch:

| Action | What it does |
| --- | --- |
| `vote` | Sets `votes[meId][recipeId]`. Does not touch the plan |
| `clear-my-votes` | Clears votes for `meId` only |
| `set-me` | Changes who holds the phone. Closes the sheet |
| `dismiss-tip` | Hides the swipe hint |
| `set-eating-out` | `status` home/out. Coming home refills meal and duties |
| `set-member` | Patches one person's flags, then meal + duties |
| `set-note` | Note only |
| `choose-recipe` | Sets the recipe, locks it, status home, refreshes duties |
| `another-recipe` | Fresh draw avoiding the current id, then locks |
| `unlock-meal` | Unlocks and draws fresh |
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

Deck for `meId`. The card names allergens, spicy, quick (25 minutes or under), the blurb, who else already said yes or love, hard blocks, and the first swap. The tip names the person holding the phone.

### Plan — `src/screens/Plan.jsx`

Hero for today, then a week. Offset runs from −2 to 3. Eating-out rows and empty rows drop the thumbnail (`no-photo`). Today gets a highlight. `eatingNote` and `dutyNote` are shared with the day screen.

### Day — `src/screens/Day.jsx`

At home / Eating out. Meal row links into cook mode. Another idea, Choose, unlock. Per person: In, Cook, Wash. Duties line plus Shuffle. Past days are labeled "already happened" and stay editable, which will rewrite history the rota later reads. Choose dinner is a sheet with search. With no query it hides blocked meals, because there are a hundred recipes. Search includes them.

### Recipes — `src/screens/Recipes.jsx`

Search matches title, blurb, and ingredient names. "Everyone can eat" uses `worksForEveryone` against the whole flat, not whoever is in tonight. Grouped by `CATEGORIES`. A recipe page can drop the meal onto one of the next 14 days, which locks it. Ingredients list optional items. Custom recipes have Delete.

### Cook — `src/screens/Cook.jsx`

Ingredients or one step at a time. Servings scale with `scaleQty`: quantities become quarters (¼ ½ ¾), and amounts of 40 or more snap to the nearest 5. Checks persist per recipe id. If `?d=` is set, blocks and swaps use that day's eaters; otherwise the whole flat. Requests a screen wake lock and ignores failure. Done on the last step returns to the plan, or to the recipe if there was no day.

### House — `src/screens/House.jsx`

Intro names the five people and their constraints. Diet toggle and allergen chips per person. Add someone. Export `dinder.json` / import. Reset asks for confirmation, then restores the demo. No duty bars.

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
- `prefers-reduced-motion` kills transitions.
- Logo component is `Logo` in `src/ui.jsx`. The same mark is `public/favicon.svg`. Use it anywhere the product name is shown. Do not set the word "Dinder" as plain text in the header.

`FoodArt` picks a plate, taco, bowl, stacked burger, rice bowl, salad, baking dish, or skillet from `recipe.category`, tinted with `recipe.color`. It has to read at a 54px thumbnail and on the swipe card.

## Images

`public/food/{id}.jpg` is served as `/food/{id}.jpg`. The original twenty were downloaded from Unsplash, then a few were replaced from Wikimedia Commons after the first downloads were the wrong dish. `carbonara-peas.jpg` is a copy of `carbonara.jpg` on purpose. `npm run images` re-fetches the Unsplash set and can undo those corrections. Do not run it unless you are ready to look at every photo again.

The eighty in `src/more-recipes.js` set `illustrated: true`. Adding a real photo means dropping that flag and saving `public/food/{id}.jpg`, or setting `image`.

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

## Progress

- 2026-10-06 — Rules, seed flat, and 20 photographed recipes.
- 2026-10-06 — Prototype running locally. Visual pass against phone screenshots.
- 2026-10-06 — Renamed to Dinder. Elias became Jonas, Sam joined. Variations dropped. Deck order fixed. Resuggest redraws the week. Fairness stays in the assigner and off the screen. Eighty more recipes.
- 2026-10-06 — This file expanded into a handoff: routes, saved shape, scores, and where to edit.

## Open questions

- Should a pass fade after a few months, or stay a veto until they swipe again?
- Is "excused days don't create debt" what this flat actually wants when someone travels for three weeks?
- How strong should the lean be when someone is well ahead on cooking? The current curve is the weight formula in `pickPerson`.
