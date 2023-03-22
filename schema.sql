CREATE TABLE strategies (
  id serial PRIMARY KEY,
  strat_title text NOT NULL UNIQUE,
  start_date timestamp NOT NULL,
  target_date timestamp NOT NULL,
  hours_left int NOT NULL,
  vacation_days int NOT NULL,
  days_to_work int NOT NULL,
  string_start_date text NOT NULL,
  string_target_date text NOT NULL,
  hours_per_day decimal(4, 2)
);