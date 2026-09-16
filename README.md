# Matrix After Dark v7.1.7 — Mobile Audio & Centering Stability

This build fixes the Morpheus phone volume, ringtone timing, Blue Pill audio reliability, the phone LCD spelling, and complete mobile centering on the final page.

# The Matrix: After Dark — Final Rebuild

A GitHub Pages-ready interactive invitation.

## What changed in this rebuild

- The White Rabbit is now the approved cinematic rabbit artwork, shown beneath the opening text. It does not morph or run. Guests can click either the rabbit or the prompt beneath it.
- The Nokia stays on screen for the entire Morpheus phone clip.
- `ANSWER THE CALL` disappears immediately after the call is answered.
- Background music fades in near the end of the phone dialogue.
- The phone fades only after Morpheus finishes.
- Entry, red-pill, and blue-pill scenes are transparent so the Matrix-rain canvas is actually visible.
- The opening transition deliberately builds from a few streams into dense, full-screen green rain before the bloom and invitation.
- Red and blue paths build dense traditional rain gradually rather than flashing past it.
- Red rain changes smoothly to green before the welcome screen.
- Blue rain changes back to green before returning to the choice.
- The final character-scramble effect is preserved.
- The final screen includes the mission date and live countdown.
- Red-pill RSVP emails use the guest name from `?name=James` in both the subject and submission data.
- Audio and animation pause when the page is backgrounded.

## Add audio

Place these files in `assets/audio/`:

- `ringtone.mp3`
- `morpheus-call.mp3
phone-feed.mp3`
- `background-music.mp3`
- `morpheus-red-pill.mp3`
- `blue-pill.mp3` (optional)

## Edit event details

Open `config.js` and change:

- `displayDate`
- `eventDateISO`
- `displayTime`
- `venue`
- `dressCode`
- `briefing`
- character-gallery entries

## Personalised guest links

Use:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?name=James`

Names with spaces should be URL encoded, for example:

`?name=Sarah%20Connor`

## RSVP email

The current endpoint is configured for `steven.cuzzillo@gmail.com` through FormSubmit. The first live test may generate a one-time activation email that must be approved.

## Publish on GitHub Pages

1. Create a new public GitHub repository.
2. Upload the **contents** of this folder to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/root`.
6. Save and wait for the Pages link.

Test the complete flow on iPhone Safari, Android Chrome, and desktop Chrome before sending invitations.


## Version 7 visual update
- White Rabbit is now a transparent terminal icon, not a boxed scene.
- Matrix rain uses tighter spacing, more columns, variable stream lengths and longer trails.
- Final title resolves as small `WELCOME TO THE` above a hero-sized `MATRIX` title.


## Version 7.1 final polish

- The Nokia remains visible for the entire Morpheus call and fades only after the audio actually ends.
- Morpheus dialogue receives approximately +5.3 dB gain and light compression through Web Audio where supported; native full volume is the fallback.
- All Matrix rain motion is 20% slower while keeping the same density, trail lengths, and colour transitions.


## v7.1.1 audio trigger fix
- The White Rabbit action now starts only the ringtone.
- `morpheus-red-pill.mp3` can play only after the Red Pill is selected.
- `blue-pill.mp3` can play only after the Blue Pill is selected.
- Dialogue tracks are no longer briefly played during mobile audio unlocking.


## v7.1.2 polish
- Mission date and countdown section on the final screen are explicitly centered on desktop and mobile.


## v7.1.3 audio reliability fix

- The ringtone starts directly from the White Rabbit tap before any asynchronous setup can consume the mobile user gesture.
- The Blue Pill audio starts directly from the Blue Pill tap and retries once after an explicit reload if decoding was delayed.
- Removed muted audio priming, which can block later playback on some iPhone/Android browsers.
- Added `playsinline` to all audio elements.
- Required exact filenames remain `ringtone.mp3` and `blue-pill.mp3`.


## v7.1.5 polish
- Final mission date and countdown are force-centered on mobile.
- Background music now fades in from the first words of the Morpheus call.
- Morpheus dialogue receives stronger gain/compression so it remains clear above the score.


## v7.1.5 stability fix
- The phone scene is shown before ringtone playback begins, so mobile Safari cannot play the ringtone while leaving the phone hidden.
- The phone remains answerable even if ringtone playback is delayed or rejected.
- Added safe-area and dynamic viewport sizing for iPhone and Android phone screens.


## v7.1.7 Blue Pill polish

- Removed the visible “TOUCH TO HEAR THE TRANSMISSION” audio fallback.
- Blue Pill sequence now pauses before offering a second chance.
- Sequence text: “SIMULATION RESTORED… / YOU HAVE CHOSEN TO REMAIN WITHIN THE SIMULATION.” then, after a two-second pause, “IF YOU CHANGE YOUR MIND… / THE CONNECTION REMAINS AVAILABLE.”
- Only the Red Pill fades back in; selecting it runs the normal Red Pill RSVP and confirmation sequence.


## v7.1.9 LCD and reconnect prompt

- Corrected **MORPHEUS** is now baked directly into the phone LCD artwork; the tacked-on HTML overlay has been removed.
- After the Blue Pill second chance appears, the Red Pill now carries the two-line prompt **TAKE THE RED PILL / ACCEPT THE INVITATION**.


## Phone-feed bridge

`phone-feed.mp3` starts at the same moment as Morpheus and the background score. It is mixed quietly beneath the dialogue, remains audible briefly after the spoken clip ends, then fades before the green Matrix-rain transition. Adjust `volumes.phoneFeed`, `timing.phoneFeedTailMs`, and `timing.phoneFeedFadeMs` in `config.js`.
