const fs = require('fs');
const fn = require('./functions');
const schedule = require('node-schedule');

console.log("STARTING FIRST ROPE..");
console.log(_____________________________________________________________________________)
fn.getAdsDetail();
console.log("******************** END FIRST ROPE **********************************");




//create a schedule before continue
var secondes = "";     // (0-59) optional
var minutes = "10";     // (0-59) required
var hour = "*";         // (0-23) required
var day_of_month = "*"; // (1-31) required
var month = "*";        // (1-12) required
var day_of_week = "*";  // (0-7) required : 0 or 7 is Sun

secondes = (secondes != "")? secondes + ' ' : '';

let scrapschedule = minutes +' '+ hour +' '+ day_of_month +' '+ month +' '+ day_of_week;


var task = schedule.scheduleJob(scrapschedule, async function(){
    console.log('******************** ROPE STARTED *******************************')
    let allAds = await fn.getAdsDetail();
    console.log("******************** ROPE ENDED **********************************");
});
