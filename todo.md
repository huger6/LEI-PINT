# Errors

- ~~Title color on announcements page is wrong (black) for dark mode.~~ [DONE]

- ~~Softinsa mock page navbar is not being put to dark mode (keeps white).~~ [DONE]

- ~~When clicking a user profile, it should redirect to the in-app page first. Softinsa mock page user profile should only be shown when~~ [DONE]

- ~~SLA Breach notification sends the user to the settings page and not to the actual SLA he needs to verify.~~ [DONE]

- ~~It is not possible to open/extend a notification to see its contents.~~ [DONE]

- ~~WelcomeCard right columns (3 cards on the right) wrap and stick to the right of the welcomecard, while the left columns stick to the left. This creates a bad visual when shrinking the page.~~ [DONE]

- ~~Wrong API call: /api/announcements?page=1&limit=12:1.~~ [DONE - Verified: all 3 call sites pass clean numeric params; Axios serializes correctly; backend Zod validates properly. The `:1` was a copy-paste artifact.]

- ~~Check logs for UNIQUE constraints violations regarding sla breachs.~~ [DONE - SLA workers now use findOrCreate for breach alerts, so concurrent runs no longer hit the unique constraint / spam logs.]

- ~~Tooltip "Guardar badge" is still in light mode colors in dark mode.~~ [DONE]

- ~~Admin cards have text-decoration: underline in the dashboard.~~ [DONE]

- ~~Admin dashboard card in "Candidaturas por estado" section, "Submetido" text is very light compared to its background color.~~ [DONE]

- ~~Admin dashboard with Warning and SLA's box is getting out of bounds (they need to be 2/3 and 1/3, respectively). They should have a button saying "Manage" properly translated.~~ [DONE]

- ~~Search icon background on the search bar seems to have a different background color than the div containing the actual search text box (only on dark mode).~~ [DONE]

- ~~Admin still has public profile with cards like TM/SLL (Through "Editar perfil" on Settings) - should not be possible, or, at least, not possible to see those cards. The profile should not be visible to other users, not even admins.~~ [DONE]

- ~~Cards to structures should be clickable on badge detail page.~~ [DONE]

- ~~Service line cards on badge detail have underline (should not).~~ [DONE]

- ~~Manage structure tooltips are still white in dark mode.~~ [DONE]

- ~~Edit/delete buttons on manage users page for admin get stuck on top of each other when shrinking the page. They should not wrap. This applies to whenever this buttons exist inside a table (like RGPD configs)~~ [DONE]

- ~~Warnings/SLAS cards on admin dashboard stretch to the other's max height leaving a lot of space between the text and the button "Create Warning/SLA".~~ [DONE]

- ~~Tooltips on graphs in dark mode do not change the background color (to a dark color) - they should.~~ [DONE]

- ~~Badge name in "Badges por intervalo de datas" from stats page is black on a dark background (only in dark mode).~~ [DONE]

- ~~Manage SLAS for Admin text color is broken for dark mode (it is black/dark in a dark background color).~~ [DONE]

- ~~Text for requirements in edit badge page is black color in dark mode (fix).~~ [DONE]

- ~~Edit badge does not work [CRITICAL]~~ [DONE]

- ~~Channel on integration page is black in black background (dark mode problem).~~ [DONE]

- ~~Admin cards do not redirect to the correct substructures (it redirects to the generic /structure path).~~ [DONE]

- ~~Points and Ranking cards on application submission page have white background on dark mode (and black colors).~~ [DONE]

- ~~Badges expiring consultant and badge title have dark color in dark mode (reports/stats page for admin, and possibly this happens for TM/SLL too).~~ [DONE]

- ~~Approvals and Rejection statistics exports DO NOT WORK [CRITICAL].~~ [DONE]

- ~~Application Logs and PointsHistory exports to PDF work but omit some fields that do not fit the given space. This needs a fix, which should be: when a column ellipses (verify for all columns), it should wrap to the next line, but the text should maintain itself inside the width established for the column. The remaining lines should be "pushed" below in order not to overlap this text.~~ [DONE]

- ~~User profiles displayed as badge cards (change) and also they have underline on the softinsa mock page.~~ [DONE]

- ~~Softinsa mock page footer seems to have a different color in the left part (background). The links should also redirect to where the same page of the softinsa official page redirects.~~ [DONE]

- ~~Buttons on softinsa mock page have underline (shouldn't).~~ [DONE]

- ~~Bagde history is not working properly on My Team -> Consultant: when clicking a consultant with badges it doesn't show either any obtained badge or in progress badge, which is impossible since the consultant has 2 badges. Analyse why.~~ [DONE]

- ~~Application status page on dark mode has the following cards with white background: latest update, badge info, notes and feedback, transfer tooltips.~~ [DONE]

- ~~Light mode button on settings turns the background white/light for some reason.~~ [DONE - verified body background uses correct CSS variable]

- ~~Check if the user profile biography is beign ellipsed or wrapped to the line below.~~ [DONE - wraps naturally; added overflow-wrap: break-word to prevent overflow from long unbroken strings]

# TODO

- ~~Use actual images on the rewards to make it more attractive. (Needs to change DB and use either svg or img - if img is available always prefer it to the svg)~~ [DONE - added rewards.img_url; store prefers the image over the category icon (with icon fallback); demo rewards seeded with images.]

- ~~Admin should not be able to remove his account if he is the only administrator.~~ [DONE - deactivateUser refuses to deactivate the last active Administrator (self-deactivation was already blocked).]

- ~~Use the actual user title somewhere (in his profile, he should be able to configure it and display it publicly).~~ [DONE - consultants.active_title; the consultant picks a title they unlocked (Store) and it shows on the public profile. /me + public profile expose it.]

- ~~Consultant dashboard should exibit more stuff: some skills, some service lines, a proposed goal (to add) or one to continue if existing, rewards (as a carousel).~~ [DONE - added a continue/suggested-objective banner and a rewards spotlight carousel; service line/area already shown on the WelcomeCard.]

- ~~Policies on the footer should actually redirect to a policies page (exclusive to display the current policies).~~ [DONE - new read-only /policies page lists current Privacy/Terms/Cookies; footer links to it.]

- ~~Remove "Interesses" and "Add goal" from user profile and from the edit user profile for admin.~~ [DONE - removed from UserProfile and the admin edit drawer (display + edit + dead state/handlers).]

- ~~Badge gallery.~~ [DONE - editable public badge gallery already exists on the consultant profile.]

- ~~Auto translate user biography and whatever else is still missing/was not translated on purpose when it was implemented. Static translations should remain translatable statically (and be translated that way).~~ [DONE - biography now rendered via TranslatedText (auto-translated); static UI strings stay i18n-based.]

- ~~Ensure the test data script (and ALSO the DB) does not allow applications to be submitted without a certain file and that the file URL is actually some random file from either google drive or supabase (for test purposes).~~ [DONE - submit endpoint already requires evidence for every requirement; generator now gives submitted+ apps full evidence; evidence/cert URLs point to a real sample file; live DB backfilled 44 missing evidence rows + real URLs.]

# Generic things worth looking

- ~~Most tooltips have a white background and white text on dark mode. Analyse all tooltips and check if they are being properly displayed on both color schemes.~~ [DONE]