const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
// const SessionPersistence = require("./lib/session-persistence");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");

// change property names in edit-list view when switching between session persistence
// and pg persistence to ensure the page displays correctly. More info found in modules and in README.

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
  res.locals.store = new PgPersistence(req.session);
  next();
});

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/strategies");
})

// Render strategy list sorted alphabetically
app.get("/strategies", catchError(async (req, res) => {
    res.render("strategies", {
      strats: await res.locals.store.getSortedStrategies()
    });
  })
);

app.get("/strategies/new", (req, res) => {
  res.render("new-strategy");
});

// Render individual strategy
app.get("/strategies/:stratId", 
  catchError(async (req, res) => {
    let stratId = req.params.stratId;
    let strat = await res.locals.store.loadStrategy(+stratId);
    if (!strat) throw new Error("Not found.");
    await res.locals.store.setHoursNeededPerDay(+stratId);
    res.render("strategy", {
      strat,
    });
  })
);

// Create new strategy
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
  catchError(async (req, res) => {
    let { stratTitle, targetDate, startDate, hoursLeft, vacationDays, daysToWork } = req.body;
    let store = res.locals.store;

    const rerenderNewStrat = async () => {
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
    } else if (await store.matchingStratTitle(req.body.stratTitle)) {
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
      let created = await res.locals.store.createStrategy(...argArr);
      if (!created) throw new Error ("Failed to create new strategy.")
      let stratId = await store.findIdByTitle(stratTitle);
      setTimeout(() => {
        store.setHoursNeededPerDay(+stratId);
      }, 20);
      await store.setHoursNeededPerDay(+stratId);
      req.flash("success", "The strategy has been created.");
      res.redirect("/strategies");
    }
  })
);

// Render edit strategy page
app.get("/strategies/:stratId/edit", 
  catchError(async(req, res, next) => {
    let stratId = req.params.stratId;
    let strat = await res.locals.store.loadStrategy(+stratId);
    if (!strat) throw new Error("Not found.");
    res.render("edit-strategy", { strat });
  })
);

// Delete strategy
app.post("/strategies/:stratId/destroy", 
  catchError(async (req, res) => {
    let stratId = req.params.stratId;
    let deleted = await res.locals.store.deleteStrategy(+stratId);
    if (!deleted) throw new Error("Not found.");
    req.flash("success", "Strategy deleted.");
    res.redirect("/strategies");
  })
);

// Edit strategy
app.post("/strategies/:stratId/edit",
  [
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
  catchError(async(req, res, next) => {
    let stratId = req.params.stratId;
    let { startDate, targetDate, hoursLeft, vacationDays, daysToWork } = req.body;
    let store = res.locals.store;

    rerenderEditStrat = async () => {
      let strat = store.loadStrategy(+stratId);
      if (!strat) {
        next(new Error("Not found."));
      } else {
        res.render("edit-strategy", {
          strat,
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
      await rerenderEditStrat();
    } else {
      await res.locals.store.setStartDate(+stratId, startDate);
      await res.locals.store.setTargetDate(+stratId, targetDate);
      await res.locals.store.setHoursLeft(+stratId, Number(hoursLeft));
      await res.locals.store.setVacationDays(+stratId, Number(vacationDays));
      await res.locals.store.setDaysToWork(+stratId, Number(daysToWork));
      await store.setHoursNeededPerDay(+stratId);
      req.flash("success", "The strategy has been updated.");
      res.redirect(`/strategies/${stratId}`);
    }
  })
);

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});


app.listen(port, host, () => {
  console.log(`Hours Per Week Calculator is listening on port ${port} of ${host}!`);
});