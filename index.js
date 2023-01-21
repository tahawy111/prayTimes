Date.prototype.getDayOfYear = function () {
  const now = this;
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day;
};
Date.prototype.getJulianDate = function () {
  return +`${this.getFullYear().toString().slice(2)}${
    this.getDayOfYear() > 99 ? "" : 0
  }${this.getDayOfYear()}`;
};

// const DMath = {
//   dtr(d) {
//     // From degrees to radians
//     return (d * Math.PI) / 180.0;
//   },
//   rtd(r) {
//     // From radians to degrees
//     return (r * 180.0) / Math.PI;
//   },
//   sin(d) {
//     return Math.sin(this.dtr(d));
//   },
//   cos(d) {
//     return Math.cos(this.dtr(d));
//   },
//   tan(d) {
//     return Math.tan(this.dtr(d));
//   },
//   arcsin(d) {
//     return this.rtd(Math.asin(d));
//   },
//   arccos(d) {
//     return this.rtd(Math.acos(d));
//   },
//   arctan(d) {
//     return this.rtd(Math.atan(d));
//   },
//   arccot(x) {
//     return this.rtd(Math.atan(1 / x));
//   },
//   arctan2(y, x) {
//     return this.rtd(Math.atan2(y, x));
//   },
//   fixAngle(a) {
//     return this.fix(a, 360);
//   },
//   fixHour(a) {
//     return this.fix(a, 24);
//   },
//   fix(a, b) {
//     a = a - b * Math.floor(a / b);
//     return a < 0 ? a + b : a;
//   },
// };

// const d = new Date().getJulianDate() - 2451545.0;
// const g = 357.529 + 0.98560028 * d;
// const q = 280.459 + 0.98564736 * d;
// const L = q + 1.915 * DMath.sin(g) + 0.02 * DMath.sin(2 * g);

// const R = 1.00014 - 0.01671 * DMath.cos(g) - 0.00014 * DMath.cos(2 * g);
// const e = 23.439 - 0.00000036 * d;
// const RA = DMath.arctan2(DMath.cos(e) * DMath.sin(L), DMath.cos(L)) / 15;

// const D = DMath.arcsin(DMath.sin(e) * DMath.sin(L)); // declination of the Sun

// const EqT = q / 15 - RA; // equation of time

// const getTimeZoneNumStr =
//   new Date().getTimezoneOffset() / (new Date().getTimezoneOffset() / 2);

// const Dhuhr = 12 + new Date().getTimezoneOffset() - 30.0355 / (15 - EqT);

// console.log(new Date().getTimezoneOffset());

const date = new Date();

const month = date.getMonth() + 1;

const D =
  367 * date.getFullYear() -
  Number((7 / 4) * (date.getFullYear() + Number((month + 9) / 12))) +
  Number(275 * (month / 9)) +
  date.getDate() -
  730531.5;

const L = 280.461 + 0.9856474 * D;

const M = 357.528 + 0.9856003 * D;

const Lambda = L + 1.915 * Math.sin(M) + 0.02 * Math.sin(2 * M);

const Obliquity = 23.439 - 0.0000004 * D;

let Alpha = Math.atan(Math.cos(Obliquity) * Math.tan(Lambda));

Alpha = Alpha - 360 * Number(Alpha / 360);

Alpha = Alpha + 90 * (Math.trunc(Alpha / 90) - Math.trunc(Alpha / 90));

const ST = 100.46 + 0.985647352 * D;

const Dec = Math.asin(Math.sin(Obliquity) * Math.sin(Lambda));

const Noon = Alpha - ST;
let Long = 30.0355;
let Lat = 31.223;
const UtNoon = Noon - Long;

const LocalNoon = UtNoon / 15 + new Date().getTimezoneOffset();

const AsrAlt = Math.atan(1 + Math.tan(Lat - Dec));

let AsrArc = Math.acos(
  (Math.sin(90 - +AsrAlt) - Math.sin(+Dec) * Math.sin(+Lat)) /
    (Math.cos(+Dec) * Math.cos(+Lat))
);

// AsrArc = AsrArc / 15;

let AsrTime = LocalNoon + AsrArc;

console.log(AsrArc);
