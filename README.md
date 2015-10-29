# TJA Vis
Visualize the results from the TJA application process

### Note regarding data
All data has been sanitized. In order to run the cleaning process, though, you will need to reconfigure some aspects of the Excel file. Namely, you will first want to rename all the column titles. As you can see in the below, I have done just that. You will also notice some column titles are missing. Those not shown in the below have been removed. Some of the ones removed include, for example, the unique id that Screndoor used and the individual scores columns.

`number`, `name`, `email`, `status`, `submitted`, `updated`, `phone`, `address`, `dob`, `sex`, `race`, `ethnicity`, `resume`, `linkedin`, `github`, `education`, `legal`, `employment`, `wages`, `exposure`, `prior_training`, `training_loc`, `experience`, `support_strategy`, `other_commitments`, `schedule_adjustments`, `plans_post`, `problem_solving_essay`, `pipeline`, `pipeline_source`, `veteran`, `veteran_spouse`, `home_computer`, `home_internet`, `applied_other`, `applied_other_details`, `avail_math`, `avail_mta`, `challenges`, `avg_score`, `score_explanations`

Once you have renamed the Excel column names, you can then go ahead and export the Excel file as a CSV. Once the file has been exported as a CSV it is "ready to go." Make sure to name that exported CSV file `responses.csv`.

### Bing API
Before cleaning the CSV into a JSON, you will need a Bing API key that will be stored in a file in the root of your local version of this repository called `creds.js` (for "credentials"). It should look like `module.exports = { bingkey: 'xxxxxxxxxx' }`, except that `xxxxxxxxxx` is your Bing API key. Go here (https://www.bingmapsportal.com/) to get a Bing Maps API key with your email address and put that string value in place of the `x`'s.

### How to clean the CSV
To clean the CSV and write out a JSON, `cd` to the root folder of this git repo once it has been cloned onto your desktop. Run `npm install` and then, when complete, rune `node jsonize.js`. Once you have completed that, go ahead and run `node anonJSON.js`. This will keep only the "nonsensitive" portions of the data. Each user at this point will be reduced to an object with key and value pairs that could not identify them. Once we have done that we can easily host `index.html` locally. To do so, just run `python -m SimpleHTTPServer 8080` and point your browser to `http://localhost:8080/`. It should bring up the map, etc. just as you can see online here: `http://kuanbutts.com/tja_vis/`.

