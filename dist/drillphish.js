"use strict";
function tryParsingIntSetting(setting, defaultValue) {
    try {
        return parseInt(setting);
    }
    catch (e) {
        return defaultValue;
    }
}
const DRILLPHISH_ACCOUNT_ID = "__DRILLPHISH_ACCOUNT_ID__";
const DRILLPHISH_USERNAME_FIELD_SELECTOR = "__DRILLPHISH_USERNAME_FIELD_SELECTOR__";
const DRILLPHISH_PASSWORD_FIELD_SELECTOR = "__DRILLPHISH_PASSWORD_FIELD_SELECTOR__";
const DRILLPHISH_FORM_SELECTOR = "__DRILLPHISH_FORM_SELECTOR__";
const DRILLPHISH_WEBHOOK_URI = "__DRILLPHISH_WEBHOOK_URI__";
const DRILLPHISH_REDIRECT_URI = "__DRILLPHISH_REDIRECT_URI__";
const DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE = tryParsingIntSetting("__DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE__", 1);
const DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE = tryParsingIntSetting("__DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE__", 365);
const DRILLPHISH_TESTING = (new Boolean(tryParsingIntSetting("__DRILLPHISH_TESTING__", 0))).valueOf();
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_SECOND *
    SECONDS_PER_MINUTE *
    MINUTES_PER_HOUR *
    HOURS_PER_DAY;
var DrillPhishEvent;
(function (DrillPhishEvent) {
    DrillPhishEvent[DrillPhishEvent["DRILLPHISH_LOAD"] = 0] = "DRILLPHISH_LOAD";
    DrillPhishEvent[DrillPhishEvent["WINDOW_LOAD"] = 1] = "WINDOW_LOAD";
    DrillPhishEvent[DrillPhishEvent["DATA_ENTERED"] = 2] = "DATA_ENTERED";
    DrillPhishEvent[DrillPhishEvent["FORM_SUBMITTED"] = 3] = "FORM_SUBMITTED";
    DrillPhishEvent[DrillPhishEvent["ALERT_ACKNOWLEDGED"] = 4] = "ALERT_ACKNOWLEDGED";
})(DrillPhishEvent || (DrillPhishEvent = {}));
function getCookie(cookieName) {
    const regex = new RegExp(`${cookieName}=([^;]+)`);
    const result = regex.exec(document.cookie);
    return (result) ? decodeURIComponent(result[1]) : null;
}
function setCookie(name, value, daysUntilExpiration) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (daysUntilExpiration * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires ${expirationDate.toUTCString};path=/;`;
}
function disableAllInputElements() {
    document.querySelectorAll("input").forEach((input) => {
        input.setAttribute("disabled", "disabled");
    });
}
function clearAllForms() {
    document.querySelectorAll("form").forEach((form) => {
        form.reset();
    });
}
function getPersistentItem(name) {
    const storedVictimID = window.localStorage.getItem(name);
    if (storedVictimID)
        return storedVictimID;
    console.debug(`DrillPhish could not find '${name}' stored with window.localStorage.`);
    const sessionVictimID = window.sessionStorage.getItem(name);
    if (sessionVictimID)
        return sessionVictimID;
    console.debug(`DrillPhish could not find a '${name}' stored with window.sessionStorage.`);
    const cookieVictimID = getCookie(name);
    if (cookieVictimID)
        return cookieVictimID;
    console.debug(`DrillPhish could not find a '${name}' stored with document.cookie.`);
    return null;
}
function setPersistentItem(name, value, daysUntilExpiration = 1) {
    window.localStorage.setItem(name, value);
    window.sessionStorage.setItem(name, value);
    setCookie(name, encodeURIComponent(value), daysUntilExpiration);
    console.debug(`Stored '${name}' in persistent storage.`);
}
function getDrillPhishVictimID() {
    const storedVictimID = getPersistentItem("DRILLPHISH_VICTIM_ID");
    if (storedVictimID)
        return storedVictimID;
    const newlyGeneratedVictimID = Math.random().toString(36).replace("0.", "");
    return newlyGeneratedVictimID;
}
function setDrillPhishVictimID(victimID) {
    setPersistentItem("DRILLPHISH_VICTIM_ID", victimID, DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE);
}
function parseISOString(isoString) {
    const numberStringsFound = isoString.split(/\D+/);
    return new Date(Date.UTC(parseInt(numberStringsFound[0]), (parseInt(numberStringsFound[1]) - 1), parseInt(numberStringsFound[2]), parseInt(numberStringsFound[3]), parseInt(numberStringsFound[4]), parseInt(numberStringsFound[5]), parseInt(numberStringsFound[6])));
}
function getDrillPhishGotchaDate() {
    const storedGotchaDate = getPersistentItem("DRILLPHISH_GOTCHA_TIME");
    if (!storedGotchaDate)
        return null;
    return parseISOString(storedGotchaDate);
}
function getUsernameElement() {
    if (DRILLPHISH_USERNAME_FIELD_SELECTOR === "") {
        console.warn("No username selector set for DrillPhish. The username field will not be policed for input.");
        return null;
    }
    return document.querySelector(DRILLPHISH_USERNAME_FIELD_SELECTOR);
}
function getPasswordElement() {
    if (DRILLPHISH_PASSWORD_FIELD_SELECTOR === "") {
        console.warn("No password selector set for DrillPhish. The password field will not be policed for input.");
        return null;
    }
    return document.querySelector(DRILLPHISH_PASSWORD_FIELD_SELECTOR);
}
function getFormElement() {
    if (DRILLPHISH_FORM_SELECTOR === "") {
        console.warn("No form selector set for DrillPhish. The form will not be policed for submission.");
        return null;
    }
    return document.querySelector(DRILLPHISH_FORM_SELECTOR);
}
function report(event, requestData) {
    requestData["victimID"] = DRILLPHISH_VICTIM_ID;
    requestData["event"] = event;
    requestData["timestamp"] = (new Date()).toISOString();
    requestData["protocol"] = window.location.protocol;
    requestData["hostname"] = window.location.hostname;
    requestData["port"] = window.location.port;
    requestData["pathname"] = window.location.pathname;
    requestData["search"] = window.location.search;
    requestData["hash"] = window.location.hash;
    requestData["href"] = window.location.href;
    requestData["DRILLPHISH_ACCOUNT_ID"] = DRILLPHISH_ACCOUNT_ID;
    requestData["DRILLPHISH_USERNAME_FIELD_SELECTOR"] = DRILLPHISH_USERNAME_FIELD_SELECTOR;
    requestData["DRILLPHISH_PASSWORD_FIELD_SELECTOR"] = DRILLPHISH_PASSWORD_FIELD_SELECTOR;
    requestData["DRILLPHISH_FORM_SELECTOR"] = DRILLPHISH_FORM_SELECTOR;
    requestData["DRILLPHISH_WEBHOOK_URI"] = DRILLPHISH_WEBHOOK_URI;
    requestData["DRILLPHISH_REDIRECT_URI"] = DRILLPHISH_REDIRECT_URI;
    requestData["DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE"] = DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE;
    requestData["DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE"] = DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE;
    requestData["DRILLPHISH_TESTING"] = DRILLPHISH_TESTING;
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
    const req = new XMLHttpRequest();
    req.addEventListener("load", () => {
        if (req.status < 200 || req.status >= 300)
            console.warn(`DrillPhish failed to communicate with the webhook endpoint with HTTP status ${req.status}.`);
        else
            console.debug(`DrillPhish reported event type ${event}.`);
    });
    req.open("POST", DRILLPHISH_WEBHOOK_URI, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(requestData));
}
function gotcha() {
    console.info("Victim fell for the DrillPhish phishing drill.");
    setPersistentItem("DRILLPHISH_GOTCHA_TIME", (new Date()).toISOString(), DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE);
    if (DRILLPHISH_REDIRECT_URI !== "") {
        if (DRILLPHISH_TESTING) {
            if (confirm("Click 'OK' to be redirected to the DRILLPHISH_REDIRECT_URI. Click 'Cancel' to stay on this page."))
                window.location.href = DRILLPHISH_REDIRECT_URI;
        }
        else {
            window.location.href = DRILLPHISH_REDIRECT_URI;
        }
    }
    else {
        console.warn("DrillPhish is not configured to redirect. User will stay on current page and see an alert instead.");
        const MONITORING_MESSAGE = (() => {
            if (DRILLPHISH_WEBHOOK_URI !== "")
                return "You actions have been recorded and sent to a remote endpoint. ";
            return "";
        })();
        alert(`You have fallen for a phishing drill created by DrillPhish. This is a fake website. ${MONITORING_MESSAGE}`);
        report(4, {});
    }
}
console.debug("DrillPhish found.");
function template(variableName) { return `__${variableName}__`; }
function defaultSettingFailureMessage(variableName) {
    return (`This assertion failed because you did not set the '${variableName}'
environment variable, which must be set either through entrypoint.sh in the
Docker container (strongly preferred), or you did not replace the string
'${template(variableName)}' in drillphish.min.js.`);
}
console.assert(DRILLPHISH_ACCOUNT_ID !== template("DRILLPHISH_ACCOUNT_ID"));
console.assert(DRILLPHISH_USERNAME_FIELD_SELECTOR !== template("DRILLPHISH_USERNAME_FIELD_SELECTOR"));
console.assert(DRILLPHISH_PASSWORD_FIELD_SELECTOR !== template("DRILLPHISH_PASSWORD_FIELD_SELECTOR"));
console.assert(DRILLPHISH_FORM_SELECTOR !== template("DRILLPHISH_FORM_SELECTOR"));
console.assert(DRILLPHISH_WEBHOOK_URI !== template("DRILLPHISH_WEBHOOK_URI"));
console.assert(DRILLPHISH_REDIRECT_URI !== template("DRILLPHISH_REDIRECT_URI"));
const DRILLPHISH_GOTCHA_TIME = getDrillPhishGotchaDate();
if (DRILLPHISH_GOTCHA_TIME && !DRILLPHISH_TESTING) {
    const millisecondsSinceGotcha = Math.abs((new Date()).getTime() - DRILLPHISH_GOTCHA_TIME.getTime());
    const daysSinceGotcha = Math.floor(millisecondsSinceGotcha / MILLISECONDS_PER_DAY);
    if (daysSinceGotcha < DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE) {
        disableAllInputElements();
        clearAllForms();
        window.location.href = DRILLPHISH_REDIRECT_URI;
    }
}
const DRILLPHISH_VICTIM_ID = getDrillPhishVictimID();
console.assert(DRILLPHISH_VICTIM_ID !== "");
setDrillPhishVictimID(DRILLPHISH_VICTIM_ID);
console.info(`Using DrillPhish Victim ID ${DRILLPHISH_VICTIM_ID} and Account ID ${DRILLPHISH_ACCOUNT_ID}.`);
report(0, {});
window.onload = () => {
    console.debug("DrillPhish loaded.");
    report(1, {});
    const formElement = getFormElement();
    if (formElement) {
        const clone = formElement.cloneNode(true);
        if (formElement.parentNode)
            formElement.parentNode.replaceChild(clone, formElement);
        clone.addEventListener("submit", (event) => {
            event.preventDefault();
            report(3, {
                eventTarget: (() => {
                    if (event.srcElement)
                        return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: clone.outerHTML
            });
            disableAllInputElements();
            clearAllForms();
            gotcha();
        });
        console.debug("DrillPhish is watching the form element for submission events.");
    }
    else if (DRILLPHISH_FORM_SELECTOR !== "")
        console.warn(`Failed to find the form element watched by DrillPhish, given the selector '${DRILLPHISH_FORM_SELECTOR}'. Phishing drill may fail.`);
    const usernameElement = getUsernameElement();
    const passwordElement = getPasswordElement();
    console.assert(!(!formElement && !usernameElement && !passwordElement), "Selectors given to DrillPhish found no elements to watch. DrillPhish exiting.");
    if (usernameElement) {
        usernameElement.addEventListener("blur", (event) => {
            report(2, {
                eventTarget: (() => {
                    if (event.srcElement)
                        return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: usernameElement.outerHTML,
                username: (() => usernameElement.value)()
            });
        });
        console.debug("DrillPhish is watching the username field for input events.");
    }
    else if (DRILLPHISH_USERNAME_FIELD_SELECTOR !== "") {
        console.warn(`Failed to find the username element watched by DrillPhish, given the selector "${DRILLPHISH_USERNAME_FIELD_SELECTOR}". Phishing drill may fail.`);
    }
    if (passwordElement) {
        passwordElement.addEventListener("input", (event) => {
            report(2, {
                eventTarget: (() => {
                    if (event.srcElement)
                        return event.srcElement.outerHTML;
                    return "";
                })(),
                selectionTarget: passwordElement.outerHTML,
                username: (() => {
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
    }
    else if (DRILLPHISH_PASSWORD_FIELD_SELECTOR !== "") {
        console.warn(`Failed to find the password element watched by DrillPhish, given the selector "${DRILLPHISH_PASSWORD_FIELD_SELECTOR}". Phishing drill may fail.`);
    }
};
