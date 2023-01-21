Date.prototype.getDayOfYear = function () {
  const now = this;
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day;
};

const julianDate = `${new Date("2023-04-21")
  .getFullYear()
  .toString()
  .slice(2)}${new Date("2023-04-21").getDayOfYear() > 99 ? "" : 0}${new Date(
  "2023-04-21"
).getDayOfYear()}`;

console.log(julianDate);
