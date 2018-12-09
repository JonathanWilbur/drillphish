#!/bin/sh

function warn () {
    echo "WARN: $1";
}

function fail () {
    echo "FAIL: $1";
    exit 1
}

cp /drillphish.template.js /usr/share/nginx/html/drillphish.min.js

if [ -z $DRILLPHISH_ACCOUNT_ID ]; then
    warn "DRILLPHISH_ACCOUNT_ID not set.";
fi

if [ -z $DRILLPHISH_REDIRECT_URI ]; then
    warn "No redirect URI set. Phishing victim will just get an alert and stay on phishing page."
fi

sed -i -e "s/__DRILLPHISH_ACCOUNT_ID__/${DRILLPHISH_ACCOUNT_ID}/" /usr/share/nginx/html/drillphish.min.js
sed -i -e "s/__DRILLPHISH_USERNAME_FIELD_SELECTOR__/${DRILLPHISH_USERNAME_FIELD_SELECTOR}/" /usr/share/nginx/html/drillphish.min.js
sed -i -e "s/__DRILLPHISH_PASSWORD_FIELD_SELECTOR__/${DRILLPHISH_PASSWORD_FIELD_SELECTOR}/" /usr/share/nginx/html/drillphish.min.js
sed -i -e "s/__DRILLPHISH_FORM_SELECTOR__/${DRILLPHISH_FORM_SELECTOR}/" /usr/share/nginx/html/drillphish.min.js
sed -i -e "s|__DRILLPHISH_WEBHOOK_URI__|${DRILLPHISH_WEBHOOK_URI}|" /usr/share/nginx/html/drillphish.min.js
sed -i -e "s|__DRILLPHISH_REDIRECT_URI__|${DRILLPHISH_REDIRECT_URI}|" /usr/share/nginx/html/drillphish.min.js

if [ ! -z $DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE ]; then
    sed -i -e "s/__DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE__/${DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE}/" /usr/share/nginx/html/drillphish.min.js
else
    info "DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE not set. Defaulting to one day."
    sed -i -e "s/__DRILLPHISH_DAYS_BETWEEN_REARMING_PAGE__/1/" /usr/share/nginx/html/drillphish.min.js
fi

if [ ! -z $DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE ]; then
    sed -i -e "s/__DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE__/${DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE}/" /usr/share/nginx/html/drillphish.min.js
else
    info "DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE not set. Defaulting to 365 days."
    sed -i -e "s/__DRILLPHISH_DAYS_OF_VICTIM_ID_PERSISTENCE__/365/" /usr/share/nginx/html/drillphish.min.js
fi

nginx -g "daemon off;"