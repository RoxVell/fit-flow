/**
 * iOS standalone PWA viewport-height fix.
 *
 * In standalone mode iOS has no URL bar, so the "large" viewport is the entire
 * screen. That makes `100vh` correct — and `100dvh` WRONG, because dvh wrongly
 * subtracts the (absent) top safe-area inset. On cold launch WebKit reports a
 * stale, too-small `100dvh` (e.g. 684px on an 812px screen); it only self
 * corrects after a scroll/overscroll. This is WebKit bug #254868.
 *
 * Fix: detect standalone before first paint and pin `--app-height` to `100vh`.
 * Browser Safari keeps the `100dvh` fallback (its URL bar makes dvh correct).
 *
 * See: https://github.com/rcarmo/piclaw/blob/main/docs/PWA.md
 */
export const APP_HEIGHT_VAR = "--app-height";

export const appHeightBootstrapScript = `(function(){try{var s=(window.navigator.standalone===true)||(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);if(s){document.documentElement.style.setProperty("${APP_HEIGHT_VAR}","100vh");}}catch(e){}})();`;
