import * as vscode from 'vscode';
const { updateStreak } = require('./api.ts');

export let sessionStartTime: Date | null = null;
let activeLanguageStartTime: Date | null = null;
let activeLanguage: string | null = null;

let currentStreak = 0;
let longestStreak = 0;
let lastSessionDate: string | null = null;

let languageDurations: Record<string, number> = {};

// Start the coding session
export function startSession() {
    sessionStartTime = new Date();
    activeLanguageStartTime = sessionStartTime; // Set the initial start time for active language
    vscode.window.showInformationMessage("<< Started coding session! >>");
    console.log(`<< Session started at: ${sessionStartTime} >>`);
}

// End the coding session and return the total duration in seconds
export function endSession(): number | null {
    if (sessionStartTime) {
        const sessionEndTime = new Date();
        const totalDuration = (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;

        // Add time for the last active language
        if (activeLanguage && activeLanguageStartTime) {
            const timeSpent = (sessionEndTime.getTime() - activeLanguageStartTime.getTime()) / 1000;
            languageDurations[activeLanguage] = (languageDurations[activeLanguage] || 0) + timeSpent;
        }

        console.log(`<< Session ended at: ${sessionEndTime} >>`);
        console.log(`<< Total session duration: ${totalDuration} seconds >>`);
        console.log(`<< Language durations: ${JSON.stringify(languageDurations)} >>`);

        // Reset session variables
        sessionStartTime = null;
        activeLanguageStartTime = null;
        activeLanguage = null;

        return totalDuration;
    }
    return null;
}

// Update active language and accumulate time
function setActiveLanguage() {
    const editor = vscode.window.activeTextEditor;
    const now = new Date();

    if (editor) {
        const currentLanguage = editor.document.languageId;

        // Accumulate time for the previous active language
        if (activeLanguage && activeLanguageStartTime) {
            const timeSpent = (now.getTime() - activeLanguageStartTime.getTime()) / 1000;
            languageDurations[activeLanguage] = (languageDurations[activeLanguage] || 0) + timeSpent;
            console.log(`<< Added ${timeSpent} seconds to ${activeLanguage} >>`);
        }

        // Update active language and reset start time
        activeLanguage = currentLanguage;
        activeLanguageStartTime = now;
        console.log(`<< Switched active language to: ${currentLanguage} >>`);
    }
}

// Get streak data
export function getStreakData() {
    return { currentStreak, longestStreak, lastSessionDate };
}

// Get language durations
export function getLanguageDurations() {
    return languageDurations;
}

// Event listeners for language changes
vscode.window.onDidChangeActiveTextEditor(() => {
    setActiveLanguage();
});

vscode.workspace.onDidOpenTextDocument(() => {
    setActiveLanguage();
});

vscode.workspace.onDidCloseTextDocument(() => {
    setActiveLanguage();
});

vscode.workspace.onDidChangeTextDocument(() => {
    setActiveLanguage();
});
