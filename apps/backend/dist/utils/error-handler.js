"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
/**
 * Global error handler pre backend
 * Zabráni pádu aplikácie pri network chybách
 */
class ErrorHandler {
    static handleUncaughtErrors() {
        // Zachytí uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            console.error('Stack:', error.stack);
            // Pri kritických chybách reštartuj
            if (this.isCriticalError(error)) {
                console.error('🔴 Critical error - restarting in 5 seconds...');
                setTimeout(() => {
                    process.exit(1); // Nodemon automaticky reštartuje
                }, 5000);
            }
            else {
                console.log('⚠️ Non-critical error - continuing...');
            }
        });
        // Zachytí unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
            // ECONNRESET nie je kritická chyba
            if (reason?.code === 'ECONNRESET') {
                console.log('⚠️ Connection reset - ignoring and continuing...');
                return;
            }
            // Iné chyby môžu byť kritické
            if (this.isCriticalError(reason)) {
                console.error('🔴 Critical rejection - restarting in 5 seconds...');
                setTimeout(() => {
                    process.exit(1);
                }, 5000);
            }
        });
        // Graceful shutdown pri SIGTERM/SIGINT
        process.on('SIGTERM', this.gracefulShutdown);
        process.on('SIGINT', this.gracefulShutdown);
    }
    static isCriticalError(error) {
        // Definuj ktoré chyby sú kritické
        const criticalErrors = [
            'EADDRINUSE', // Port už používaný
            'EACCES', // Permission denied
            'ENOENT', // File not found (kritické súbory)
        ];
        return criticalErrors.includes(error?.code);
    }
    static gracefulShutdown(signal) {
        console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
        // Zatvor všetky spojenia
        // TODO: Zatvor databázu, IMAP, atď.
        setTimeout(() => {
            console.log('👋 Goodbye!');
            process.exit(0);
        }, 2000);
    }
    // Express error middleware
    static expressErrorHandler(err, req, res, next) {
        console.error('❌ Express Error:', err);
        // ECONNRESET ignoruj
        if (err.code === 'ECONNRESET') {
            console.log('⚠️ Client disconnected - ignoring');
            return;
        }
        // Vráť error response
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=error-handler.js.map