const { PrayerManager } = require("prayer-times.js");
let prayTimes = new PrayerManager("Egypt");
let lat = 31.223;
let lng = 30.0355;
let times = prayTimes.getTimes(
  new Date(),
  [lat, lng],
  "+" + new Date().getTimezoneOffset() / (new Date().getTimezoneOffset() / 2)
); // Get prayers times for "today" at lat: 43, long: -80 with -5 timezone

// SHOW
console.log(times);
