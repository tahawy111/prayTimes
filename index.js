let PrayerTimes = function (calcMethod = "MWL") {
  let PrayerTimes = {};

  let DMath = require("./dmath");

  let timeNames = {
    imsak: "Imsak",
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    sunset: "Sunset",
    maghrib: "Maghrib",
    isha: "Isha",
    midnight: "Midnight",
  };

  let methods = {
    MWL: {
      name: "Muslim World League",
      params: { fajr: 18, isha: 17 },
    },
    ISNA: {
      name: "Islamic Society of North America (ISNA)",
      params: { fajr: 15, isha: 15 },
    },
    Egypt: {
      name: "Egyptian General Authority of Survey",
      params: { fajr: 19.5, isha: 17.5 },
    },
    Makkah: {
      name: "Umm Al-Qura University, Makkah",
      params: { fajr: 18.5, isha: "90 min" },
    }, // fajr was 19 degrees before 1430 hijri
    Karachi: {
      name: "University of Islamic Sciences, Karachi",
      params: { fajr: 18, isha: 18 },
    },
    Tehran: {
      name: "Institute of Geophysics, University of Tehran",
      params: { fajr: 17.7, isha: 14, maghrib: 4.5, midnight: "Jafari" },
    }, // isha is not explicitly specified in this method
    Jafari: {
      name: "Shia Ithna-Ashari, Leva Institute, Qum",
      params: { fajr: 16, isha: 14, maghrib: 4, midnight: "Jafari" },
    },
  };

  let defaultParams = {
    maghrib: "0 min",
    midnight: "Standard",
  };

  let setting = {
    imsak: "10 min",
    dhuhr: "0 min",
    asr: "Standard",
    highLats: "NightMiddle",
  };

  let timeFormat = "24h";
  let timeSuffixes = ["am", "pm"];
  let invalidTime = "-----";

  let offset = {};

  let lat, lng, elv, timeZone, jDate, givenDate;

  let defParams = defaultParams;
  for (let i in methods) {
    let params = methods[i].params;
    for (let j in defParams)
      if (typeof params[j] == "undefined") params[j] = defParams[j];
  }

  let params = methods[calcMethod].params;
  for (let id in params) setting[id] = params[id];

  for (let i in timeNames) offset[i] = 0;

  //----------------------- Public Functions ------------------------

  // set calculation method
  PrayerTimes.setMethod = function (method) {
    if (methods[method]) {
      this.adjust(methods[method].params);
      calcMethod = method;
    }
  };

  // set calculating parameters
  PrayerTimes.adjust = function (params) {
    for (let id in params) setting[id] = params[id];
  };

  // set time offsets
  PrayerTimes.tune = function (timeOffsets) {
    for (let i in timeOffsets) offset[i] = timeOffsets[i];
  };

  // get current calculation method
  PrayerTimes.getMethod = function () {
    return calcMethod;
  };

  // get current setting
  PrayerTimes.getSetting = function () {
    return setting;
  };

  // get current time offsets
  PrayerTimes.getOffsets = function () {
    return offset;
  };

  // get default calc parametrs
  PrayerTimes.getDefaults = function () {
    return methods;
  };

  // return prayer times for a given date
  PrayerTimes.getTimes = function (date, coords, timezone, dst, format) {
    lat = coords[0];
    lng = coords[1];
    elv = coords[2] ? coords[2] : 0;
    givenDate = date;

    timeFormat = format || timeFormat;
    if (date.constructor === Date)
      date = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    if (typeof timezone == "undefined" || timezone == "auto")
      timezone = this.getTimeZone(date);
    if (typeof dst == "undefined" || dst == "auto") dst = this.getDst(date);
    timeZone = timezone + (1 * dst ? 1 : 0);
    jDate = this.julian(date[0], date[1], date[2]) - lng / (15 * 24);

    return this.computeTimes();
  };

  // compute prayer times
  PrayerTimes.computeTimes = function () {
    // default times
    let times = {
      imsak: 5,
      fajr: 5,
      sunrise: 6,
      dhuhr: 12,
      asr: 13,
      sunset: 18,
      maghrib: 18,
      isha: 18,
    };

    // main iterations
    times = this.computePrayerTimes(times);
    times = this.adjustTimes(times);

    // add midnight time
    times.midnight =
      setting.midnight == "Jafari"
        ? times.sunset + this.timeDiff(times.sunset, times.fajr) / 2
        : times.sunset + this.timeDiff(times.sunset, times.sunrise) / 2;

    return this.modifyFormats(times);
  };

  // convert float time to the given format (see timeFormats)
  PrayerTimes.getFormattedTime = function (time, format, suffixes) {
    if (isNaN(time)) return invalidTime;
    if (format == "Float") return time;
    suffixes = suffixes || timeSuffixes;

    time = DMath.fixHour(time + 0.5 / 60); // add 0.5 minutes to round
    let hours = Math.floor(time);
    let minutes = Math.floor((time - hours) * 60);
    let suffix = format == "12h" ? suffixes[hours < 12 ? 0 : 1] : "";
    let hour =
      format == "24h"
        ? this.twoDigitsFormat(hours)
        : ((hours + 12 - 1) % 12) + 1;

    let formatedTime = (
      hour +
      ":" +
      this.twoDigitsFormat(minutes) +
      (suffix ? " " + suffix : "")
    ).split(":");

    givenDate.setHours(+formatedTime[0]);
    givenDate.setMinutes(+formatedTime[1], 0);

    return { iso: givenDate, formatedTime: formatedTime.join(":") };
  };

  //---------------------- Calculation Functions -----------------------

  // compute mid-day time
  PrayerTimes.midDay = function (time) {
    let eqt = this.sunPosition(jDate + time).equation;
    let noon = DMath.fixHour(12 - eqt);
    return noon;
  };

  // compute the time at which sun reaches a specific angle below horizon
  PrayerTimes.sunAngleTime = function (angle, time, direction) {
    let decl = this.sunPosition(jDate + time).declination;
    let noon = this.midDay(time);
    let t =
      (1 / 15) *
      DMath.arccos(
        (-DMath.sin(angle) - DMath.sin(decl) * DMath.sin(lat)) /
          (DMath.cos(decl) * DMath.cos(lat))
      );
    return noon + (direction == "ccw" ? -t : t);
  };

  // compute asr time
  PrayerTimes.asrTime = function (factor, time) {
    let decl = this.sunPosition(jDate + time).declination;
    let angle = -DMath.arccot(factor + DMath.tan(Math.abs(lat - decl)));
    return this.sunAngleTime(angle, time);
  };

  // compute declination angle of sun and equation of time
  // Ref: http://aa.usno.navy.mil/faq/docs/SunApprox.php
  PrayerTimes.sunPosition = function (jd) {
    let D = jd - 2451545.0;
    let g = DMath.fixAngle(357.529 + 0.98560028 * D);
    let q = DMath.fixAngle(280.459 + 0.98564736 * D);
    let L = DMath.fixAngle(q + 1.915 * DMath.sin(g) + 0.02 * DMath.sin(2 * g));

    let R = 1.00014 - 0.01671 * DMath.cos(g) - 0.00014 * DMath.cos(2 * g);
    let e = 23.439 - 0.00000036 * D;

    let RA = DMath.arctan2(DMath.cos(e) * DMath.sin(L), DMath.cos(L)) / 15;
    let eqt = q / 15 - DMath.fixHour(RA);
    let decl = DMath.arcsin(DMath.sin(e) * DMath.sin(L));

    return { declination: decl, equation: eqt };
  };

  // convert Gregorian date to Julian day
  // Ref: Astronomical Algorithms by Jean Meeus
  PrayerTimes.julian = function (year, month, day) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    let A = Math.floor(year / 100);
    let B = 2 - A + Math.floor(A / 4);

    let JD =
      Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) +
      day +
      B -
      1524.5;
    return JD;
  };

  //---------------------- Compute Prayer Times -----------------------

  // compute prayer times at given julian date
  PrayerTimes.computePrayerTimes = function (times) {
    times = this.dayPortion(times);
    let params = setting;

    let imsak = this.sunAngleTime(this.eval(params.imsak), times.imsak, "ccw");
    let fajr = this.sunAngleTime(this.eval(params.fajr), times.fajr, "ccw");
    let sunrise = this.sunAngleTime(this.riseSetAngle(), times.sunrise, "ccw");
    let dhuhr = this.midDay(times.dhuhr);
    let asr = this.asrTime(this.asrFactor(params.asr), times.asr);
    let sunset = this.sunAngleTime(this.riseSetAngle(), times.sunset);
    let maghrib = this.sunAngleTime(this.eval(params.maghrib), times.maghrib);
    let isha = this.sunAngleTime(this.eval(params.isha), times.isha);

    return {
      imsak: imsak,
      fajr: fajr,
      sunrise: sunrise,
      dhuhr: dhuhr,
      asr: asr,
      sunset: sunset,
      maghrib: maghrib,
      isha: isha,
    };
  };

  // adjust times
  PrayerTimes.adjustTimes = function (times) {
    let params = setting;
    for (let i in times) times[i] += timeZone - lng / 15;

    if (this.isMin(params.imsak))
      times.imsak = times.fajr - this.eval(params.imsak) / 60;
    if (this.isMin(params.maghrib))
      times.maghrib = times.sunset + this.eval(params.maghrib) / 60;
    if (this.isMin(params.isha))
      times.isha = times.maghrib + this.eval(params.isha) / 60;
    times.dhuhr += this.eval(params.dhuhr) / 60;

    return times;
  };

  // get asr shadow factor
  PrayerTimes.asrFactor = function (asrParam) {
    let factor = { Standard: 1, Hanafi: 2 }[asrParam];
    return factor || this.eval(asrParam);
  };

  // return sun angle for sunset/sunrise
  PrayerTimes.riseSetAngle = function () {
    //let earthRad = 6371009; // in meters
    //let angle = DMath.arccos(earthRad/(earthRad+ elv));
    let angle = 0.0347 * Math.sqrt(elv); // an approximation
    return 0.833 + angle;
  };

  // apply offsets to the times
  PrayerTimes.tuneTimes = function (times) {
    for (let i in times) times[i] += offset[i] / 60;
    return times;
  };

  // convert times to given time format
  PrayerTimes.modifyFormats = function (times) {
    for (let i in times) times[i] = this.getFormattedTime(times[i], timeFormat);
    return times;
  };

  // the night portion used for adjusting times in higher latitudes
  PrayerTimes.nightPortion = function (angle, night) {
    let method = setting.highLats;
    let portion = 1 / 2; // MidNight
    if (method == "AngleBased") portion = (1 / 60) * angle;
    if (method == "OneSeventh") portion = 1 / 7;
    return portion * night;
  };

  // convert hours to day portions
  PrayerTimes.dayPortion = function (times) {
    for (let i in times) times[i] /= 24;
    return times;
  };

  //---------------------- Time Zone Functions -----------------------

  // get local time zone
  PrayerTimes.getTimeZone = function (date) {
    let year = date[0];
    let t1 = this.gmtOffset([year, 0, 1]);
    let t2 = this.gmtOffset([year, 6, 1]);
    return Math.min(t1, t2);
  };

  // get daylight saving for a given date
  PrayerTimes.getDst = function (date) {
    return this.gmtOffset(date) != this.getTimeZone(date);
  };

  // GMT offset for a given date
  PrayerTimes.gmtOffset = function (date) {
    let localDate = new Date(date[0], date[1] - 1, date[2], 12, 0, 0, 0);
    let GMTString = localDate.toGMTString();
    let GMTDate = new Date(
      GMTString.substring(0, GMTString.lastIndexOf(" ") - 1)
    );
    let hoursDiff = (localDate - GMTDate) / (1000 * 60 * 60);
    return hoursDiff;
  };

  //---------------------- Misc Functions -----------------------

  // convert given string into a number
  PrayerTimes.eval = function (str) {
    return (str + "").split(/[^0-9.+-]/)[0];
  };

  // detect if input contains 'min'
  PrayerTimes.isMin = function (arg) {
    return (arg + "").indexOf("min") != -1;
  };

  // compute the difference between two times
  PrayerTimes.timeDiff = function (time1, time2) {
    return DMath.fixHour(time2 - time1);
  };

  // add a leading 0 if necessary
  PrayerTimes.twoDigitsFormat = function (num) {
    return num < 10 ? "0" + num : num;
  };

  return PrayerTimes;
};

// Egypt;
// let lat = 31.223;
// let lng = 30.0355;

// Jordan Oman;
let lat = 31.95806;
let lng = 35.93528;
let times = PrayerTimes("Makkah").getTimes(new Date(), [lat, lng], 3); // Get prayers times for "today" at lat: 43, long: -80 with -5 timezone

console.log(times);
module.exports = PrayerTimes;
