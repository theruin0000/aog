/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes the SmartHome.
function Main() {
  document.addEventListener('DOMContentLoaded', function () {
    // Bind events.
    // this.updateButton = document.getElementById('smart-home-light-update');
    // this.updateButton.addEventListener('click', this.updateState.bind(this));

    let elOnOff = document.getElementById('light-onOff');
    elOnOff.addEventListener("change", this.updateState.bind(this));

    this.light = document.getElementById('light');
    this.initFirebase();
    this.initLighter();
  }.bind(this));
}

function sendMessage(isOn) {
  const key = 'AAAAhmYf7_Y:APA91bFNrhAdK-yNpZb7r4-fHLD7cqidZVLWT0nvS77XYFNTls6sott0JZ5o8aEvzS6DrWnPNHz_KajrF_r3fijyXfSYmk7CMzM_R8NXLAn_ooxKIdg9_yFLN6UHXLnPvwVE9Qe1oWZE';
  const to = 'cIJp5mws_Ok:APA91bHvJfJJU73zckE6qJVHCoxGQNA7TLkyIdTQfq4Iu7D7EPUTvbKNdvloQUjee9rOf4umNbyWeo-xE-a849vwAahkx-byIppoOMq9ZzFPLIXxnag_R6GMl0KlMp6q4zftu_5Pt6Tp'

  const notification = {
    'title': 'State has been changed',
    'body': 'Light ' + (isOn ? 'on' : 'off'),
    'icon': 'firebase-logo.png',
    'click_action': 'https://example02-8bcc0.firebaseapp.com'
  };

  fetch('https://fcm.googleapis.com/fcm/send', {
    'method': 'POST',
    'headers': {
        'Authorization': 'key=' + key,
        'Content-Type': 'application/json'
  },
    'body': JSON.stringify({
        // 'notification': notification,
        'data': {
          'notification': notification},
          'to': to
  })
  }).then(function(response) {
    console.log(response);
  }).catch(function(error) {
    console.error(error);
  })
}

Main.prototype.initFirebase = () => {
  // Initiates Firebase.
  console.log("Initialized Firebase");
};

Main.prototype.initLighter = () => {
  console.log("Logged in as default user");
  this.main.handleData();
  this.main.light.style.display = "block";
}

Main.prototype.setToken = (token) => {
  console.log("setToken");
  document.cookie = '__session=' + token + ';max-age=3600';
};

Main.prototype.handleData = () => {
  console.log("handleData");
  let elOnOff = document.getElementById('light-onOff');

  firebase.database().ref('/').child('light').on("value", (snapshot) => {
    if (snapshot.exists()) {
      var lightState = snapshot.val();
      console.log(lightState)

      if (lightState.OnOff.on) elOnOff.MaterialSwitch.on();
      else elOnOff.MaterialSwitch.off();
    }
  })
}

Main.prototype.updateState = () => {
  console.log("updateState");
  let elOnOff = document.getElementById('light-onOff');

  const isOn = elOnOff.classList.contains('is-checked');
  let pkg = {
    OnOff: { on: isOn }
  };

  console.log(pkg);
  firebase.database().ref('/').child('light').set(pkg);
  sendMessage(isOn);
}

window.main = new Main();
