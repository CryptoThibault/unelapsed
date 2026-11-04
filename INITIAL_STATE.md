# UNELAPSED — Current rules

## Starting state and interface

- Start with one hour of life and no reserve cap; zero ends the run. The timer turns red below five minutes. Above 24 hours, it displays days:hours:minutes:seconds without unit labels.
- Start with no food, 100 Energy, Homeless status and the Warehouse worker job.
- Temporary character name: Alex Morgan. A single card above the timer contains the name, a Work row with the current job, a Status row, Total time since the start, and separate Food and Energy panels. Total time follows the game clock, including offline time and speed changes, and stops at death.
- Tabs: Action / Inventory / Shop / Recruitment. Inventory shows only owned items, without timers; the next meal appears in the profile. The missed-meal penalty is not currently displayed.
- English interface, little text, and persistent dark/light themes.
- Bottom notifications show gains in green and spending or penalties in red, with an amount and reason. They disappear after 4.5 real seconds and can be dismissed; at most four are visible. Natural countdown and pending wages are silent. Simultaneous gains and losses appear separately. Completing a course shows a green Training complete notification naming the certification.

## Jobs and training

Work is continuous, with no fixed duration or progress bar. Wages accrue proportionally to time worked and remain pending until the session ends. The cross stops work and collects pay; exhaustion also ends and pays the session before starting Sleep. There are no intermediate payments. The Working panel shows elapsed time and pending pay.

| Job | Pay per minute worked | Required course | Course price | Active training duration |
| --- | --- | --- | --- | --- |
| Warehouse worker | 3 min | Available at the start | — | — |
| Machine operator | 4 min | Machine operation | 10 min | 30 min |
| Maintenance technician | 6 min | Technical maintenance | 1 h | 30 min |
| Production supervisor | 8 min | Production management | 4 h | 30 min |

- No courses are owned initially. All three are available in the Shop without job prerequisites, allowing players to skip steps. Each course can be purchased once.
- A single Training action lets players select purchased, unfinished courses. Owned courses also appear in Inventory, marked Qualified when completed.
- Recruitment lists all four jobs, their income and energy cost per minute, and their certification and equipment requirements. It does not display From full rest. Players explicitly choose their job; buying or completing a course never changes it automatically. The starting job remains available without prerequisites. Switching jobs is free and blocked during Work.
- Safety gear costs 10 minutes for Machine operator. Tool kit costs one hour for Maintenance technician. Professional outfit costs four hours for Production supervisor. Prices are provisional.
- Owned unique purchases (courses, equipment and a home) disappear from the Shop and return after Restart. Food and Rent home remain repeatable; renting is hidden when a home is owned. Equipment does not wear out and appears in Inventory only when owned. It can be bought before or after training, including during a task; an ongoing work session retains its original pay rate.
- Payment occurs only when buying a course in the Shop; starting or resuming study costs nothing extra. The training panel's cross pauses study and preserves progress. Clicking the same Training action, marked Resume, continues the remaining duration without another charge, including after reloading or being away.
- Each course keeps its own paid progress. While one is paused, players can work, sleep or study another course. Paused training makes no progress.
- At zero energy, active training keeps its progress during sleep and automatically resumes on waking without another charge.
- The cross pauses active training. During Work, it ends the session and pays the accrued wages.
- Only one task can be active. Action queues and routines are unavailable initially. Purchases remain possible during tasks.

## Food

- Buy food costs two minutes per meal. Players select a positive whole quantity in the Shop (one by default); total cost and coverage update before purchase. Stocks accumulate, and one meal is consumed every fifteen minutes. Purchases must leave a strictly positive balance.
- If no meal is available when due, immediately deduct thirty minutes. There is no countdown multiplier.
- Buying food or reloading does not postpone the next meal. Consumption continues during tasks, sleep and absences.

Food dispenser is a unique item costing three timer days, active immediately after purchase and visible in Inventory. It disappears from the Shop when owned. Whenever a meal is due with no stock, it buys and consumes one meal for two minutes, including during sleep and absences. Existing stock is used first. If payment would not leave a positive time balance, the missed-meal penalty applies. Restart removes the item.

## Energy and sleep

- Energy has a maximum of 100 points, displayed out of 100 without a % symbol. Saves retain their current energy. The selected rates are used exactly in calculations and displayed per timer minute.
- Passive consumption is 2.5 energy/min: 40 timer minutes (16 character hours) to spend 100 points.
- Total consumption during Work, including passive use: Warehouse worker 2.9, Machine operator 2.8, Maintenance technician 2.7, Production supervisor 2.6 energy/min. Passive use is not added again.
- Training consumes exactly 2.8 energy/min, including passive use. A 30-minute course therefore costs 84 points and leaves 16 if started at 100.
- Housing affects only recovery during Sleep. Display recovery per timer minute: +4 energy/min without housing, +5 energy/min with a rental or owned home.
- The profile shows Energy out of 100 and the current consumption or recovery per timer minute, without a Sleep recovery row. The Sleep action shows the time needed to reach 100 energy. Work, Training, Sleep and Recruitment directly state their energy costs or gains per timer minute; From full rest is not shown. The profile's Exhausted in countdown uses current energy and activity consumption and is hidden during Sleep and after death.
- At zero energy, automatically sleep, then resume Work or Training if exhaustion interrupted it. Sleep also allows voluntary rest when no task is active, with no task scheduled to resume.
- Character time scale: one timer hour equals one character day.
- Recovery is continuous: 0 to 100 takes 25 minutes without housing, or 20 minutes with a rental or owned home (eight character hours). Duration is proportional to missing energy and ends at 100. Sleep shows the time needed to reach 100, updated for energy and housing; at 100 it shows 00:00.
- Wake up preserves recovered energy and cancels planned automatic resumption; training remains available as paused progress. Life countdown and meals continue.
- Work ended by exhaustion pays accrued wages once before sleep. At 100 energy, a new Work session starts automatically. The previous session's wages are not paid again. Resumption persists through reloads and absences.
- Rates follow the game clock: at ×1, one timer hour is one real hour; test speeds accelerate all mechanics together.

## Housing

- Rent home costs four hours for 24 hours of rental. Renewals extend the remaining duration. Full recovery takes 20 minutes while rented, instead of 25; expiry changes recovery even during sleep and offline.
- Buy home costs twelve timer days, as a unique purchase. Full recovery takes 20 minutes without recurring payments. Renting or buying another home is then disabled.
- Status shows Homeless / Renting / Homeowner. Remaining rental time appears in the profile, never in Inventory.
- Buying a home or rental during sleep immediately recalculates its remaining duration without losing recovered energy.

## Time, saves and testing

- Calculations use timestamps; offline events are processed chronologically. Death takes priority over simultaneous wages or qualifications.
- Purchases must leave a strictly positive balance. Work retains the pay rate set at session start. Pending wages cannot prevent death before a session ends: zero ends the run before payment.
- Restart restores the initial state, including jobs and training.
- Older saves retain their job, active or paused training, and time balance. Equipment matching previously acquired jobs is granted to preserve progress. Previously purchased courses remain owned; their completion percentage is preserved when converting to 30-minute durations. The migration to integer energy rates preserves the current energy percentage without changing life reserves. Old fixed work sessions become continuous sessions with elapsed work and the job's current rate.
- Test speed DEV bar above the profile: ×1 / ×2 / ×4 / ×8 / ×16 / ×32 / ×64 / ×128 / ×256 / ×512. A shared clock accelerates life, tasks, energy, sleep, meals and rentals without changing prices or pay rates.
- Speed persists after reload, while offline and after Restart, and is synchronized between tabs. Changing speed never recalculates the past.
- At ×8, 7.5 real seconds count as one minute worked; a course takes 225 seconds of active study excluding sleep. The speed bar is temporary.
- DEV Restart and +1h buttons are available for testing.

## Character time conversions

One timer hour equals a 24-hour character day. One timer minute equals 24 character minutes.

| Activity | Displayed energy / timer minute | Duration for 100 points (timer) | Character equivalent |
| --- | ---: | --- | --- |
| Passive | −2.5 | 40 min | 16 h |
| Warehouse worker | −2.9 | ≈ 34 min 29 s | ≈ 13 h 48 min |
| Machine operator | −2.8 | ≈ 35 min 43 s | ≈ 14 h 17 min |
| Maintenance technician | −2.7 | ≈ 37 min 02 s | ≈ 14 h 49 min |
| Production supervisor | −2.6 | ≈ 38 min 28 s | ≈ 15 h 23 min |
| Training | −2.8 | ≈ 35 min 43 s | ≈ 14 h 17 min |
| Sleep without housing | +4 | 25 min | 10 h |
| Sleep with housing | +5 | 20 min | 8 h |

Energy rates are exact; conversion durations in the table are rounded. Thirty active training minutes represent twelve character hours and cost 84 energy, so training completes without a break when started at 100. One meal every fifteen timer minutes equals one every six character hours, or four per character day.
