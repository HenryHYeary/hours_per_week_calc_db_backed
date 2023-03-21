// const Strategy = require('./strategies')

// let strat1Args = [
//   "Original Strategy",
//   "2022-09-24",
//   "2023-10-1",
//   1200,
//   40,
//   6,
// ]

// let strat1 = new Strategy(...strat1Args);

// let strat2Args = [
//   "Alternate Strategy",
//   "2023-3-15",
//   "2024-1-15",
//   1200,
//   30,
//   5,
// ];

// let strat2 = new Strategy(...strat2Args);


// let strats = [
//   strat1,
//   strat2,
// ];

// module.exports = strats;

const nextId = require('./next-id');

module.exports = [
  {
    id: nextId(),
    stratTitle: "My Strategy",
    startDate: new Date("2022-01-15"),
    targetDate: new Date ("2024-01-15"),
    hoursLeft: 1200,
    vacationDays: 40,
    daysToWork: 5,
    stringStartDate: "2022-01-15",
    stringTargetDate: "2024-01-15",
    hoursPerDay: 2.50
  },
  {
    id: nextId(),
    stratTitle: "Alternate Strategy",
    startDate: new Date("2021-01-15"),
    targetDate: new Date("2024-05-22"),
    hoursLeft: 1200,
    vacationDays: 30,
    daysToWork: 6,
    stringStartDate: "2021-01-15",
    stringTargetDate: "2024-01-15",
    hoursPerDay: 1.18
  }
];