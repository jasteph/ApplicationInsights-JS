﻿module Microsoft.ApplicationInsights {

    export enum LoggingSeverity {
        /**
         * Error will be sent as internal telemetry
         */
        CRITICAL = 0,

        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        WARNING = 1
    }

    export class _InternalLogMessage {
        public message: string;
        public properties: any;

        constructor(msg: string, properties?: Object) {
            this.message = msg;
            if (typeof (properties) === "undefined" || !properties) {
                this.properties = {};
            }
            else {
                this.properties = properties;
            }            
        }
    }

    export class _InternalLogging {

        /**
         * Prefix of the traces in portal.
         */
        private static AiUserActionablePrefix = "AI: ";

        /**
         * For user non actionable traces use AI Internal prefix.
         */
        private static AiNonUserActionablePrefix = "AI (Internal): ";

        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        public static enableDebugExceptions = () => false;

        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        public static verboseLogging = () => false;

        /**
         * The internal logging queue
         */
        public static queue = [];
        
        /**
         * The maximum number of internal messages allowed to be sent per page view
         */
        private static MAX_INTERNAL_MESSAGE_LIMIT = 25;
        
        /**
         * Count of internal messages sent
         */
        private static _messageCount = 0;
        
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        public static throwInternalNonUserActionable(severity: LoggingSeverity, message: _InternalLogMessage) {
            if (this.enableDebugExceptions()) {
                throw message;
            } else {
                if (typeof (message) !== "undefined" && !!message) {
                    if (typeof (message.message) !== "undefined") {
                        message.message = this.AiNonUserActionablePrefix + message.message;
                        if (typeof (message.properties) === "object") {
                            this.warnToConsole(message.message + " properties: " + JSON.stringify(message.properties));
                        }
                        else {
                            this.warnToConsole(message.message);
                        }

                        this.logInternalMessage(severity, message);
                    }
                }
                
            }
        }

        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        public static throwInternalUserActionable(severity: LoggingSeverity, message: _InternalLogMessage) {
            if (this.enableDebugExceptions()) {
                throw message;
            } else {
                if (typeof (message) !== "undefined" && !!message) {
                    if (typeof (message.message) !== "undefined") {
                        message.message = this.AiUserActionablePrefix + message.message;
                        if (typeof (message.properties) === "object") {
                            this.warnToConsole(message.message + " properties: " + JSON.stringify(message.properties));
                        }
                        else {
                            this.warnToConsole(message.message);
                        }

                        this.logInternalMessage(severity, message);
                    }
                }
            }
        }

        /**
         * This will write a warning to the console if possible
         * @param message {string} - The warning message
         */
        public static warnToConsole(message: string) {
            if (typeof console !== "undefined" && !!console) {
                if (typeof console.warn === "function") {
                    console.warn(message);
                } else if (typeof console.log === "function") {
                    console.log(message);
                }
            }
        }
        
        /**
         * Resets the internal message count
         */
        public static resetInternalMessageCount(): void {
            this._messageCount = 0;
        }

        /**
         * Sets the limit for the number of internal events before they are throttled
         * @param limit {number} - The throttle limit to set for internal events
         */
        public static setMaxInternalMessageLimit(limit: number): void {
            if (!limit) {
                throw new Error('limit cannot be undefined.');
            }
            
            this.MAX_INTERNAL_MESSAGE_LIMIT = limit;
        }
        
        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        public static logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
            if (this._areInternalMessagesThrottled()) {
                return;
            }

            // Push the event in the internal queue
            if (this.verboseLogging() || severity === LoggingSeverity.CRITICAL) {
                this.queue.push(message);
                this._messageCount++;
            }

            // When throttle limit reached, send a special event
            if (this._messageCount == this.MAX_INTERNAL_MESSAGE_LIMIT) {
                var throttleLimitMessage = this.AiNonUserActionablePrefix + "Internal events throttle limit per PageView reached for this app.";
                var throttleMessage = new _InternalLogMessage(throttleLimitMessage);

                this.queue.push(throttleMessage);
                this.warnToConsole(throttleLimitMessage);
            }
        }

        /**
         * Indicates whether the internal events are throttled
         */
        private static _areInternalMessagesThrottled(): boolean {
            return this._messageCount >= this.MAX_INTERNAL_MESSAGE_LIMIT;
        }
    }
}