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
    this.updateButton = document.getElementById('smart-home-light-update');
    this.updateButton.addEventListener('click', this.updateState.bind(this));
    this.light = document.getElementById('light');
    this.initFirebase();
    this.initLighter();
  }.bind(this));
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

  let pkg = {
    OnOff: { on: elOnOff.classList.contains('is-checked') }
  };

  console.log(pkg);
  firebase.database().ref('/').child('light').set(pkg);
}

window.main = new Main();
