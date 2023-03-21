const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const SessionPersistence = require("./lib/session-persistence");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000,
    path: "/",
    secure: false,
  },
  name: "hours-per-week-calc-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.store = new SessionPersistence(req.session);
  next();
})

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/strategies");
})

app.get("/strategies", (req, res) => {
    res.render("strategies", {
      strats: res.locals.store.getSortedStrategies()
    });
});

app.get("/strategies/new", (req, res) => {
  res.render("new-strategy");
});

app.post("/strategies",
  [
    body("stratTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters."),
    body("startDate")
      .trim()
      .isLength({ min: 1 })
      .withMessage("A start date is required.")
      .isDate()
      .withMessage("Start Date must be in YYYY/MM/DD format."),
    body("targetDate")
      .trim()
      .isLength({ min: 1 })
      .withMessage("A target date is required.")
      .isDate()
      .withMessage("Target Date must be in YYYY/MM/DD format."),
    body("hoursLeft")
      .trim()
      .isInt()
      .withMessage("Number of hours must be a positive integer"),
    body("vacationDays")
      .trim()
      .isInt()
      .withMessage("Number of vacation days must be a positive integer."),
    body("daysToWork")
      .trim()
      .isInt({ min: 1, max: 7 })
      .withMessage("Days planned to work per week must be a positive integer between 1 and 7.")
  ],
  (req, res) => {
    let { stratTitle, targetDate, startDate, hoursLeft, vacationDays, daysToWork } = req.body;
    let store = res.locals.store;

    const rerenderNewStrat = () => {
      res.render("new-strategy", {
        stratTitle,
        targetDate,
        startDate,
        hoursLeft,
        vacationDays,
        daysToWork,
        flash: req.flash(),
      })
    }

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderNewStrat();
    } else if (store.matchingStratTitle(req.body.stratTitle)) {
      req.flash("error", "The strategy title must be unique.");
      rerenderNewStrat();
    } else {
      let body = req.body;
      let argArr = [
        body.stratTitle,
        body.startDate,
        body.targetDate,
        Number(body.hoursLeft),
        Number(body.vacationDays),
        Number(body.daysToWork),
      ];
      let created = res.locals.store.createStrategy(...argArr);
      if (!created) {
        next(new Error("Failed to create new strategy."));
      } else {
        req.flash("success", "The strategy has been created.");
        res.redirect("/strategies");
      }
    }
});

app.get("/strategies/:stratId", (req, res, next) => {
  let stratId = req.params.stratId;
  let strat = res.locals.store.loadStrategy(+stratId, req.session.strats);
  // strat.setHoursNeededPerDay();
  if (!strat) {
    next(new Error("Not found."));
  } else {
    res.locals.store.setHoursNeededPerDay(+stratId);
    res.render("strategy", {
      strat,
    });
  }
});

app.get("/strategies/:stratId/edit", (req, res, next) => {
  let stratId = req.params.stratId;
  let strat = res.locals.store.loadStrategy(+stratId, req.session.strats);
  if (!strat) {
    next(new Error("Not found."));
  } else {
    res.render("edit-strategy", { strat });
  }
});

app.post("/strategies/:stratId/destroy", (req, res, next) => {
  let stratId = req.params.stratId;
  let deleted = res.locals.store.deleteStrategy(+stratId, req.session.strats);
  if (!deleted) {
    next(new Error("Not found."));
  } else {
    req.flash("success", "Strategy deleted.");
    res.redirect("/strategies");
  }
});

app.post("/strategies/:stratId/edit",
  [
    body("stratTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters."),
    body("startDate")
      .trim()
      .isLength({ min: 1 })
      .withMessage("A start date is required.")
      .isDate()
      .withMessage("Start Date must be in YYYY/MM/DD format."),
    body("targetDate")
      .trim()
      .isLength({ min: 1 })
      .withMessage("A target date is required.")
      .isDate()
      .withMessage("Target Date must be in YYYY/MM/DD format."),
    body("hoursLeft")
      .trim()
      .isInt()
      .withMessage("Number of hours must be a positive integer"),
    body("vacationDays")
      .trim()
      .isInt()
      .withMessage("Number of vacation days must be a positive integer."),
    body("daysToWork")
      .trim()
      .isInt({ min: 1, max: 7 })
      .withMessage("Days planned to work per week must be a positive integer between 1 and 7.")
  ],
  (req, res, next) => {
    let stratId = req.params.stratId;
    let { stratTitle, startDate, targetDate, hoursLeft, vacationDays, daysToWork } = req.body;
    let store = res.locals.store;

    rerenderEditStrat = () => {
      let strat = store.loadStrategy(+stratId);
      if (!strat) {
        next(new Error("Not found."));
      } else {
        res.render("edit-strategy", {
          strat,
          stratTitle,
          targetDate,
          startDate,
          hoursLeft,
          vacationDays,
          daysToWork,
          flash: req.flash(),
        });
      }
    };

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderEditStrat();
    } else if (store.matchingStratTitle(stratTitle)) {
      req.flash("error", "The list title must be unique.");
      rerenderEditStrat();
    } else {
      res.locals.store.setStratTitle(+stratId, stratTitle);
      res.locals.store.setStartDate(+stratId, startDate);
      res.locals.store.setTargetDate(+stratId, targetDate);
      res.locals.store.setHoursLeft(+stratId, Number(hoursLeft));
      res.locals.store.setVacationDays(+stratId, Number(vacationDays));
      res.locals.store.setDaysToWork(+stratId, Number(daysToWork));
      res.locals.store.setHoursNeededPerDay(+stratId);
      req.flash("success", "The strategy has been updated.");
      res.redirect(`/strategies/${stratId}`);
    }
});

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});


app.listen(port, host, () => {
  console.log(`Hours Per Week Calculator is listening on port ${port} of ${host}!`);
});