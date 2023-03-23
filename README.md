This application is meant to calculate the hours needed per day to achieve your study goals. 

Multiple strategies can be created from the main list view and strategies can be customized or deleted based on your preference.

To launch the application, please run 'npm install' followed by 'npm start' in the terminal and then connect to http://localhost:3000 in your browser.

The CSS is pretty rudimentary but the applicaiton itself should function properly and give you an accurate number of hours to study per day to achieve your goals by a certain date.

This version of the hours per week calculator uses a PostgreSQL database to persist data. Make sure to update client information in lib/db-query for your machine/OS. Unix-like systems should be able to function with only a database field, while Windows systems using WSL2 will need the additional fields provided in this version of db-query. Make sure to always have the name of the database set as "strategies".

A session persistence module is also available to use (commented out in the hours_per_week_db_backed.js file), and note that you will need to update the property names on the right side of the OR (||) conditionals in views/edit-list.pug to use camel case instead of the current snake case. If you elect not to change the property names fields will not be prefilled with their previous values when editing.
 
For an already set up No-SQL session persistence version of this application please refer to this link: https://github.com/HenryHYeary/hours_per_week_calculator.