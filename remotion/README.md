# FitFlow promo

A 30-second English product film for `/landing`: 1920 × 1080, 30 fps,
H.264 / AAC in MP4. The message is entirely on screen, with an original
electronic soundtrack and optional English captions. No voice-over is needed.

## Preview and export

```sh
npm install
npm run video:studio
npm run video:render
npm run video:poster
```

Studio opens the editable `FitFlowPromo` composition. The first render downloads
Remotion's Chrome Headless Shell automatically. All `remotion` packages are pinned
to the same version and are development dependencies; the landing serves a regular
HTML video and does not ship the Remotion runtime.

Outputs, ready to embed or copy to another website:

- `public/videos/fitflow-promo.mp4`
- `public/videos/fitflow-promo-poster.jpg`
- `public/videos/fitflow-promo.en.vtt`

Render before `npm run build` when preparing a deployment. Ready-made media is
included so a normal app build does not require a video render. `public/videos/**` is excluded
from Serwist precaching; the landing uses `preload="none"` and user-initiated play.

## Story and editing

| Time | Message | Product moment |
| --- | --- | --- |
| 0–4 s | You bring the effort. Make every rep count. | Workout screen reveal |
| 4–11 s | Less tapping. More lifting. | Set confirmation and automatic rest |
| 11–17 s | Turn effort into evidence. | Estimated 1RM chart and personal record |
| 17–23 s | Zero signal. Full focus. | Local save without a connection |
| 23–30 s | Your next PR starts here. | Programs, progress, and start-training CTA |

Edit copy and scene timing in `fitflow-promo.tsx`; edit the sharp, animated UI
recreations in `ui.tsx`. Colors, type scale and animation helpers live in `theme.ts`.
The composition is frame-driven and deterministic, including the countdown and
chart. These are illustrative training numbers, not promised results or a live
screen recording. The e1RM example corresponds to an 82.5 kg × 5 set (about 96.3 kg).
The offline scene explicitly assumes the app has already loaded online.

If timing or copy changes, update the VTT file and the text description in
`src/components/landing/promo-video.tsx` as well. The last scene holds its CTA
instead of fading to black. The poster is frame 780 (26 seconds).

## Assets

- The UI, motion graphics, and soundtrack were created for this project.
- `public/fonts/` contains Geist and Geist Mono, matching the application, copied
  from the installed Next.js package. Their SIL Open Font License is included.
- The soundtrack uses deterministic synthesis, with no recordings, samples, or
  external music. Regenerate it with `npm run video:audio` (Node builtins only).
  It is 30 seconds, 120 BPM, stereo 48 kHz / 16 bit, normalized to −1.5 dBFS peak.
- Rendering needs no database, API key, or remote asset fetch after Chrome is installed.

For a standalone embed:

```html
<video controls playsinline preload="none" width="1920" height="1080"
  poster="/videos/fitflow-promo-poster.jpg" style="width:100%;height:auto">
  <source src="/videos/fitflow-promo.mp4" type="video/mp4">
  <track src="/videos/fitflow-promo.en.vtt" kind="captions"
    srclang="en" label="English">
</video>
```

Remotion references: [installation](https://www.remotion.dev/docs/brownfield),
[rendering](https://www.remotion.dev/docs/render),
[frame-driven animation](https://www.remotion.dev/docs/animating-properties).
