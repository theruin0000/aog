'use strict';

const functions = require('firebase-functions');
const {smarthome} = require('actions-on-google');
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

let jwt;
try {
jwt = require('./key.json');
} catch (e) {
console.warn('Service account key is not found');
console.warn('Report state will be unavailable');
}

const app = smarthome({
    debug: true,
    // key: '<api-key>',
    key: 'AIzaSyDHu4Ny0ZXByd3YVxpoPdkTy3_nIQ07xJ4',
    jwt: jwt,
});

app.onSync((body) => {
    return {
        requestId: body.requestId,
        payload: {
        agentUserId: '123',
        devices: [{
            id: 'light',
            type: 'action.devices.types.LIGHT',
            traits: [
            'action.devices.traits.OnOff',
            ],
            name: {
            defaultNames: ['My Light'],
            name: 'Light',
            nicknames: ['Light'],
            },
            deviceInfo: {
            manufacturer: 'Acme Co',
            model: 'acme-light',
            hwVersion: '1.0',
            swVersion: '1.0.1',
            },
        }],
        },
    };
});

const queryFirebase = (deviceId) => firebaseRef.child(deviceId).once('value')
  .then((snapshot) => {
    const snapshotVal = snapshot.val();
    return {
      on: snapshotVal.OnOff.on,
    };
  });

const queryDevice = (deviceId) => queryFirebase(deviceId).then((data) => ({
  on: data.on,
}));

app.onQuery((body) => {
    const {requestId} = body;
    const payload = {
      devices: {},
    };
    const queryPromises = [];
    for (const input of body.inputs) {
      for (const device of input.payload.devices) {
        const deviceId = device.id;
        queryPromises.push(queryDevice(deviceId)
          .then((data) => {
            // Add response to device payload
            payload.devices[deviceId] = data;
          }));
      }
    }
    // Wait for all promises to resolve
    return Promise.all(queryPromises).then((values) => ({
      requestId: requestId,
      payload: payload,
    }));
});

app.onExecute((body) => {
    const {requestId} = body;
    const payload = {
      commands: [{
        ids: [],
        status: 'SUCCESS',
        states: {
          online: true,
        },
      }],
    };
    for (const input of body.inputs) {
      for (const command of input.payload.commands) {
        for (const device of command.devices) {
          const deviceId = device.id;
          payload.commands[0].ids.push(deviceId);
          for (const execution of command.execution) {
            const execCommand = execution.command;
            const {params} = execution;
            switch (execCommand) {
              case 'action.devices.commands.OnOff':
                firebaseRef.child(deviceId).child('OnOff').update({
                  on: params.on,
                });
                payload.commands[0].states.on = params.on;
                break;
            }
          }
        }
      }
    }
    return {
      requestId: requestId,
      payload: payload,
    };
});

exports.smarthome = functions.https.onRequest(app);

// exports.requestsync = functions.https.onRequest((request, response) => {
//     console.info('Request SYNC for user 123');
//     app.requestSync('123')
//       .then((res) => {
//         console.log('Request sync completed');
//         response.json(data);
//       }).catch((err) => {
//         console.error(err);
//       });
//   });
  
  /**
   * Send a REPORT STATE call to the homegraph when data for any device id
   * has been changed.
   */

  exports.reportstate = functions.database.ref('{deviceId}').onWrite((event) => {
    console.info('Firebase write event triggered this cloud function');
    if (!app.jwt) {
      console.warn('Service account key is not configured');
      console.warn('Report state is unavailable');
      return;
    }
    const snapshotVal = event.after.val();
  
    const postData = {
      requestId: 'ff36a3cc', /* Any unique ID */
      agentUserId: '123', /* Hardcoded user ID */
      payload: {
        devices: {
          states: {
            /* Report the current state of our washer */
            [event.params.deviceId]: {
              on: snapshotVal.OnOff.on,
            },
          },
        },
      },
    };
  
    return app.reportState(postData)
      .then((data) => {
        console.log('Report state came back');
        console.info(data);
      });
  });