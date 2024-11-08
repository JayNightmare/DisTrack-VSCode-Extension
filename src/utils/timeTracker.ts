let startTime: Date | null = null;

export function startSession() {
    if (!startTime) {
        startTime = new Date();
        console.log("Coding session started at:", startTime);
    }
}

export function endSession() {
    if (startTime) {
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // duration in seconds
        console.log("Coding session ended at:", endTime);
        console.log(`Session duration: ${duration} seconds`);
        startTime = null;
        return duration;
    }
    return null;
}
