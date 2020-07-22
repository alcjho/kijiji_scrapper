const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
var params = require('./config');
const siteRoot = "https://www.kijiji.ca";
const ads = new Set();
const adsDetail = new Set();
const positions = new Set();
const extractor = require('libphonenumber-js');
const jsonstr = [];

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
                //call database mapping function here : mapToContractorLead()
                console.log(result);
            }
        })
    });
    
}

/**
 * 
 * @param {*} ad_row 
 * @desc should be called within an array to map and save a row to the database
 */
const mapToContractorLead = function(ad_row){

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