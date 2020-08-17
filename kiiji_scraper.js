const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const siteRoot = "https://www.kijiji.ca";
const ads = new Set();
const adsDetail = new Set();
const positions = new Set();
const extractor = require('libphonenumber-js');
const dbconfig = require('./dbconfig');
const mysql = require('mysql2/promise');
const params = require('./config');

const jsonstr = [];

const pool = mysql.createPool(dbconfig.srv5);


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
    adsDetail.add(data);

    if(adsDetail.size == dataset.size){
       return adsDetail;
    }
}


/**
 * 
 */
const getAdsv2 = async () => {
    const $ = await loadSiteData(params.config.startUrl);
    $('.regular-ad').each((index, element)=>{
        jsonstr.push({'title':$(element).find('.title').text(), 'link':$(element).find('.title').attr('href'), 'id':$(element).attr('data-listing-id')});
    });    
}


/**
 * 
 */
const getAds = async () => {
    const $ = await loadSiteData(params.config.startUrl);
    $('.regular-ad').each((index, element)=>{
        ads.add({'title':$(element).find('.title').text(), 'link':$(element).find('.title').attr('href'), 'id':$(element).attr('data-listing-id')});
    });    
}


/**
 * 
 */
const getAdsDetail = async () => {
    await getAds();
    ads.forEach( (value, index, ads) =>{
        
        if(!value.link.includes(siteRoot)){
            value.link = siteRoot + value.link;
        }        
        
        let dataset = saveAdsData(value.link, value, ads);
        dataset.then(function(result){
            if(result){
               mapToContractorLead(result);
            }
        })
    });
}

const currentDateTime = function(){
    currentdate = new Date();
    var datetime = currentdate.getFullYear() + "/"
    + (currentdate.getMonth()+1)  + "/" 
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
const mapToContractorLead = async function(ad_row){  
    for (let rec of ad_row.values()) {
        const select_query = "SELECT * FROM sr_contractor_leads WHERE phone = ?";
        const insert_query = "INSERT INTO sr_contractor_leads(sn_cdate, sn_mdate, phone, phone2, province, region, comment, email, uid_lead) values(?, ?, ?, ?, ?, ?, ?, ?, ?)";
        let date = new Date();

        if(rec.phone1 != ""){
            const select_result = await pool.query(select_query, [rec.phone1]);
            
            if (!select_result[0].length > 0) {
                const insert_result = await pool.query(insert_query, [currentDateTime(), currentDateTime(), rec.phone1, rec.phone2, rec.province, rec.city, rec.title, rec.email, rec.id]);
                console.log('phone number ' + rec.phone1 + " has been inserted");
            }
        }
    }
}


/**
 * 
 */
const getAdsDetailv2 = async () => {
    await getAdsv2();

    for(var key in jsonstr){
        if(!jsonstr[key].link.includes(siteRoot)){
            jsonstr[key].link = siteRoot + jsonstr[key].link;
        } 
       const $ = await loadSiteData(jsonstr[key].link);

       $('[class^=crumbItem]').each((index, element)=>{
            switch(index){
                case 0:
                jsonstr[key].province = $(element).text();
                break;

                case 1:
                jsonstr[key].city = $(element).text();
                break;
            }
        
        }); 

        description = $('[class^=descriptionContainer]').find('div[itemprop=description]').text();
        emails = (extractEmails(description) != null)? extractEmails(description).join(','):'';
        let phoneData = extractor.findNumbers(description, "CA");
        jsonstr[key].phone1='';
        jsonstr[key].phone2='';

        jsonstr[key].email = emails;

        if(phoneData[0] !== undefined){
            jsonstr[key].phone1 = phoneData[0].phone;
        }

        if(phoneData[1] !== undefined && jsonstr[key].phone1 != phoneData[1].phone){
            jsonstr[key].phone2 = phoneData[1].phone;
        } 
    }
    console.log(jsonstr);
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
exports.getAdsDetailv2 = getAdsDetailv2;
exports.currentDateTime = currentDateTime;