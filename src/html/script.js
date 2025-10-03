(function () {
  const vscode = acquireVsCodeApi();
  let timerInterval;

  function cleanup() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Multiple cleanup listeners
  window.addEventListener("unload", cleanup);
  window.addEventListener("beforeunload", cleanup);

  // Store cleanup function for manual calls
  window.cleanupTimer = cleanup;

  function connectDiscord() {
    vscode.postMessage({ command: "connectDiscord" });
  }

  function reconnectDiscord() {
    vscode.postMessage({ command: "reconnectDiscord" });
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  }

  // View switching
  function switchView(view) {
    console.log(`<< Switching to view: ${view} >>`);
    document.querySelectorAll(".view-switcher button").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    document.getElementById(`${view}-button`).classList.add("active");
    document.getElementById(`${view}-view`).classList.add("active");
    console.log(`<< View switched to: ${view} >>`);
  }

  function updateTimer() {
    const sessionStart = null; // Will be set from the extension
    if (sessionStart) {
      const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
      document.getElementById("timer").textContent = formatTime(elapsed);
    } else {
      document.getElementById("timer").textContent = "00:00:00";
    }
  }

  // Start the timer when the page loads
  if (timerInterval) {
    clearInterval(timerInterval); // Clear any existing timer
  }
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();

  // Enhanced cleanup when the webview is disposed
  window.addEventListener("unload", cleanup);
  window.addEventListener("beforeunload", cleanup);

  // Global functions for external access
  window.connectDiscord = connectDiscord;
  window.reconnectDiscord = reconnectDiscord;
  window.switchView = switchView;
})();
