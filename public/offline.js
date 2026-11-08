// Logic for offline.html. Kept in a separate file so it can be unit-tested.
//
// `navigator.onLine` only means "there is a network interface" (LTE with no
// data, Wi-Fi without internet). Reloading on it alone spins forever, so the
// page reloads only after a real request to the server succeeds.
(function () {
  var btn = document.getElementById("retry");
  var PING_URL = "/api/ping";
  var PING_TIMEOUT_MS = 4000;
  var POLL_INTERVAL_MS = 10000;
  var MAX_AUTO_PROBES = 6;
  var checking = false;
  var autoProbes = 0;

  function render() {
    btn.disabled = checking || !navigator.onLine;
    btn.textContent = checking
      ? "Checking connection\u2026"
      : navigator.onLine
        ? "Retry"
        : "Waiting for connection\u2026";
  }

  function isReachable() {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, PING_TIMEOUT_MS);
    return fetch(PING_URL + "?t=" + Date.now(), {
      method: "GET",
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then(function (res) { return res.status === 204; })
      .catch(function () { return false; })
      .finally(function () { clearTimeout(timer); });
  }

  // Resolves to true when a probe actually ran.
  function tryReload() {
    if (checking || !navigator.onLine) return Promise.resolve(false);
    checking = true;
    render();
    return isReachable().then(function (ok) {
      checking = false;
      render();
      if (ok) location.reload();
      return true;
    });
  }

  // Budgeted background probes; the budget is spent only by real probes.
  function autoProbe() {
    if (autoProbes >= MAX_AUTO_PROBES) return;
    tryReload().then(function (ran) {
      if (ran) autoProbes += 1;
    });
  }

  render();
  window.addEventListener("offline", render);
  // Connectivity came back: always probe, regardless of the budget.
  window.addEventListener("online", function () { render(); void tryReload(); });
  btn.addEventListener("click", function () { void tryReload(); });
  autoProbe();
  var poll = setInterval(function () {
    if (autoProbes >= MAX_AUTO_PROBES) { clearInterval(poll); return; }
    autoProbe();
  }, POLL_INTERVAL_MS);
})();
