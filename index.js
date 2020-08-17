const config = require('./config');
const dbconfig = require('./dbconfig');
const fs = require('fs');
const fn = require('./kiiji_scraper');
const fn2 = require('./rbq_scrapper');
const schedule = require('node-schedule');

console.log("-----------------------------------------------------------------------------");
console.log("STARTING FIRST ROPE ON " + fn.currentDateTime());
console.log("-----------------------------------------------------------------------------");
//fn.getAdsDetail();

fn2.startRbqBatch(10);


//fn2.verifyRBQ(config.config_rbq.baseSiteUrl, "5683610901").then(values => console.log(values));


//create a schedule before continue
var secondes = "";     // (0-59) optional
var minutes = "*/10";     // (0-59) required
var hour = "*";         // (0-23) required
var day_of_month = "*"; // (1-31) required
var month = "*";        // (1-12) required
var day_of_week = "*";  // (0-7) required : 0 or 7 is Sun

secondes = (secondes != "")? secondes + ' ' : '';

let scrapschedule = minutes +' '+ hour +' '+ day_of_month +' '+ month +' '+ day_of_week;

//launch the scrapping task
var task = schedule.scheduleJob(scrapschedule, async function(){
    console.log("-----------------------------------------------------------------------------");
    console.log("ROPE SARTED ON " + fn.currentDateTime());
    console.log("-----------------------------------------------------------------------------");
    //let allAds = await fn.getAdsDetail();

});