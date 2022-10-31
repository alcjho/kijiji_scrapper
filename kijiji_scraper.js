const puppeteer = require('puppeteer');
const config = require('./config');
const dbconfig = require('./dbconfig');
const siteRoot = "https://kijiji.ca";
var mysql = require('mysql2/promise');
const { forEach, find } = require('lodash');
const extractor = require('libphonenumber-js');
const Timeout = require('await-timeout');

const pool = mysql.createPool(dbconfig.srv5);
const languages = require('./languages.json');
const default_lg = 'fr';

let ads = [{}];
let adsDetail = [{}];
let numlang = 1;
let lg = default_lg;


/**
 * 
 * @param {*} url 
 */
const loadSiteData = async (url) => {
    if(!url)
    return

   // 1- Load the first url and jquery librairy
   const browser = await puppeteer.launch({headless: true, args:['--no-sandbox', 'disabled-setuid-sandbox']});
   const page = await browser.newPage();
   await page.setDefaultNavigationTimeout(10000);
   
   try{
        await page.goto(url, {waitUntil: 'domcontentloaded'});
        await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.5.1.min.js'});
   }catch(err){
        console.log("There is an error: ", err);
   }

   return {page, browser};
}

/**
 * 
 */
const getAdsDetail = async (limit) => {

    const {page, browser} = await loadSiteData(config.config.baseSiteUrl);
    
    const links_array = await page.$$('.regular-ad');
    
    urls = [];
    data = [];
    let progress = '|';

    limit = limit?limit:links_array.length;
    for (i=0;i<limit;i++){
        const href =  await links_array[i].$eval('.title', el => el.getAttribute('href'));
        const brief_desc =  await links_array[i].$eval('.title', el => el.textContent);
        urls.push({'url': href, 'desc': brief_desc});
    }

    for(i=0;i<=urls.length;i++){
        jsonrow = {};

        try{
            if(urls[i]){
                await page.goto(siteRoot + urls[i].url, {waitUntil: 'domcontentloaded'});
                await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.5.1.min.js'});
                
                // get add id from current link
                let ad_id = urls[i].url.split('/')[urls[i].url.split('/').length - 1];
                jsonrow.id = ad_id;

                // fetch description and extract phone number first
                let description = await page.$eval('[class^=descriptionContainer]', el => el.textContent);
                if(description != undefined && description != null){             
                    let phoneData = extractor.findNumbers(description, "CA");
                    jsonrow.description = urls[i].desc;
                    jsonrow.phone1='';
                    jsonrow.phone2='';
                    
                    if(phoneData[0] !== undefined){
                        jsonrow.phone1 = phoneData[0].phone;
                    }
                
                    if(phoneData[1] !== undefined && jsonrow.phone1 != phoneData[1].phone){
                        jsonrow.phone2 = phoneData[1].phone;
                    }

                    emails = (extractEmails(description) != null)? extractEmails(description).join(','):'';
                    jsonrow.email = emails;
                    
                }
                
                if((jsonrow.phone1 == "") && (jsonrow.phone2 == "")){
                    continue;
                }

                let province_el = (await page.$eval('[class^=address-]', el => el.textContent));
                let address = province_el;
                let province_arr = address.split(', ');

                jsonrow.address = address;
                let province = province_arr[province_arr.length - 2];
                if(province.indexOf(' ') !== -1){
                    jsonrow.zip = (province.split(' ')[1]?province.split(' ')[1]:'') + (province.split(' ')[2]?(' '+province.split(' ')[2]):'');
                    province = province.split(' ')[0]
                }
                jsonrow.province = province;

                //continue execution only if there is at least one phone number
                let crumbItems = await page.$$('[class^=crumbItem]');
                for (let i = 0; i < crumbItems.length; i++) {
                    const item = await (await crumbItems[i].getProperty('innerText')).jsonValue();

                    switch(i){
                        case 3:
                        let city_str = (item.split(' in ')[1]).replace('City of ','');
                        jsonrow.city = city_str;
                        if((city_str && city_str.indexOf('/') !== -1) || (city_str && city_str.indexOf('/') !== -1)){
                            jsonrow.city = (city_str.split(' / ')[0])
                        }

                        jsonrow.service = item.split(' in ')[0];
                        break;                   
                    } 
                }
            }

            data.push(jsonrow);
            
            //display progress
            progress = progress + '|';
            console.log(progress);

            await Timeout.set(10000);

        }catch(e){
            console.log(e);
        }
    }

    browser.close();
    return data;
}

/**
 * 
 */
const currentDateTime = function(){
    currentdate = new Date();
    var datetime = currentdate.getFullYear() + "-"
    + (currentdate.getMonth()+1)  + "-" 
    + currentdate.getDate() + " "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();  
    return datetime;  
}

/**
 * 
 * @param {*} ad_row 
 * @desc should be called within an array to map and save a row to the database
 */
const mapToContractorLead = async function(data){
    let n = 0;

    console.log(data);
    
    for(ads of data)  {
        const select_query = "SELECT * FROM sr_contractor_leads WHERE phone = ?";
        const insert_query = "INSERT INTO sr_contractor_leads(sn_cdate, sn_mdate, phone, phone2, province, region, comment, email, uid_lead, origin, lang, languages, address) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
        let date = new Date();
        

        
        if(ads.phone1 != ""){
            const select_result = await pool.query(select_query, [ads.phone1]);
            
            if(languages.fr.includes(ads.province) && !languages.en.includes(ads.province)){
                let numlang = 1;
                let lg = "fr";
            }else if(!languages.fr.includes(ads.province) && languages.en.includes(ads.province)){
                let numlang = 2;
                let lg = "en";
            }else if(languages.fr.includes(ads.province) && languages.en.includes(ads.province)){
                let numlang = 3;
                let lg = default_lg;
            }else{

            }

            if (select_result[0].length == 0) {
                const insert_result = await pool.query(insert_query, [currentDateTime(), currentDateTime(), ads.phone1, ads.phone2, ads.province, ads.city, ads.title, ads.email, ads.id, "kijiji.ca", lg, numlang, ads.address]);
                n = n + 1;
            }
        }
    }
    console.log(n +  " ads has been transfered to the database");
}

/**
 * 
 * @param {*} text 
 */
function extractEmails (text)
{
    return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}


/**
 * 
 * @param {*} num 
 */
function AddZero(num) {
    return (num >= 0 && num < 10) ? "0" + num : num + "";
}

exports.getAdsDetail = getAdsDetail;
exports.currentDateTime = currentDateTime;
exports.mapToContractorLead = mapToContractorLead;