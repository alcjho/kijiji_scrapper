const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
var params = require('./config');
const siteRoot = "https://www.kijiji.ca";
const ads = new Set();
const adsDetail = new Set();
const positions = new Set();
const extractor = require('libphonenumber-js');

const loadSiteData = async (url) => {
    const result = await axios.get(url);
    return cheerio.load(result.data);
};

const saveAdsData = async (url, data) => {
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
    console.log(adsDetail);
}

const getAds = async () => {
    const $ = await loadSiteData(params.config.startUrl);
    $('.regular-ad').each((index, element)=>{
        ads.add({'title':$(element).find('.title').text(), 'link':$(element).find('.title').attr('href'), 'id':$(element).attr('data-listing-id')});
    });    
}

const getAdsDetail = async () => {
    await getAds();
    ads.forEach( (value) =>{
        if(!value.link.includes(siteRoot)){
            value.link = siteRoot + value.link;
        }        
        saveAdsData(value.link, value);
    });
}

function extractEmails (text)
{
    return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

const saveToJson = (data)=>{
    var jsonstr = JSON.stringify(data);
    //fs.writeFile('./ads/skilled-trades.json', JSON.stringify(data), () => { })
}
//Pad given value to the left with "0"
function AddZero(num) {
    return (num >= 0 && num < 10) ? "0" + num : num + "";
}

exports.getAdsDetail = getAdsDetail;