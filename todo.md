# Errors

- ~~Verify link on web is broken: it sends to a page that seems not to exist. [CRITICAL]~~ [DONE] — the Achievements "Verificar" button linked to `${API_URL}/public/badge/:link` (a non-existent web page / API stub); now points to the web `/verify/:link` page.

- ~~"Guardar no Perfil" button needs to be moved somewhere else or change styling.~~ [DONE] — removed from the Achievements cards; the public gallery is now curated on the profile page via card selection (coloured border + check).

- ~~progress in learning path should be clickable (click on lp to go to its structure page).~~ [DONE]

- ~~Calendar on set objective in badge detail page.~~ [DONE] — "Adicionar ao objetivo" now opens a modal with the DatePicker calendar (start/deadline/reminder).

- ~~Teams [CRITICAL]~~ [DONE] — sends a modern Adaptive Card via a Teams "Workflows" webhook (not the deprecated O365 connector); admin help text updated and non-OK responses now logged. Requires a Workflows webhook URL configured in Integrations.

- ~~It should be possible to click on the structures in badge detail and badge application status page. [HIGH]~~ [DONE] — badge detail area/level chips link to their structure pages; the application status page now links Learning Path / Service Line / Area / Level (API also returns the slugs).

- ~~Opening a notification gives a 404 NOT FOUND. This is because the link being used to send notifications is from the admin's application page. Therefore TM and SLL cannout see it. This needs to be changed according to the user profile in the backend.~~ [DONE]

- ~~Application status page user card should redirect to its profile.~~ [DONE]

- ~~Softinsa mock page is not being dynamically translated. It should be. Also, it has dark mode problems (navbar and some background such as on user profile picture background card).~~ [DONE]

# General checks

- ~~Analyse if the API has any problems regarding cache invalidation.~~ [DONE] — no problems found. Every cached key (admin users list, announcements, structure stats/counts, user profile) is invalidated on its mutations via `invalidateCacheByPrefix`/`redis.del`; languages/locations are static reference data (no mutation endpoint, 24h TTL) and translation results are immutable per text.
