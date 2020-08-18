const timer = require('await-timeout');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const siteRoot = "https://www.kijiji.ca";
const extractor = require('libphonenumber-js');
const dbconfig = require('./dbconfig');
const mysql = require('mysql2/promise');
const params = require('./config');
const jsonstr = [];

const pool = mysql.createPool(dbconfig.srv5);
const languages = require('./languages.json');
const { timeout } = require('async');
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
    const result = await axios.get(url);
    return cheerio.load(result.data);
};


/**
 * 
 * @param {*} url 
 * @param {*} data 
 * @param {*} dataset 
 */
const saveAdsData = async (url, data, dataset) => {
    const $ = await loadSiteData(url);
    $('[class^=crumbItem]').each((index, element)=>{
        switch(index){
            case 0:
            data.province = $(element).text();
            break;

            case 1:
            data.city = $(element).text();
            break;
        } 
    });

    description = $('[class^=descriptionContainer]').find('div[itemprop=description]').text();
    emails = (extractEmails(description) != null)? extractEmails(description).join(','):'';
    let phoneData = extractor.findNumbers(description, "CA");
    data.phone1='';
    data.phone2='';

    data.email = emails;

    if(phoneData[0] !== undefined){
        data.phone1 = phoneData[0].phone;
    }

    if(phoneData[1] !== undefined && data.phone1 != phoneData[1].phone){
        data.phone2 = phoneData[1].phone;
    }

	return data;

/*	console.log(data);
    adsDetail.push(data);

    if(adsDetail.size == dataset.size){
       return adsDetail;
    }
*/
}


/**
 * 
 */
const getAds = async () => {
    const $ = await loadSiteData(params.config.startUrl);
    $('.regular-ad').each((index, element)=>{
        ads.push({'title':$(element).find('.title').text(), 'link':$(element).find('.title').attr('href'), 'id':$(element).attr('data-listing-id')});
    });
}

/**
 * recreate foreach function async
 */
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }


/**
 * 
 */
const getAdsDetail = async () => {
    await getAds();
    await asyncForEach( ads, async (value) =>{  
        await timer.set(5000);
        if(value.link != undefined){
            if(!value.link.includes(siteRoot)){
                value.link = siteRoot + value.link;
            }
        
        
			saveAdsData(value.link, value, ads)
			.then(result => mapToContractorLead(result));
		}   
    });
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
        const select_query = "SELECT * FROM sr_contractor_leads WHERE phone = ?";
        const insert_query = "INSERT INTO sr_contractor_leads(sn_cdate, sn_mdate, phone, phone2, province, region, comment, email, uid_lead, origin, lang, languages) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        let date = new Date();
        
        if(data.phone1 != "" && data.phone1 != undefined){
            const select_result = await pool.query(select_query, [data.phone1]);

            if(languages.fr.includes(data.province) && !languages.en.includes(data.province)){
                let numlang = 1;
                let lg = "fr";
            }else if(!languages.fr.includes(data.province) && languages.en.includes(data.province)){
                let numlang = 2;
                let lg = "en";
            }else if(languages.fr.includes(data.province) && languages.en.includes(data.province)){
                let numlang = 3;
                let lg = default_lg;
            }else{

            }


            if (!select_result[0].length > 0) {
                const insert_result = await pool.query(insert_query, [currentDateTime(), currentDateTime(), data.phone1, data.phone2, data.province, data.city, data.title, data.email, data.id, "kijiji.ca", lg, numlang]);
                console.log(currentDateTime() + " - phone number " + data.phone1 + " has been inserted");
            }
        }
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