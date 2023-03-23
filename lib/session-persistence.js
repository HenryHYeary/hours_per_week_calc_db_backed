// const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const nextId = require("./next-id");

// note this module uses camel case while pg persistence uses snake
// case, make sure to update the edit-list view to the correct property names when
// switching back and forth for prefilled fields. Refer to README for more details.

module.exports = class SessionPersistence {
  constructor(session) {
    this._strats = session.strats || deepCopy(SeedData);
    session.strats = this._strats;
  }

  getSortedStrategies() {
    return this._strats.slice().sort((stratA, stratB) => {
      let titleA = stratA.stratTitle.toLowerCase();
      let titleB = stratB.stratTitle.toLowerCase();

      if (titleA < titleB) {
        return -1;
      } else if (titleA > titleB) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  createStrategy(stratTitle, startDate, targetDate, hoursLeft,
    vacationDays, daysToWork) {
    let strat = {
      id: nextId(),
      stratTitle,
      startDate: new Date(startDate),
      targetDate: new Date(targetDate),
      hoursLeft: Number(hoursLeft),
      vacationDays: Number(vacationDays),
      daysToWork: Number(daysToWork),
      stringStartDate: startDate,
      stringTargetDate: targetDate,
    }

    this._strats.push(strat);

    return true;
  }

  setHoursNeededPerDay(stratId) {
    let strat = this._findStrategy(stratId);
    let startDate = new Date(strat.stringStartDate);
    let targetDate = new Date(strat.stringTargetDate);

    const MS_IN_WEEK = 1000 * 60 * 60 * 24 * 7;
    let weeksDiff = Math.round(Math.abs(targetDate - startDate) / MS_IN_WEEK);
    let diffInWorkableDays = (strat.daysToWork * weeksDiff) - strat.vacationDays;
    let hoursPerDay = (strat.hoursLeft / diffInWorkableDays).toFixed(2);

    strat.hoursPerDay = hoursPerDay;
  }

  loadStrategy(stratId) {
    let strat = this._findStrategy(stratId);

    return deepCopy(strat);
  }

  _findStrategy(stratId) {
    return this._strats.find(strat => strat.id === stratId);
  }

  findIdByTitle(stratTitle) {
    let strat = this._strats.find(strat => stratTitle === strat.stratTitle);
    return strat.id;
  }

  deleteStrategy(stratId) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    let stratIndex = this._strats.indexOf(strat);

    this._strats.splice(stratIndex, 1);
    return true;
  }

  setStratTitle(stratId, stratTitle) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.stratTitle = stratTitle;
    return true;
  }

  setStartDate(stratId, dateStr) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.startDate = new Date(dateStr);
    strat.stringStartDate = this._dateObjToStr(strat.startDate);
    return true;
  }

  setTargetDate(stratId, dateStr) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.targetDate = new Date(dateStr);
    strat.stringTargetDate = this._dateObjToStr(strat.targetDate);
    return true;
  }

  setHoursLeft(stratId, hoursLeft) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.hoursLeft = hoursLeft;
    return true;
  }

  setVacationDays(stratId, vacationDays) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.vacationDays = vacationDays;
    return true;
  }

  setDaysToWork(stratId, daysToWork) {
    let strat = this._findStrategy(stratId);
    if (!strat) return false;
    strat.daysToWork = daysToWork;
    return true;
  }

  matchingStratTitle(stratTitle) {
    return this._strats.some(strat => strat.stratTitle === stratTitle);
  }

  _dateObjToStr(date) {
    return date.toISOString().split('T')[0];
  }
};