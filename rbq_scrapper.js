const puppeteer = require('puppeteer');
const config = require('./config');
const dbconfig = require('./dbconfig');
var mysql = require('mysql2/promise');
const { forEach, find } = require('lodash');

verifyRBQ = async (url, rbq_number) =>{

    // 1- Load the first url and jquery librairy
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(10000);
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.5.1.min.js'});
    
    let rbq = rbq_number;

    if(rbq !== undefined){
        rbq = rbq.replace(/\D/g, "").replace(/\s/g,"");
        
        if(rbq.length != 10){
            console.log('Wrong rbq format: ' + rbq);       
        }else{
            // Put the focus in the RBQ license field
            await page.focus("#noLicence");
        
            // Type in the rbq number 
            await page.keyboard.type(rbq);  
            
            try{
                // then click the submit button
                // wait for the browser to complete the request.
                // and pass the result to result variable
                await Promise.all([
                        page.click("#wrapper > div > div > form > fieldset > div > button"),
                        page.waitForNavigation({ waitUntil: 'networkidle0' }),
                ]);
            }catch(err){
                return {'error': {'type':'connect', 'message':"Connection timed out while verifying rbq number : " + rbq + ". Verify the number and try again later"}}
            }            
        }

        result = await page.evaluate(() => {
            return $("#wrapper > div > div > div.resume-fiche").length;
        })

        // Test the result and return the outcome.
        if(result !== undefined){
            switch(result){
            case 0:
                return {'error': {'type':'nomatch', 'message':'The rbq number : ' + rbq + ' was not found in our database'}};
            case 1:
                return {'success':'rbq number : ' + rbq + ' has been found!'};
            default:
                return {'error': {'type':'unknown', 'message':"unknown error while verifying rbq number : " + rbq + " Try again later"}};
            }
        }
    }else{
        return {'error':'RBQ number cannot be empty'};
    }
}

module.exports.startRbqBatch = async (limit) => {
    // create the connection
    const connection = await mysql.createConnection(dbconfig.srv5);
    // query database
    const [rows, fields] = await connection.execute("SELECT uid, rbq, rbq_exp FROM sr_contractor WHERE active = 'yes' AND verified = 'yes' AND (rbq != null OR rbq != '') LIMIT ?", [limit]);
    
    for(let i=0;i<rows.length;i++){
        let result = await verifyRBQ(config.config_rbq.baseSiteUrl, rows[i].rbq);
        console.log(result);
    }
 
}
