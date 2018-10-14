'use strict';

const functions = require('firebase-functions');
const {actionssdk} = require('actions-on-google');
const util = require('util');
const admin = require('firebase-admin');

// Initialize Firebase
admin.initializeApp();
const firebaseRef = admin.database().ref('/');

exports.fakeauth = functions.https.onRequest((request, response) => {
    const responseurl = util.format('%s?code=%s&state=%s',
        decodeURIComponent(request.query.redirect_uri), 'xxxxxx',
        request.query.state);
    console.log(responseurl);
    return response.redirect(responseurl);
});
  
exports.faketoken = functions.https.onRequest((request, response) => {
    const grantType = request.query.grant_type
        ? request.query.grant_type : request.body.grant_type;
    const secondsInDay = 86400; // 60 * 60 * 24
    const HTTP_STATUS_OK = 200;
    console.log(`Grant type ${grantType}`);

    let obj;
    if (grantType === 'authorization_code') {
        obj = {
        token_type: 'bearer',
        access_token: '123access',
        refresh_token: '123refresh',
        expires_in: secondsInDay,
        };
    } else if (grantType === 'refresh_token') {
        obj = {
        token_type: 'bearer',
        access_token: '123access',
        expires_in: secondsInDay,
        };
    }
    response.status(HTTP_STATUS_OK)
        .json(obj);
});

const app = actionssdk({debug: true});

exports.actionssdk = functions.https.onRequest(app);

app.intent('actions.intent.MAIN', (conv) => {
  conv.ask('Hello!');
});

app.intent('turn.onoff', (conv, input) => {
    const isOnOff = conv.arguments.get('onoff');

    if(isOnOff == "on") {
        conv.ask("Okay, turning on the light");
        firebaseRef.child('light').child('OnOff').update({on: true,});
    } else if(isOnOff == "off") {
        conv.ask("Sure, turning off the light");
        firebaseRef.child('light').child('OnOff').update({on: false,});
    } else {
        conv.ask("Sorry, please speak again");
    }
});

app.intent('actions.intent.TEXT', (conv, input) => {

});