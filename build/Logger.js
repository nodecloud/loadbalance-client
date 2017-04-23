'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Logger class.
 */
class Logger {
    constructor(logger) {
        this.logger = logger || console;
    }

    /**
     * The fatal level logger. It's the most serious error.
     *
     * @param msg
     * @param error
     */
    fatal(msg, error) {
        this.logger.log('fatal', `${msg}${error ? ' The exception is ' + error : ''}`);
    }

    /**
     * The error level logger. When app throw some exception, please use it.
     *
     * @param msg
     * @param error
     */
    error(msg, error) {
        this.logger.log('error', `${msg}${error ? ' The exception is ' + error : ''}`);
    }

    /**
     * The warn level logger. Maybe the app occurs something wrong.
     *
     * @param msg
     * @param error
     */
    warn(msg, error) {
        this.logger.log('warn', `${msg}${error ? ' The exception is ' + error : ''}`);
    }

    /**
     * The info level logger.
     *
     * @param msg
     * @param error
     */
    info(msg, error) {
        this.logger.log('info', `${msg}${error ? ' The exception is ' + error : ''}`);
    }

    /**
     * The debug level logger.
     *
     * @param msg
     * @param error
     */
    debug(msg, error) {
        this.logger.log('debug', `${msg}${error ? ' The exception is ' + error : ''}`);
    }
}
exports.default = Logger;
module.exports = exports['default'];