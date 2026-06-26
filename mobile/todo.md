# Errors

- ~~Year on evolution page is overflowing out of the card (fix by adding some margin).~~ DONE

- ~~Share badge workflow is great but the link is wrong (there should be in a .env the domain and then be concatenated the correct path to the web version of the badge page link). [CRITICAL]~~ DONE

- ~~Share on LinkedIn button redirects to web when there is an application. It should always prioritize mobile application version first if existing. [HIGH]~~ DONE

- ~~Copy link on the badge page redirect the user to the softinsa official page instead of (our) web version of badges platform (there should be in a .env the domain and then be concatenated the correct path to the web version of the badge page link). [CRITICAL]~~ DONE

- ~~"Reenviar email" should not be an option on the confirmation screen after submiting an application.~~ DONE

- ~~Badge gallery DOES NOT WORK. It does not allow to either save the badges presentable OR see the gallery. It seems to call this URL: {"level":"debug","message":"Request completed","method":"PATCH","requestId":"1782489709285-yifgfchz","responseSize":251,"responseTimeMs":1.14,"statusCode":404,"timestamp":"2026-06-26T16:01:49.287Z","url":"/api/gamification/earned-badges/https://badges.softinsa.pt/verify/d12a0050-8cb7-5cf7-8676-6ee7adbd02ec/featured. Analyse why and fix it.[CRITICAL]~~ DONE

- Check email signature - seems not to be working as expected for mobile. Copy from web. [HIGH]

- Terms and conditions hold all policies (can be) but the title is in variable style. They are not being dynamically translated. [CRITICAL]

- Tranfer button on submitted evidence does not work. It just redirects to where the evidence is being submitted (supabase) and retrieves 400 code (because no authorization was provided). [CRITICAL]

# TODO

- Professional evolution timeline. [CRITICAL]

- Rewards shop.

- Implement rewards on badges detail page.


## Note: review all (not sure if implemented)