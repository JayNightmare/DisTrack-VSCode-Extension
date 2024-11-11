import * as vscode from 'vscode';

let startTime: Date | null = null;
let activeLanguage: string | null = null;
let languageDurations: Record<string, number> = {};

export function startSession(context: vscode.ExtensionContext) {
    startTime = new Date();
    setActiveLanguage(); // Initial language setup
    vscode.window.showInformationMessage("<< Started coding session! >>");
    console.log(`<< Coding session started at: ${startTime} >>`);
}

export function endSession(): number | null {
    if (startTime) {
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // duration in seconds
        
        // Capture any remaining time for the active language
        if (activeLanguage) {
            const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000;
            languageDurations[activeLanguage] = (languageDurations[activeLanguage] || 0) + timeSpent;
        }

        console.log(`<< Coding session ended at: ${endTime} >>`);
        console.log(`<< Session duration: ${duration} seconds >>`);
        
        // Reset session variables
        startTime = null;
        activeLanguage = null;

        return duration;
    }
    return null;
}

// Set or update the active language, accumulating time for previous language
function setActiveLanguage() {
    const editor = vscode.window.activeTextEditor;
    const now = new Date();

    if (editor) {
        const currentLanguage = editor.document.languageId;

        // Calculate time spent on the previous language before switching
        if (activeLanguage && startTime) {
            const timeSpent = (now.getTime() - startTime.getTime()) / 1000;
            languageDurations[activeLanguage] = (languageDurations[activeLanguage] || 0) + timeSpent;
            console.log(`<< Added ${timeSpent} seconds to ${activeLanguage} >>`);
        }

        // Set the new language and reset start time
        activeLanguage = currentLanguage;
        startTime = now;
        console.log(`<< Switched active language to: ${currentLanguage} >>`);
    }
}

export function getLanguageDurations() {
    return languageDurations;
}

// Event listeners to track language changes more effectively
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
