import * as vscode from "vscode";
import {
  startSession,
  endSession,
  getLanguageDurations,
  getStreakData
} from "./utils/timeTracker";
import { sendSessionData, checkAndValidateUserId, getDiscordUsername } from "./utils/api";
import { startRichPresence, stopRichPresence } from "./utils/rpcDiscord";

let extensionContext: vscode.ExtensionContext;
let sessionStartTime: Date | null = null;
let sessionTimerInterval: NodeJS.Timeout | null = null;
const statusBarTimer = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);

export async function activate(context: vscode.ExtensionContext) {
  console.log("<< Activating extension... >>");
  extensionContext = context;

  // Create a status bar button for linking Discord
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  let discordId = context.globalState.get<string>("discordId");
  statusBar.text = discordId ? "Connected to Discord" : "Link to Discord";
  statusBar.command = "extension.updateDiscordId";
  statusBar.tooltip = "Click to update your Discord User ID";
  statusBar.show();

  // ! Checks if discord has been linked on boot
  if (!discordId) {
    vscode.window.showErrorMessage(
      "Discord ID is required to track sessions. Please link your Discord account"
    );
  } else {
    console.log(`<< Discord User ID: ${discordId} >>`);
    
    // Start session tracking
    sessionStartTime = new Date();
    startSession();

    const enableRichPresence = vscode.workspace
      .getConfiguration("extension")
      .get<boolean>("enableRichPresence");
    if (enableRichPresence) {
      startRichPresence();
    }

    startSessionTimer();
  }

  context.subscriptions.push(statusBar);

  statusBar.text = discordId ? "Connected to Discord" : "Link to Discord";

  // Set the command to allow re-linking Discord, even if already connected
  statusBar.command = "extension.updateDiscordId";
  statusBar.tooltip = "Click to update your Discord User ID";
  statusBar.show();
  // Show error but don't exit if no ID exists
  if (!discordId) {
    vscode.window.showErrorMessage(
      "Discord ID is required. Click the status bar button to link."
    );
  } else {
    // Start session tracking if ID exists
    sessionStartTime = new Date();
    startSession();

    const enableRichPresence = vscode.workspace
      .getConfiguration("extension")
      .get<boolean>("enableRichPresence");
    if (enableRichPresence) { startRichPresence(); }

    startSessionTimer();
  }
  context.subscriptions.push(statusBar);

  // Register the command to link or update the Discord ID
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.updateDiscordId", async () => {
      const enteredDiscordId = await vscode.window.showInputBox({
        prompt: "Enter your Discord User ID",
        placeHolder: "e.g., 123456789012345678",
        value: discordId ?? ""
      });

      if (enteredDiscordId && /^\d+$/.test(enteredDiscordId)) {
        const isValid = await checkAndValidateUserId(enteredDiscordId);
        if (isValid) {
          await context.globalState.update("discordId", enteredDiscordId);
          discordId = enteredDiscordId;
          statusBar.text = "Connected to Discord";
          
          // Start tracking if not already running
          if (!sessionStartTime) {
            sessionStartTime = new Date();
            startSession();
            
            const enableRichPresence = vscode.workspace
              .getConfiguration("extension")
              .get<boolean>("enableRichPresence");
            if (enableRichPresence) { startRichPresence(); }
            
            startSessionTimer();
          }
          
          vscode.window.showInformationMessage("Discord ID linked successfully!");
        }
      } else if (enteredDiscordId) {
        vscode.window.showErrorMessage("Invalid Discord ID format");
      }
    })
  );

  // Update Rich Presence based on configuration changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("extension.enableRichPresence")) {
      const enableRichPresence = vscode.workspace
        .getConfiguration("extension")
        .get<boolean>("enableRichPresence");
      enableRichPresence ? startRichPresence() : stopRichPresence();
    }
  });

  // Apply settings from configuration
  applyConfigurationSettings();
}

function applyConfigurationSettings() {
  const config = vscode.workspace.getConfiguration("extension");

  const discordId = config.get<string>("updateDiscordId");
  const enableRichPresence = config.get<boolean>("enableRichPresence");
  const sessionTimerFormat = config.get<string>("sessionTimerFormat");

  console.log(
    `<< Config - Discord ID: ${discordId}, Rich Presence: ${enableRichPresence}, Timer Format: ${sessionTimerFormat} >>`
  );

  if (discordId) {
    extensionContext.globalState.update("discordId", discordId);
  }
}

export async function deactivate() {
  stopSessionTimer();
  stopRichPresence();

  const duration = await endSession();
  const discordId = extensionContext.globalState.get<string>("discordId");
  let discordUsername: string | null = null;
  if (discordId) { discordUsername = await getDiscordUsername(discordId); }
  const lastSessionDate = new Date().toISOString();
  const languages = getLanguageDurations();
  const streakData = getStreakData();

  console.log(`<< Discord User Id: ${discordId} >>`);
  console.log(`<< Discord Username: ${discordUsername} >>`);
  console.log(`<< Session duration: ${duration} seconds >>`);
  console.log(`<< Last session date: ${lastSessionDate} >>`);
  console.log(`<< Session languages: ${JSON.stringify(languages)} >>`);
  console.log(`<< Streak Data: ${JSON.stringify(streakData)} >>`);

  if (!discordId || !duration) {
    console.log(
      "<< Error: Missing required data. Discord ID or Duration is null >>"
    );
    return;
  }

  try {
    console.log("<< Sending session data to Discord... >>");
    
    await sendSessionData(
      discordId,
      discordUsername ?? "",
      duration,
      lastSessionDate,
      languages,
      streakData
    );

    console.log("<< Session data sent successfully! >>");
  } catch (error) {
    console.error(`<< Failed to send session data: ${error} >>`);
  }

  console.log("<< Extension Deactivated >>");
}

// Timer function with format setting
function startSessionTimer() {
  const config = vscode.workspace.getConfiguration("extension");
  const sessionTimerFormat = config.get<string>("sessionTimerFormat");

  statusBarTimer.show();
  sessionTimerInterval = setInterval(() => {
    const elapsed = new Date().getTime() - (sessionStartTime?.getTime() ?? 0);
    const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const seconds = Math.floor((elapsed / 1000) % 60);

    switch (sessionTimerFormat) {
      case "hh:mm:ss":
        statusBarTimer.text = `Session Timer: ${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        break;
      case "mm:ss":
        statusBarTimer.text = `Session Timer: ${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        break;
      case "hours":
        statusBarTimer.text = `Session Duration: ${(
          elapsed /
          (1000 * 60 * 60)
        ).toFixed(1)} hrs`;
        break;
      default:
        statusBarTimer.text = `Session Timer: ${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
    }
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
  statusBarTimer.hide();
}
