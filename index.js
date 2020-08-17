const config = require('./config');
const dbconfig = require('./dbconfig');
const fs = require('fs');
const fn = require('./kijiji_scraper');
const schedule = require('node-schedule');

console.log("-----------------------------------------------------------------------------");
console.log("STARTING FIRST ROPE ON " + fn.currentDateTime());
console.log("-----------------------------------------------------------------------------");

// start first rope immediately calling getAdsDetail()
fn.getAdsDetail();

//create a schedule before continue
var secondes = "";     // (0-59) optional
var minutes = "*/10";     // (0-59) required
var hour = "*";         // (0-23) required
var day_of_month = "*"; // (1-31) required
var month = "*";        // (1-12) required
var day_of_week = "*";  // (0-7) required : 0 or 7 is Sun

secondes = (secondes != "")? secondes + ' ' : '';

let scrapschedule = minutes +' '+ hour +' '+ day_of_month +' '+ month +' '+ day_of_week;

//launch the remaining ropes every 5 minues
var task = schedule.scheduleJob(scrapschedule, async function(){
    console.log("-----------------------------------------------------------------------------");
    console.log("ROPE SARTED ON " + fn.currentDateTime());
    console.log("-----------------------------------------------------------------------------");
    
    await fn.getAdsDetail();

});