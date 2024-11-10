import * as vscode from 'vscode';

let startTime: Date | null = null;

export function startSession(context: vscode.ExtensionContext) {
    if (!startTime) {
        startTime = new Date();
        vscode.window.showInformationMessage("<< Started coding session! >>");
        console.log(`<< Coding session started at: ${startTime} >>`);
    }
}

export function endSession(): number | null {
    if (startTime) {
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // duration in seconds
        startTime = null; // Reset start time for the next session

        console.log(`<< Coding session ended at: ${endTime} >>`);
        console.log(`<< Session duration: ${duration} seconds >>`);

        return duration;
    }
    return null;
}