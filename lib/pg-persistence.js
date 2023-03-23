const { dbQuery } = require('./db-query');

// note this module uses snake case while session persistence uses camel
// case, make sure to update the edit-list view to the correct property names when
// switching back and forth for pre-filled fields. Refer to README.md for more details.

module.exports = class PgPersistence {
  async getSortedStrategies() {
    const ALL_STRATEGIES = "SELECT * FROM strategies ORDER BY lower(strat_title) ASC";

    let result = await dbQuery(ALL_STRATEGIES);
    return result.rows;
  }

  async createStrategy(stratTitle, startDate, targetDate, hoursLeft,
    vacationDays, daysToWork) {
    let stringStartDate = String(startDate);
    let stringTargetDate = String(targetDate);
    const CREATE_STRATEGY = "INSERT INTO strategies (strat_title, start_date, target_date, "
                            + "hours_left, vacation_days, days_to_work, string_start_date, string_target_date) "
                            + "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";

    let result = await dbQuery(CREATE_STRATEGY, stratTitle, startDate, targetDate, hoursLeft, vacationDays,
                              daysToWork, stringStartDate, stringTargetDate);
    
    return result.rowCount > 0;
  }

  async findIdByTitle(stratTitle) {
    const ID_BY_TITLE = "SELECT id FROM strategies WHERE strat_title = $1";

    let result = await dbQuery(ID_BY_TITLE, stratTitle);
    return result.rows[0].id;
  }

  async setHoursNeededPerDay(stratId) {
    const SET_HOURS_NEEDED = "UPDATE strategies SET hours_per_day = hours_left / (((EXTRACT (EPOCH FROM (target_date - start_date)) / $1) * days_to_work) - vacation_days) WHERE id = $2";

    const SECONDS_IN_WEEK = 60 * 60 * 24 * 7;
  
    let result = await dbQuery(SET_HOURS_NEEDED, SECONDS_IN_WEEK, stratId);
    return result.rowCount > 0;
  }

  async loadStrategy(stratId) {
    const SELECT_STRATEGY = "SELECT * FROM strategies WHERE id = $1";

    let result = await dbQuery(SELECT_STRATEGY, stratId);
    let strategy = result.rows[0];
    if (!strategy) return undefined;

    return strategy;
  }

  async deleteStrategy(stratId) {
    const DELETE_STRATEGY = "DELETE FROM strategies WHERE id = $1";

    let result = await dbQuery(DELETE_STRATEGY, stratId);
    return result.rowCount > 0;
  }

  async setStratTitle(stratId, stratTitle) {
    const SET_STRAT_TITLE = "UPDATE strategies SET strat_title = $1 WHERE id = $2";

    let result = await dbQuery(SET_STRAT_TITLE, stratTitle, stratId);
    return result.rowCount > 0;
  }

  async setStartDate(stratId, dateStr) {
    let stringStartDate = dateStr;
    const SET_START_DATE = "UPDATE strategies SET start_date = $1, string_start_date = $2 WHERE id = $3";

    let result = await dbQuery(SET_START_DATE, dateStr, stringStartDate, stratId);
    return result.rowCount > 0;
  }

  async setTargetDate(stratId, dateStr) {
    let stringTargetDate = dateStr
    const SET_TARGET_DATE = "UPDATE strategies SET target_date = $1, string_target_date = $2 WHERE id = $3";

    let result = await dbQuery(SET_TARGET_DATE, dateStr, stringTargetDate, stratId);
    return result.rowCount > 0;
  }

  async setHoursLeft(stratId, hoursLeft) {
    const SET_HOURS_LEFT = "UPDATE strategies SET hours_left = $1 WHERE id = $2";

    let result = await dbQuery(SET_HOURS_LEFT, hoursLeft, stratId);
    return result.rowCount > 0;
  }

  async setVacationDays(stratId, vacationDays) {
    const SET_VACATION_DAYS = "UPDATE strategies SET vacation_days = $1 WHERE id = $2";

    let result = await dbQuery(SET_VACATION_DAYS, vacationDays, stratId);
    return result.rowCount > 0;
  }

  async setDaysToWork(stratId, daysToWork) {
    const SET_DAYS_TO_WORK = "UPDATE strategies SET days_to_work = $1 WHERE id = $2";

    let result = await dbQuery(SET_DAYS_TO_WORK, daysToWork, stratId);
    return result.rowCount > 0;
  }

  async matchingStratTitle(stratTitle) {
    const CHECK_EXISTING_STRAT_TITLE = "SELECT null FROM strategies WHERE strat_title = $1";

    let result = await dbQuery(CHECK_EXISTING_STRAT_TITLE, stratTitle);
    return result.rowCount > 0;
  }
};