let nextId = require('./next-id');

class Strategy {
  constructor(title, startDate = "01/02/2022", targetDate = "01/02/2022", hoursLeft, vacationDays, daysToWork) {
    this.id = nextId();
    this.stratTitle = title;
    this.startDate = new Date(startDate);
    this.targetDate = new Date(targetDate);
    this.hoursLeft = hoursLeft;
    this.vacationDays = vacationDays;
    this.daysToWork = daysToWork;
    this.stringStartDate = Strategy.dateObjToStr(this.startDate);
    this.stringTargetDate = Strategy.dateObjToStr(this.targetDate);
  }

  static makeStrategy(rawStrat) {
    let { id, stratTitle, startDate, targetDate, hoursLeft,
        vacationDays, daysToWork, stringStartDate, stringTargetDate, hoursPerDay } = rawStrat;
    return Object.assign(new Strategy(), {
      id,
      stratTitle,
      startDate: new Date(startDate),
      targetDate: new Date(targetDate),
      hoursLeft: Number(hoursLeft),
      vacationDays: Number(vacationDays),
      daysToWork: Number(daysToWork),
      stringStartDate,
      stringTargetDate,
      hoursPerDay
    });
  }

  static dateObjToStr(date) {
    return date.toISOString().split('T')[0];
  }

  setStratTitle(stratTitle) {
    this.stratTitle = stratTitle;
  }

  setHoursLeft(hoursLeft) {
    this.hoursLeft = hoursLeft;
  }

  setVacationDays(vacationDays) {
    this.vacationDays = vacationDays;
  }

  setDaysToWork(daysToWork) {
    this.daysToWork = daysToWork;
  }

  setStartDate(dateStr) {
    this.startDate = new Date(dateStr);
    this.stringStartDate = Strategy.dateObjToStr(this.startDate);
  }

  setTargetDate(dateStr) {
    this.targetDate = new Date(dateStr);
    this.stringTargetDate = Strategy.dateObjToStr(this.targetDate);
  }

  setHoursNeededPerDay() {
    const MS_IN_WEEK = 1000 * 60 * 60 * 24 * 7;
    let weeksDiff = Math.round(Math.abs(this.targetDate - this.startDate)/ MS_IN_WEEK);
    let diffInWorkableDays = (this.daysToWork * weeksDiff) - this.vacationDays;
    let hoursPerDay = (this.hoursLeft / diffInWorkableDays).toFixed(2);

    this.hoursPerDay = hoursPerDay;
  }
}

module.exports = Strategy;