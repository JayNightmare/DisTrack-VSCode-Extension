import * as vscode from "vscode";
import { ConfigManager } from "./configManager";
import { startSession, endSession } from "./timeTracker";
import { startRichPresence, stopRichPresence } from "./rpcDiscord";

/**
 * Manages coding session tracking, timers, and status bar updates
 */
export class SessionManager {
  private sessionStartTime: Date | null = null;
  private statusBarTimer: vscode.StatusBarItem;
  private timerInterval: NodeJS.Timeout | null = null;
  private configManager: ConfigManager;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.configManager = ConfigManager.getInstance();
    this.statusBarTimer = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    // Add to context subscriptions for proper disposal
    context.subscriptions.push(this.statusBarTimer);
  }

  /**
   * Start a new coding session
   */
  startSession(): void {
    this.sessionStartTime = new Date();
    startSession();

    const enableRichPresence = this.configManager.isRichPresenceEnabled();
    if (enableRichPresence) {
      startRichPresence();
    }

    this.startTimer();
    vscode.window.showInformationMessage("<< Coding session started! >>");
  }

  /**
   * End the current coding session
   */
  async endSession(): Promise<number | null> {
    this.stopTimer();
    stopRichPresence();

    const duration = await endSession();
    this.sessionStartTime = null;

    if (duration) {
      vscode.window.showInformationMessage(
        `<< Session ended! Duration: ${Math.round(duration / 60)} minutes >>`,
      );
    }

    return duration;
  }

  /**
   * Check if a session is currently active
   */
  isSessionActive(): boolean {
    return this.sessionStartTime !== null;
  }

  /**
   * Get the current session start time
   */
  getSessionStartTime(): Date | null {
    return this.sessionStartTime;
  }

  /**
   * Start the session timer display
   */
  private startTimer(): void {
    const sessionTimerFormat = this.configManager.getTimerFormat();

    this.statusBarTimer.show();
    this.timerInterval = setInterval(() => {
      if (!this.sessionStartTime) {
        return;
      }

      const elapsed = new Date().getTime() - this.sessionStartTime.getTime();
      const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
      const seconds = Math.floor((elapsed / 1000) % 60);

      switch (sessionTimerFormat) {
        case "hh:mm:ss":
          this.statusBarTimer.text = `Session: ${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
          break;
        case "mm:ss":
          this.statusBarTimer.text = `Session: ${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          break;
        case "hours":
          this.statusBarTimer.text = `Session: ${(
            elapsed /
            (1000 * 60 * 60)
          ).toFixed(1)} hrs`;
          break;
        default:
          this.statusBarTimer.text = `Session: ${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
      }
    }, 1000);
  }

  /**
   * Stop the session timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.statusBarTimer.hide();
  }

  /**
   * Update timer format based on configuration changes
   */
  updateTimerFormat(): void {
    if (this.isSessionActive()) {
      // Restart timer with new format
      this.stopTimer();
      this.startTimer();
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopTimer();
    this.statusBarTimer.dispose();
    stopRichPresence();
  }
}
