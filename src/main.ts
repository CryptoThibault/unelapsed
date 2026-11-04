import './style.css';
import { inventoryIcon } from './icons';
import { formatTime, formatReserve } from './timer';
import { createGameNotifications } from './notifications';
import { act, advance, GAME_KEY, PREVIOUS_GAME_KEYS, HOUR, FOOD_DISPENSER_COST, SUPPLY_COST_MS, FOOD_INTERVAL, ENERGY_MAX, TRAINING_ENERGY_PER_MINUTE, HOUSED_SLEEP_DURATION, energyLevel, workEnergyPerMinute, energyUsePerMinute, energyRecoveryPerMinute, RENT_COST, HOME_COST, RENT_DURATION, TRAINING_DURATION, CAREERS, careerEligible, shopOwned, workReward, profession, pendingWage, timeUntilSleep, sleepDuration, migrateGame, newGame, parseGame, unavailable, type Action, type Game } from './game';

import { CLOCK_KEY, SPEEDS, clockNow, newClock, parseClock, setSpeed, type GameClock, type Speed } from './clock';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app container.');
let storageAvailable = true;
function loadClock(): GameClock {
  try {
    const saved = parseClock(localStorage.getItem(CLOCK_KEY));
    if (saved) return saved;
    const fresh = newClock();
    localStorage.setItem(CLOCK_KEY, JSON.stringify(fresh));
    return fresh;
  } catch { storageAvailable = false; return newClock(); }
}
let simulationClock = loadClock();
const gameNow = () => clockNow(simulationClock);
function read(): Game | null {
  try { return parseGame(localStorage.getItem(GAME_KEY)); }
  catch { storageAvailable = false; return null; }
}
function save(g: Game): void {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(g)); }
  catch { storageAvailable = false; }
}
function initial(): Game {
  const saved = read();
  if (saved) return advance(saved, gameNow());
  try {
    for (const key of PREVIOUS_GAME_KEYS) { const migrated = migrateGame(localStorage.getItem(key), gameNow()); if (migrated) return migrated; }
    return newGame(gameNow());
  }
  catch { storageAvailable = false; return newGame(gameNow()); }
}
let game = initial();
save(game);
app.innerHTML = `
<div class="game">
  <header class="header"><a class="wordmark" href="/" aria-label="Home">UNELAPSED<span class="wordmark-dot"></span></a><div class="header-tools"><button class="theme-toggle" type="button" aria-label="Switch to light mode" title="Switch to light mode"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/></svg></button><button class="test-restart" type="button">Restart <span>DEV</span></button><button class="test-add-hour" type="button">+1h <span>DEV</span></button></div></header>
  <section class="stage" aria-labelledby="state-title">
      <div class="speed-bar" role="group" aria-label="Simulation speed">
        <span class="speed-label">Test speed <small>DEV</small></span>
        <div class="speed-options">${SPEEDS.map(speed => `<button type="button" data-speed="${speed}" aria-pressed="false">×${speed}</button>`).join('')}</div>
      </div>
      <section id="profile-panel" class="profile-summary" aria-labelledby="profile-title">
        <h2 id="profile-title">Alex Morgan</h2>
        <div class="work-status"><span>Work</span><span id="profession-value"></span></div>
        <div class="housing-status"><span>Status</span><span id="housing-value"></span></div>
        <p id="rent-detail" hidden></p>
        <div class="housing-status"><span>Total time</span><span id="elapsed-time"></span></div>
        <section class="profile-card food-profile" aria-label="Food status">
          <div class="profile-row"><span class="food-label">Food</span><strong id="profile-food-value"></strong></div>
          <div class="meal-schedule"><span>Next meal</span><span id="profile-next-meal"></span></div>
        </section>
        <section class="profile-card energy-profile" aria-label="Energy status, rates per timer minute">
          <div class="energy-status"><span>Energy <strong id="energy-value"></strong></span><span id="energy-detail"></span></div>
          <div class="meal-schedule energy-countdown"><span>Exhausted in</span><span id="energy-countdown-value"></span></div>
        </section>
      </section>
    <div class="status"><span class="status-dot"></span><span id="state-title">Time left</span></div>
    <div class="clock" role="timer" aria-label="Time remaining" aria-live="off"></div>
    <div class="play">
      <section class="current-task" aria-label="Current task" hidden>
        <div class="task-heading"><span class="task-label">In progress</span><span class="task-remaining"></span></div>
        <div class="task-name"></div><div class="task-outcome"></div>
        <progress class="task-progress" aria-label="Task progress" max="100" value="0"></progress>
        <button class="cancel-task" type="button" data-action="cancel" aria-label="Stop work · Collect pay" title="Stop work · Collect pay"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
      </section>
      <div class="tabs" role="tablist" aria-label="Game sections">
        <button id="actions-tab" role="tab" aria-selected="true" aria-controls="actions-panel" tabindex="0">Action</button>
        <button id="inventory-tab" role="tab" aria-selected="false" aria-controls="inventory-panel" tabindex="-1">Inventory</button>
        <button id="shop-tab" role="tab" aria-selected="false" aria-controls="shop-panel" tabindex="-1">Shop</button>
        <button id="recruitment-tab" role="tab" aria-selected="false" aria-controls="recruitment-panel" tabindex="-1">Recruitment</button>
      </div>
      <div id="actions-panel" class="actions" role="tabpanel" aria-labelledby="actions-tab">
        <button data-action="work"><span class="action-top"><strong id="work-label">Work</strong><span id="wage"></span></span><span class="action-detail" id="work-detail"></span></button>
        <div class="training-control">
          <label for="training-select">Training</label>
          <select id="training-select"><option value="">No training owned</option></select>
          <button data-action="train-1" id="training-action"><span class="action-top"><strong id="training-label">Training</strong><span id="training-state"></span></span><span class="action-detail" id="training-detail"></span></button>
        </div>
        <button data-action="sleep"><span class="action-top"><strong>Sleep</strong><span id="sleep-duration"></span></span><span class="action-detail" id="sleep-detail"></span></button>
      </div>
      <div id="shop-panel" class="actions" role="tabpanel" aria-labelledby="shop-tab" hidden>
        <div class="food-purchase">
          <div class="food-quantity-row"><label for="food-quantity">Quantity</label><input id="food-quantity" type="number" min="1" step="1" value="1" required><span>${SUPPLY_COST_MS / 60_000} min / meal</span></div>
          <button data-action="eat"><span class="action-top"><strong>Buy food</strong><span class="supply-price"></span></span><span class="action-detail" id="eat-detail"></span></button>
        </div>
        <button data-action="food-dispenser"><span class="action-top"><strong>Food dispenser</strong><span>−${formatPrice(FOOD_DISPENSER_COST)}</span></span><span class="action-detail">Auto-buy meals when empty · 2 min / meal</span></button>
        <button data-action="rent"><span class="action-top"><strong>Rent home</strong><span id="rent-price"></span></span><span class="action-detail">${RENT_DURATION / HOUR} hours · Energy +${formatEnergyRate(ENERGY_MAX * 60_000 / HOUSED_SLEEP_DURATION)} / min</span></button>
        <button data-action="home"><span class="action-top"><strong>Buy home</strong><span id="home-price"></span></span><span class="action-detail">Own permanently · Energy +${formatEnergyRate(ENERGY_MAX * 60_000 / HOUSED_SLEEP_DURATION)} / min</span></button>
        ${CAREERS.slice(1).map((career, i) => `<button data-action="course-${i+1}"><span class="action-top"><strong>Training · ${career.course}</strong><span id="course-price-${i+1}"></span></span><span class="action-detail">30 min study · ${career.name}</span></button>`).join('')}
        ${CAREERS.slice(1).map((career, i) => `<button data-action="equipment-${i+1}"><span class="action-top"><strong>${career.equipment}</strong><span id="equipment-price-${i+1}"></span></span><span class="action-detail">${career.name} · Training also required</span></button>`).join('')}
      </div>
      <div id="recruitment-panel" class="recruitment-list" role="tabpanel" aria-labelledby="recruitment-tab" hidden>
        ${CAREERS.map((career, level) => `<section class="career-card" id="career-${level}">
          <div class="action-top"><strong>${career.name}</strong><span>+${formatPrice(career.reward)} / min</span></div>
          <div class="career-requirement" title="Energy consumed per timer minute while working, including passive use">−${formatEnergyRate(workEnergyPerMinute(level))} energy / min</div>
          ${level ? `<div class="career-requirement" id="certification-${level}"></div><div class="career-requirement" id="required-equipment-${level}"></div>` : '<div class="career-requirement">No requirements</div>'}
          <button type="button" data-action="recruit-${level}" id="recruit-${level}">Choose job</button>
        </section>`).join('')}
      </div>
      <div id="inventory-panel" role="tabpanel" aria-labelledby="inventory-tab" hidden>
      <section class="inventory" aria-label="Inventory">
        <div id="inventory-food" class="inventory-row"><span class="inventory-item food-label">${inventoryIcon('food')}Food</span><span id="food-value"></span></div>
        <div id="inventory-food-dispenser" class="inventory-row" hidden><span class="inventory-item">${inventoryIcon('dispenser')}Food dispenser</span><span>Owned</span></div>
        <div id="inventory-home" class="inventory-row"><span class="inventory-item">${inventoryIcon('home')}Home</span><span id="home-value"></span></div>
        ${CAREERS.slice(1).map((career, i) => `<div id="inventory-equipment-${i+1}" class="inventory-row" hidden><span class="inventory-item">${inventoryIcon(i === 0 ? 'helmet' : i === 1 ? 'tools' : 'outfit')}${career.equipment}</span><span>Owned</span></div>`).join('')}
        ${CAREERS.slice(1).map((career, i) => `<div id="inventory-course-${i+1}" class="inventory-row" hidden><span class="inventory-item">${inventoryIcon('certificate')}Training · ${career.course}</span><span id="inventory-course-state-${i+1}">Owned</span></div>`).join('')}
        <p id="inventory-empty" hidden>Empty</p>
      </section>
      </div>

    </div>
    <div class="end-details" hidden><p class="result-label">You survived</p><p class="result-value"></p><button class="restart" type="button">Restart <span aria-hidden="true">↗</span></button></div>
    <p class="storage-warning" hidden>Saving unavailable. Progress will be lost when you leave.</p>
    <p class="announcement" role="status" aria-live="polite"></p>
  </section>
  <div class="time-notifications" role="log" aria-live="polite" aria-relevant="additions" aria-label="Game notifications"></div>
</div>`;
function el<T extends HTMLElement = HTMLElement>(selector: string): T {
  const found = app!.querySelector<T>(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}
const tabs = [el<HTMLButtonElement>('#actions-tab'), el<HTMLButtonElement>('#inventory-tab'), el<HTMLButtonElement>('#shop-tab'), el<HTMLButtonElement>('#recruitment-tab')];
function selectTab(index: number): void {
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    el(`#${tab.getAttribute('aria-controls')}`).hidden = i !== index;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(i));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(next);
    tabs[next]!.focus();
  });
});
const themeButton = el<HTMLButtonElement>('.theme-toggle');
function updateThemeButton(): void {
  const label = document.documentElement.dataset.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
}
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('unelapsed.theme', theme); } catch { /* Theme still works without storage. */ }
  updateThemeButton();
});
window.addEventListener('storage', event => {
  if (event.key === 'unelapsed.theme') {
    document.documentElement.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
    updateThemeButton();
  }
});
updateThemeButton();
function formatEnergyRate(perMinute: number): string { return String(Number(perMinute.toFixed(2))); }
function formatPrice(ms: number): string { return ms >= 24 * HOUR ? `${ms / (24 * HOUR)}d` : ms >= HOUR ? `${ms / HOUR}h` : `${ms / 60_000} min`; }
let selectedTraining: number | null = null;
const trainingSelect = el<HTMLSelectElement>('#training-select');
trainingSelect.addEventListener('change', () => { selectedTraining = trainingSelect.value ? Number(trainingSelect.value) : null; render(); });
const foodQuantityInput = el<HTMLInputElement>('#food-quantity');
foodQuantityInput.addEventListener('input', render);
const notifications = createGameNotifications(el('.time-notifications'));
const clock = el('.clock');
const buttons = [...app.querySelectorAll<HTMLButtonElement>('[data-action]')];
let lastFinished = false;
function render(): void {
  const previousJob = game.job;
  const previousDeath = game.diedAt;
  let hasNotifications = false;
  game = advance(game, gameNow(), change => { hasNotifications = true; notifications.show(change); });
  if (hasNotifications || previousJob?.kind !== game.job?.kind || (previousJob && previousJob.kind !== 'work' ? previousJob.endsAt : null) !== (game.job && game.job.kind !== 'work' ? game.job.endsAt : null) || previousDeath !== game.diedAt) save(game);
  const dead = game.diedAt !== null;
  el<HTMLButtonElement>('.test-add-hour').disabled = dead;
  const formatted = formatReserve(game.time).replace('d ', ':');
  clock.classList.toggle('long-reserve', game.time >= 86_400_000);
  clock.textContent = formatted;
  document.title = dead ? 'Game over · UNELAPSED' : `${formatted} · UNELAPSED`;
  document.body.classList.toggle('urgent', !dead && game.time < 5 * 60_000);
  document.body.classList.toggle('finished', dead);
  el('#state-title').textContent = dead ? 'Game over' : 'Time left';
  el('.play').hidden = dead;
  el('.end-details').hidden = !dead;
  el('.result-value').textContent = formatTime((game.diedAt ?? game.updatedAt) - game.startedAt);
  el('#profession-value').textContent = profession(game);
  el('#elapsed-time').textContent = formatReserve((game.diedAt ?? game.updatedAt) - game.startedAt).replace('d ', ':');
  app!.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button => { button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === simulationClock.speed)); });
  CAREERS.forEach((career, level) => {
    const eligible = careerEligible(game, level);
    el(`#career-${level}`).classList.toggle('selected', game.careerLevel === level);
    el(`#recruit-${level}`).textContent = game.careerLevel === level ? 'Current job' : eligible ? 'Choose job' : 'Requirements missing';
    if (level) {
      const qualified = game.qualifications.includes(level);
      const equipped = game.equipment.includes(level);
      el(`#certification-${level}`).textContent = `${qualified ? '✓' : '○'} Certification · ${career.course}`;
      el(`#required-equipment-${level}`).textContent = `${equipped ? '✓' : '○'} Equipment · ${career.equipment}`;
      el(`#certification-${level}`).classList.toggle('met', qualified);
      el(`#required-equipment-${level}`).classList.toggle('met', equipped);
    }
  });
  const course = game.job?.kind === 'training' ? CAREERS[game.job.trainingLevel!] : null;
  CAREERS.slice(1).forEach((career, i) => {
    const level = i + 1;
    const qualified = game.qualifications.includes(level);
    const owned = game.equipment.includes(level);
    const courseOwned = game.courses.includes(level);
    el(`#course-price-${level}`).textContent = courseOwned ? 'Owned' : `−${formatPrice(career.cost)}`;
    el(`#inventory-course-${level}`).hidden = !courseOwned;
    el(`#inventory-course-state-${level}`).textContent = qualified ? 'Qualified' : 'Owned';
    el(`#equipment-price-${level}`).textContent = owned ? 'Owned' : `−${formatPrice(career.equipmentCost)}`;
    el(`#inventory-equipment-${level}`).hidden = !owned;
  });
  const selectable = game.courses.filter(level => !game.qualifications.includes(level)).sort((a,b) => a-b);
  if (selectedTraining === null || !selectable.includes(selectedTraining)) selectedTraining = game.job?.kind === 'training' && selectable.includes(game.job.trainingLevel!) ? game.job.trainingLevel! : selectable[0] ?? null;
  const optionsKey = selectable.join(',');
  if (trainingSelect.dataset.options !== optionsKey) {
    trainingSelect.innerHTML = selectable.length ? selectable.map(level => `<option value="${level}">${CAREERS[level]!.course}</option>`).join('') : '<option value="">No training available</option>';
    trainingSelect.dataset.options = optionsKey;
  }
  trainingSelect.value = selectedTraining === null ? '' : String(selectedTraining);
  trainingSelect.disabled = selectable.length === 0;
  const selectedCourse = selectedTraining === null ? null : CAREERS[selectedTraining]!;
  const progress = selectedTraining === null ? null : game.trainingProgress[selectedTraining];
  const trainingAction = el<HTMLButtonElement>('#training-action');
  trainingAction.dataset.action = `train-${selectedTraining ?? 1}`;
  trainingAction.hidden = !selectedCourse;
  el('#training-label').textContent = 'Training';
  el('#training-state').textContent = progress ? 'Resume' : `${TRAINING_DURATION / 60_000} min`;
  el('#training-detail').textContent = selectedCourse ? `${progress ? `${formatTime(progress.remaining).slice(3)} left · ` : ''}−${formatEnergyRate(TRAINING_ENERGY_PER_MINUTE)} energy / min · ${selectedCourse.name} · ${game.equipment.includes(selectedTraining!) ? 'Equipment owned' : `Requires ${selectedCourse.equipment}`}` : '';
  el('#home-value').textContent = game.housing === 'housed' ? 'Owned' : 'None';
  const housingStatus = game.housing === 'housed' ? 'Homeowner' : game.rentUntil > game.updatedAt ? 'Renting' : 'Homeless';
  el('#housing-value').textContent = housingStatus;
  el('#housing-value').classList.toggle('sheltered', housingStatus !== 'Homeless');
  el('#rent-price').textContent = `−${formatPrice(RENT_COST)}`;
  el('#rent-detail').hidden = game.housing === 'housed' || game.rentUntil <= game.updatedAt;
  el('#rent-detail').textContent = `Rental left · ${formatTime(game.rentUntil - game.updatedAt)}`;
  el('#home-price').textContent = game.housing === 'housed' ? 'Owned' : `−${formatPrice(HOME_COST)}`;
  el('#food-value').textContent = `${game.food} units`;
  el('#profile-food-value').textContent = `${game.food} units`;
  el('#profile-next-meal').textContent = formatTime(game.nextFoodAt - game.updatedAt);
  el('#inventory-food').hidden = game.food <= 0;
  el('#inventory-food-dispenser').hidden = !game.autoFood;
  el('#inventory-home').hidden = game.housing !== 'housed';
  el('#inventory-empty').hidden = game.autoFood || game.food > 0 || game.housing === 'housed' || game.equipment.length > 0 || game.courses.length > 0;
  el('#energy-value').textContent = `${Number(energyLevel(game).toFixed(1))} / ${ENERGY_MAX}`;
  const sleeping = game.job?.kind === 'sleep';
  el('#energy-detail').textContent = sleeping ? `+${formatEnergyRate(energyRecoveryPerMinute(game))} energy / min` : `−${formatEnergyRate(energyUsePerMinute(game))} energy / min`;
  el('.energy-status').classList.toggle('tired', energyLevel(game) < 50);
  el('.energy-countdown').hidden = sleeping || dead;
  el('#energy-countdown-value').textContent = formatTime(timeUntilSleep(game)).slice(3);
  el('#wage').textContent = `+${formatPrice(game.job?.kind === 'work' ? game.job.reward : workReward(game))} / min`;
  el('#work-detail').textContent = `−${formatEnergyRate(workEnergyPerMinute(game.careerLevel))} energy / min · Paid when you stop`;
  const foodQuantity = foodQuantityInput.valueAsNumber;
  const validQuantity = Number.isSafeInteger(foodQuantity) && foodQuantity > 0 && Number.isSafeInteger(foodQuantity * SUPPLY_COST_MS) && Number.isSafeInteger(foodQuantity + game.food);
  foodQuantityInput.setAttribute('aria-invalid', String(!validQuantity));
  el('#eat-detail').textContent = validQuantity ? `+${foodQuantity} ${foodQuantity === 1 ? 'meal' : 'meals'} · ${foodQuantity * FOOD_INTERVAL / 60_000} min supply` : 'Choose a whole number of meals';
  el('.supply-price').textContent = validQuantity ? `−${formatReserve(foodQuantity * SUPPLY_COST_MS)}` : '—';
  el('#sleep-duration').textContent = formatTime(sleepDuration(game)).slice(3);
  el('#sleep-detail').textContent = `${game.housing === 'housed' ? 'Home' : game.rentUntil > game.updatedAt ? 'Rented home' : 'Outdoors'} · +${formatEnergyRate(energyRecoveryPerMinute(game))} energy / min · Stop anytime`;
  const cancelLabel = game.job?.kind === 'sleep' ? 'Wake up' : game.job?.kind === 'training' ? 'Pause training' : 'Stop work · Collect pay';
  el('.cancel-task').setAttribute('aria-label', cancelLabel);
  el('.cancel-task').title = cancelLabel;
  el('.cancel-task').dataset.action = game.job?.kind === 'training' ? 'pause-training' : game.job?.kind === 'sleep' ? 'wake' : 'cancel-work';
  el('.current-task').hidden = dead || !game.job;
  if (game.job) {
    const working = game.job.kind === 'work';
    el('.task-name').textContent = game.job.kind === 'sleep' ? 'Sleeping' : game.job.kind === 'training' ? `Training · ${course?.course ?? ''}` : 'Working';
    el('.current-task').classList.toggle('training', !working);
    el('.task-remaining').textContent = game.job.kind === 'work' ? formatTime(game.job.workedMs) : formatTime(game.job.endsAt - game.updatedAt);
    el('.task-outcome').textContent = game.job.kind === 'sleep' ? `On waking · ${game.job.resumeTask === 'work' ? 'Resume work' : typeof game.job.resumeTask === 'number' ? `Resume training · ${CAREERS[game.job.resumeTask]!.course}` : 'Energy 100 / 100'}` : game.job.kind === 'training' ? `On completion · ${course?.course ?? ''} certification` : `Pending pay · +${formatReserve(pendingWage(game))}`;
    const progressBar = el<HTMLProgressElement>('.task-progress');
    progressBar.hidden = working;
    if (game.job.kind !== 'work') progressBar.value = Math.min(100, Math.max(0, (1 - (game.job.endsAt - game.updatedAt) / game.job.duration) * 100));
  }

  for (const button of buttons) {
    const action = button.dataset.action as Action;
    if (button.closest('#shop-panel')) button.hidden = shopOwned(game, action) || action === 'rent' && game.housing === 'housed';
    const reason = unavailable(game, action, foodQuantity);
    button.disabled = reason !== null;
    button.title = reason ?? '';
  }
  el('.storage-warning').hidden = storageAvailable;
  if (dead !== lastFinished) el('.announcement').textContent = dead ? 'Time is up. Game over.' : '';
  lastFinished = dead;
}
async function dispatch(action: Action | 'restart' | 'add-hour', foodQuantity = 1): Promise<void> {
  const update = () => {
    simulationClock = loadClock();
    game = read() ?? game;
    const previous = advance(game, gameNow(), notifications.show);
    if (action === 'restart') {
      notifications.clear();
      game = newGame(gameNow());
    } else if (action === 'add-hour') {
      game = previous;
      if (game.diedAt === null) {
        game.time += HOUR;
        notifications.show({ amount: HOUR, reason: 'Dev bonus', at: game.updatedAt });
      }
    } else {
      game = act(previous, action, gameNow(), notifications.show, foodQuantity);
    }
    save(game);
    render();
  };
  // Serialize purchases across tabs, always reading the latest saved balance.
  if (navigator.locks) await navigator.locks.request(GAME_KEY, update);
  else update();
}
buttons.forEach(button => button.addEventListener('click', () => { const action = button.dataset.action as Action; void dispatch(action, action === 'eat' ? foodQuantityInput.valueAsNumber : 1); }));
el('.restart').addEventListener('click', () => { void dispatch('restart'); });
el('.test-restart').addEventListener('click', () => { void dispatch('restart'); });
el('.test-add-hour').addEventListener('click', () => { void dispatch('add-hour'); });
window.addEventListener('storage', event => {
  if (event.key === CLOCK_KEY) { simulationClock = loadClock(); game = read() ?? game; render(); }
  if (event.key === GAME_KEY) { const updated = parseGame(event.newValue); if (updated) { game = updated; render(); } }
});
document.addEventListener('visibilitychange', () => { simulationClock = loadClock(); const updated = read(); if (updated) game = updated; render(); });
window.addEventListener('pageshow', render);
app.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(button => {
  button.addEventListener('click', () => {
    const speed = Number(button.dataset.speed) as Speed;
    const update = () => {
      simulationClock = loadClock();
      game = advance(read() ?? game, gameNow(), notifications.show);
      save(game);
      simulationClock = setSpeed(simulationClock, speed);
      try { localStorage.setItem(CLOCK_KEY, JSON.stringify(simulationClock)); } catch { storageAvailable = false; }
      render();
    };
    if (navigator.locks) void navigator.locks.request(GAME_KEY, update);
    else update();
  });
});
render();
window.setInterval(render, 100);
