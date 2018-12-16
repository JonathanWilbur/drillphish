function tryParsingIntSetting (setting : string, defaultValue : number) : number {
    try {
        return parseInt(setting);
    } catch (e) {
        return defaultValue;
    }
}

/**
 * SETTINGS
 * The settings below are given strange default values, because these default
 * are actually template strings, which are meant to be replaced in the
 * compiled Javascript file, drillphish.min.js. All of these must be strings,
 * because that is the only way to preserve them in the final minified
 * Javascript file. (Comments are deleted and variable names are compressed.)
 * Commented next to each one is the default value they will take on if no
 * value is provided, if there is a default value.
 */
const DRILLPHISH_ACCOUNT_ID : string = "__DRILLPHISH_ACCOUNT_ID__";
const DRILLPHISH_USERNAME_FIELD_SELECTOR : string = "__DRILLPHISH_USERNAME_FIELD_SELECTOR__"; // #username
const DRILLPHISH_PASSWORD_FIELD_SELECTOR : string = "__DRILLPHISH_PASSWORD_FIELD_SELECTOR__"; // input[type='password']
const DRILLPHISH_FORM_SELECTOR : string = "__DRILLPHISH_FORM_SELECTOR__"; // #login
const DRILLPHISH_WEBHOOK_URI : string = "__DRILLPHISH_WEBHOOK_URI__";
const DRILLPHISH_REDIRECT_URI : string = "__DRILLPHISH_REDIRECT_URI__"; // https://gotcha.drillphish.com
const DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE : number = tryParsingIntSetting("__DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE__", 1); // 1
const DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE : number = tryParsingIntSetting("__DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE__", 365); // 365
const DRILLPHISH_TESTING : boolean = (new Boolean(tryParsingIntSetting("__DRILLPHISH_TESTING__", 0))).valueOf();

// Direct conversions
const MILLISECONDS_PER_SECOND : number = 1000;
const SECONDS_PER_MINUTE : number = 60;
const MINUTES_PER_HOUR : number = 60;
const HOURS_PER_DAY : number = 24;

// Indirect conversions
const MILLISECONDS_PER_DAY : number =
    MILLISECONDS_PER_SECOND *
    SECONDS_PER_MINUTE *
    MINUTES_PER_HOUR *
    HOURS_PER_DAY;

const enum DrillPhishEvent {
    DRILLPHISH_LOAD,
    WINDOW_LOAD,
    DATA_ENTERED,
    FORM_SUBMITTED,
    ALERT_ACKNOWLEDGED
}

function getCookie (cookieName : string) : string | null {
    const regex = new RegExp(`${cookieName}=([^;]+)`);
    const result = regex.exec(document.cookie);
    return (result) ? decodeURIComponent(result[1]) : null;
}

function setCookie(name : string, value : string, daysUntilExpiration : number) : void {
    const expirationDate : Date = new Date();
    expirationDate.setTime(expirationDate.getTime() + (daysUntilExpiration * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires ${expirationDate.toUTCString};path=/;`;
}

function disableAllInputElements () : void {
    document.querySelectorAll("input").forEach((input : HTMLElement) : void => {
        input.setAttribute("disabled", "disabled");
    });
}

function clearAllForms () : void {
    document.querySelectorAll("form").forEach((form : HTMLFormElement) : void => {
        form.reset();
    });
}

function getPersistentItem (name : string) : string | null {
    // Attempt to get item from window.localStorage
    const storedVictimID : string | null = window.localStorage.getItem(name);
    if (storedVictimID) return storedVictimID;
    console.debug(`DrillPhish could not find '${name}' stored with window.localStorage.`);

    // Attempt to get item from window.sessionStorage
    const sessionVictimID : string | null = window.sessionStorage.getItem(name);
    if (sessionVictimID) return sessionVictimID;
    console.debug(`DrillPhish could not find a '${name}' stored with window.sessionStorage.`);

    // Attempt to get item from document.cookie
    const cookieVictimID : string | null = getCookie(name);
    if (cookieVictimID) return cookieVictimID;
    console.debug(`DrillPhish could not find a '${name}' stored with document.cookie.`);

    return null;
}

function setPersistentItem (name : string, value : string, daysUntilExpiration : number = 1) : void {
    window.localStorage.setItem(name, value);
    window.sessionStorage.setItem(name, value);
    setCookie(name, encodeURIComponent(value), daysUntilExpiration);
    console.debug(`Stored '${name}' in persistent storage.`);
}

function getDrillPhishVictimID () : string {
    const storedVictimID : string | null = getPersistentItem("DRILLPHISH_VICTIM_ID");
    if (storedVictimID) return storedVictimID;
    const newlyGeneratedVictimID : string = Math.random().toString(36).replace("0.", "");
    return newlyGeneratedVictimID;
}

// I know this is stupidly simple, but it is really here for consistency.
function setDrillPhishVictimID (victimID : string) : void {
    setPersistentItem("DRILLPHISH_VICTIM_ID", victimID, DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE);
}

// Thank you, RobG: https://stackoverflow.com/questions/27012854/change-iso-date-string-to-date-object-javascript
function parseISOString (isoString : string) : Date {
    const numberStringsFound : string[] = isoString.split(/\D+/);
    return new Date(
        Date.UTC(
            parseInt(numberStringsFound[0]),
            (parseInt(numberStringsFound[1]) - 1),
            parseInt(numberStringsFound[2]),
            parseInt(numberStringsFound[3]),
            parseInt(numberStringsFound[4]),
            parseInt(numberStringsFound[5]),
            parseInt(numberStringsFound[6])
        )
    );
}

function getDrillPhishGotchaDate () : Date | null {
    const storedGotchaDate : string | null = getPersistentItem("DRILLPHISH_GOTCHA_TIME");
    if (!storedGotchaDate) return null;
    return parseISOString(storedGotchaDate);
}

function getUsernameElement () : HTMLInputElement | null {
    if (DRILLPHISH_USERNAME_FIELD_SELECTOR === "") {
        console.warn("No username selector set for DrillPhish. The username field will not be policed for input.");
        return null;
    }
    return document.querySelector(DRILLPHISH_USERNAME_FIELD_SELECTOR);
}

function getPasswordElement () : HTMLInputElement | null {
    if (DRILLPHISH_PASSWORD_FIELD_SELECTOR === "") {
        console.warn("No password selector set for DrillPhish. The password field will not be policed for input.");
        return null;
    }
    return document.querySelector(DRILLPHISH_PASSWORD_FIELD_SELECTOR);
}

function getFormElement () : HTMLElement | null {
    if (DRILLPHISH_FORM_SELECTOR === "") {
        console.warn("No form selector set for DrillPhish. The form will not be policed for submission.");
        return null;
    }
    return document.querySelector(DRILLPHISH_FORM_SELECTOR);
}

function report (event : DrillPhishEvent, requestData : any) : void {

    // Event data
    requestData["victimID"] = DRILLPHISH_VICTIM_ID;
    requestData["event"] = event;
    requestData["timestamp"] = (new Date()).toISOString();

    // Connection information
    requestData["protocol"] = window.location.protocol;
    requestData["hostname"] = window.location.hostname;
    requestData["port"] = window.location.port;
    requestData["pathname"] = window.location.pathname;
    requestData["search"] = window.location.search;
    requestData["hash"] = window.location.hash;
    requestData["href"] = window.location.href;

    // DrillPhish configuration
    requestData["DRILLPHISH_ACCOUNT_ID"] = DRILLPHISH_ACCOUNT_ID;
    requestData["DRILLPHISH_USERNAME_FIELD_SELECTOR"] = DRILLPHISH_USERNAME_FIELD_SELECTOR;
    requestData["DRILLPHISH_PASSWORD_FIELD_SELECTOR"] = DRILLPHISH_PASSWORD_FIELD_SELECTOR;
    requestData["DRILLPHISH_FORM_SELECTOR"] = DRILLPHISH_FORM_SELECTOR;
    requestData["DRILLPHISH_WEBHOOK_URI"] = DRILLPHISH_WEBHOOK_URI;
    requestData["DRILLPHISH_REDIRECT_URI"] = DRILLPHISH_REDIRECT_URI;
    requestData["DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE"] = DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE;
    requestData["DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE"] = DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE;
    requestData["DRILLPHISH_TESTING"] = DRILLPHISH_TESTING;

    // Browser fingerprinting
    requestData["browserCodeName"] = navigator.appCodeName;
    requestData["browserName"] = navigator.appName;
    requestData["browserVersion"] = navigator.appVersion;
    requestData["cookiesEnabled"] = navigator.cookieEnabled;
    requestData["browserLanguage"] = navigator.language;
    requestData["platform"] = navigator.platform;
    requestData["userAgent"] = navigator.userAgent;

    if (DRILLPHISH_WEBHOOK_URI === "") {
        console.debug(`DrillPhish is not using a webhook. DrillPhish would have reported this event: ${JSON.stringify(requestData)}.`);
        return;
    }

    const req : XMLHttpRequest = new XMLHttpRequest();
    req.addEventListener("load", () : void => {
        if (req.status < 200 || req.status >= 300) // REVIEW: Is this a good way to tell if a request worked?
            console.warn(`DrillPhish failed to communicate with the webhook endpoint with HTTP status ${req.status}.`);
        else
            console.debug(`DrillPhish reported event type ${event}.`);
    });
    req.open("POST", DRILLPHISH_WEBHOOK_URI, true);
    req.setRequestHeader("Content-Type", "application/json");

    /**
     * This has been removed because it requires configuration on the remote
     * server to accept these headers in CORS requests.
     */
    // req.setRequestHeader("X-DrillPhish-Account-ID", DRILLPHISH_ACCOUNT_ID);
    // req.setRequestHeader("X-DrillPhish-Victim-ID", DRILLPHISH_VICTIM_ID);

    req.send(JSON.stringify(requestData));
}

function gotcha () : void {
    console.info("Victim fell for the DrillPhish phishing drill.");
    setPersistentItem("DRILLPHISH_GOTCHA_TIME", (new Date()).toISOString(), DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE);
    if (DRILLPHISH_REDIRECT_URI !== "") {
        if (DRILLPHISH_TESTING) {
            if (confirm("Click 'OK' to be redirected to the DRILLPHISH_REDIRECT_URI. Click 'Cancel' to stay on this page."))
                window.location.href = DRILLPHISH_REDIRECT_URI;
        } else {
            window.location.href = DRILLPHISH_REDIRECT_URI;
        }
    } else {
        console.warn("DrillPhish is not configured to redirect. User will stay on current page and see an alert instead.");
        const MONITORING_MESSAGE : string = (() : string => {
            if (DRILLPHISH_WEBHOOK_URI !== "") return "You actions have been recorded and sent to a remote endpoint. ";
            return "";
        })();
        alert(`You have fallen for a phishing drill created by DrillPhish. This is a fake website. ${MONITORING_MESSAGE}`);
        report(DrillPhishEvent.ALERT_ACKNOWLEDGED, {});
    }
}

/**
 * DRILLPHISH START OF EXECUTION
 */

console.debug("DrillPhish found.");

// Settings sanity check
function template (variableName : string) : string { return `__${variableName}__`; }
function defaultSettingFailureMessage (variableName : string) : string {
    return (
`This assertion failed because you did not set the '${variableName}'
environment variable, which must be set either through entrypoint.sh in the
Docker container (strongly preferred), or you did not replace the string
'${template(variableName)}' in drillphish.min.js.`
    );
}
console.assert(DRILLPHISH_ACCOUNT_ID !== template("DRILLPHISH_ACCOUNT_ID"));
console.assert(DRILLPHISH_USERNAME_FIELD_SELECTOR !== template("DRILLPHISH_USERNAME_FIELD_SELECTOR"));
console.assert(DRILLPHISH_PASSWORD_FIELD_SELECTOR !== template("DRILLPHISH_PASSWORD_FIELD_SELECTOR"));
console.assert(DRILLPHISH_FORM_SELECTOR !== template("DRILLPHISH_FORM_SELECTOR"));
console.assert(DRILLPHISH_WEBHOOK_URI !== template("DRILLPHISH_WEBHOOK_URI"));
console.assert(DRILLPHISH_REDIRECT_URI !== template("DRILLPHISH_REDIRECT_URI"));

/**
 * We determine whether or not this victim has been phished already by
 * inspecting their cookies for drillPhishGotchaDate. It will be set if they
 * have been victimized in the past day. If that is the case, we just
 * terminate execution before anything is reported back to the webhook
 * endpoint. We do this mainly because we do not want a user to "rephish"
 * themselves--for amusement or whatever reason--thereby duplicating reports
 * sent back to the webhook endpoint.
 * 
 * Note that we intentionally use cookies here instead of localStorage, because
 * it will be domain-specific. If a user is phished on a separate domain, it
 * would be perfectly legitimate and desirable to allow execution to 
 */
const DRILLPHISH_GOTCHA_TIME : Date | null = getDrillPhishGotchaDate();
if (DRILLPHISH_GOTCHA_TIME && !DRILLPHISH_TESTING) {
    const millisecondsSinceGotcha : number = Math.abs((new Date()).getTime() - DRILLPHISH_GOTCHA_TIME.getTime());
    const daysSinceGotcha : number = Math.floor(millisecondsSinceGotcha / MILLISECONDS_PER_DAY);
    if (daysSinceGotcha < DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE) {
        disableAllInputElements();
        clearAllForms();
        window.location.href = DRILLPHISH_REDIRECT_URI;
    }
}

// This section is put outside of window.onload just in case window.onload is never called.
const DRILLPHISH_VICTIM_ID : string = getDrillPhishVictimID();
console.assert(DRILLPHISH_VICTIM_ID !== "");
setDrillPhishVictimID(DRILLPHISH_VICTIM_ID);
console.info(`Using DrillPhish Victim ID ${DRILLPHISH_VICTIM_ID} and Account ID ${DRILLPHISH_ACCOUNT_ID}.`);
report(DrillPhishEvent.DRILLPHISH_LOAD, {});

// REVIEW: Should this be window.addEventListener("load", etc...)?
window.onload = () : void => {
    console.debug("DrillPhish loaded.");
    report(DrillPhishEvent.WINDOW_LOAD, {});

    /**
     * Since the form element must be cloned to remove existing event
     * listeners, it is critical that the form element is cloned first,
     * and its new event listener applied first, then the contained inputs
     * second. If you reverse the order, cloning the form will eliminate
     * the newly added event listeners on the input elements.
     */
    const formElement : HTMLElement | null = getFormElement();
    if (formElement) {
        /**
         * Clones and replaces the watched element to remove all event
         * listeners that may have been applied before DrillPhish's event
         * listeners are applied. Credits to plalx for this solution, per:
         * https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type
         */
        const clone : HTMLElement = formElement.cloneNode(true) as HTMLElement;
        if (formElement.parentNode) formElement.parentNode.replaceChild(clone, formElement);
        clone.addEventListener("submit", (event : Event) : void => {
            event.preventDefault();
            report(DrillPhishEvent.FORM_SUBMITTED, {
                eventTarget: (() : string => {
                    if (event.srcElement) return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: clone.outerHTML
            });
            disableAllInputElements();
            clearAllForms();
            gotcha();
        });
        console.debug("DrillPhish is watching the form element for submission events.");
    } else if (DRILLPHISH_FORM_SELECTOR !== "")
        console.warn(`Failed to find the form element watched by DrillPhish, given the selector '${DRILLPHISH_FORM_SELECTOR}'. Phishing drill may fail.`);

    const usernameElement : HTMLInputElement | null = getUsernameElement();
    const passwordElement : HTMLInputElement | null = getPasswordElement();
    console.assert(!(!formElement && !usernameElement && !passwordElement),
        "Selectors given to DrillPhish found no elements to watch. DrillPhish exiting.");

    if (usernameElement) {
        usernameElement.addEventListener("blur", (event : Event) : void => {
            report(DrillPhishEvent.DATA_ENTERED, {
                eventTarget: (() : string => {
                    if (event.srcElement) return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: usernameElement.outerHTML,
                username: (() : string => usernameElement.value)()
            });
        });
        console.debug("DrillPhish is watching the username field for input events.");
    } else if (DRILLPHISH_USERNAME_FIELD_SELECTOR !== "") {
        console.warn(`Failed to find the username element watched by DrillPhish, given the selector "${DRILLPHISH_USERNAME_FIELD_SELECTOR}". Phishing drill may fail.`);
    }

    if (passwordElement) {
        passwordElement.addEventListener("input", (event : Event) : void => {
            report(DrillPhishEvent.DATA_ENTERED, {
                eventTarget: (() : string => {
                    if (event.srcElement) return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: passwordElement.outerHTML,
                username: (() : string => {
                    if (usernameElement)
                        return usernameElement.value;
                    return "";
                })()
            });
            disableAllInputElements();
            clearAllForms();
            gotcha();
        });
        console.debug("DrillPhish is watching the password field for input events.");
    } else if (DRILLPHISH_PASSWORD_FIELD_SELECTOR !== "") {
        console.warn(`Failed to find the password element watched by DrillPhish, given the selector "${DRILLPHISH_PASSWORD_FIELD_SELECTOR}". Phishing drill may fail.`);
    }
};