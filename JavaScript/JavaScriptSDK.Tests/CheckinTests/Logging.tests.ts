﻿/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/logging.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />


class LoggingTests extends TestClass {

    public testCleanup() {
        // Clear the queue
        this.clearInternalLoggingQueue();

        // Reset the internal event throttle
        Microsoft.ApplicationInsights._InternalLogging.resetInternalMessageCount();

        // Reset the internal throttle max limit
        Microsoft.ApplicationInsights._InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);
    }

    /**
     * Clears the internal logging queue
     */
    private clearInternalLoggingQueue() {
        var length = Microsoft.ApplicationInsights._InternalLogging.queue.length;
        for (var i = 0; i < length; i++) {
            Microsoft.ApplicationInsights._InternalLogging.queue.shift();
        }
    }

    public registerTests() {
        var InternalLogging = Microsoft.ApplicationInsights._InternalLogging;
        var InternalLoggingMessage = Microsoft.ApplicationInsights._InternalLogMessage;
        InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);

        this.testCase({
            name: "LoggingTests: enableDebugExceptions enables exceptions",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies \n" + e.toString());
                }

                // verify
                Assert.ok(!InternalLogging.enableDebugExceptions(), "enableDebugExceptions is false by default");

                // act
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));

                // verify
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was called instead of throwing while enableDebugExceptions is false");

                // act
                InternalLogging.enableDebugExceptions = () => true;

                // verify
                Assert.throws(() =>
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!")),
                    "error is thrown when enableDebugExceptions is true");
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was not called when the error was thrown");

                // cleanup
                InternalLogging.enableDebugExceptions = () => false;                
            }
        });

        this.testCase({
            name: "LoggingTests: verboseLogging collects all logs",
            test: () => {
                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.verboseLogging = () => true;

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage("error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage("error!"));
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));

                //verify
                Assert.equal(4, InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "error!", InternalLogging.queue[0].message);
                Assert.equal("AI: " + "error!", InternalLogging.queue[1].message);
                Assert.equal("AI (Internal): " + "error!", InternalLogging.queue[2].message);
                Assert.equal("AI: " + "error!", InternalLogging.queue[3].message);

                // cleanup
                InternalLogging.verboseLogging = () => false;
            }
        });

        this.testCase({
            name: "LoggingTests: Logging only collects CRITICAL logs by default",
            test: () => {
                // setup
                InternalLogging.enableDebugExceptions = () => false;

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage("error!"));
        InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage("error!"));

                Assert.equal(0, InternalLogging.queue.length);
                
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));

                //verify
                Assert.equal(2, InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "error!", InternalLogging.queue[0].message);
                Assert.equal("AI: " + "error!", InternalLogging.queue[1].message);
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalUserActionable adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = new InternalLoggingMessage("error!");
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");
                    Assert.equal(1, InternalLogging.queue.length);
                    Assert.equal("AI: " + "error!", InternalLogging.queue[0].message);

                    // cleanup
                    
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = new InternalLoggingMessage("error!");
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");

                    Assert.equal(1, InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "error!", InternalLogging.queue[0].message);

                    // cleanup
                    
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: warnToConsole does not add to the queue ",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = "error!";
                    InternalLogging.warnToConsole(message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was called once");
                    Assert.equal(0, InternalLogging.queue.length);

                    // cleanup
                    
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: console.warn falls back to console.log",
            test: () => {
                // setup
                var throwSpy = null;
                var warn = console.warn;
                try {
                    console.warn = undefined;
                    throwSpy = this.sandbox.spy(console, "log");

                    // act
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage("error!"));

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.log was called when console.warn was not present");

                    // cleanup
                    
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                } finally {
                    console.warn = warn;
                }
            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage throttles messages when the throttle limit is reached",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new InternalLoggingMessage("Internal Test Event");

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify
                Assert.equal(maxAllowedInternalMessages + 1, InternalLogging.queue.length); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(InternalLogging.queue[0], message);
                Assert.equal(InternalLogging.queue[1], message);
                Assert.equal(InternalLogging.queue[2].message, "AI (Internal): Internal events throttle limit per PageView reached for this app.");
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new InternalLoggingMessage("Internal Test Event");
                var logInternalMessageStub = this.sandbox.stub(InternalLogging, 'logInternalMessage');

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalNonUserActionable');

                // clean
                
            }
        });
        
        this.testCase({
            name: "LoggingTests: throwInternalUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new InternalLoggingMessage("Internal Test Event");
                var logInternalMessageStub = this.sandbox.stub(InternalLogging, 'logInternalMessage');

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalUserActionable');

                // clean
                
            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage will log events when the throttle is reset",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new InternalLoggingMessage("Internal Test Event");

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify that internal events are throttled
                Assert.equal(InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached

                // act again
                this.clearInternalLoggingQueue();
                // reset the message count
                InternalLogging.resetInternalMessageCount();
                // Send some internal messages
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                InternalLogging.logInternalMessage(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify again
                Assert.equal(InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(InternalLogging.queue[0], message);
                Assert.equal(InternalLogging.queue[1], message);
            }
        });
    }
}
new LoggingTests().registerTests(); 