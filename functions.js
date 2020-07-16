const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
var params = require('./config');
const siteRoot = "https://www.kijiji.ca";
const ads = new Set();
const positions = new Set();

const loadSiteData = async (url) => {
    const result = await axios.get(url);
    return cheerio.load(result.data);
};

const getAds = async () => {
    const $ = await loadSiteData(params.config.startUrl);
    $('.regular-ad').each((index, element)=>{
        ads.add({'title':$(element).find('.title').text(), 'link':$(element).find('.title').attr('href'), 'id':$(element).attr('data-listing-id')});
    });
}

const getAdsDetail = async () => {
    await getAds();
    // ads.forEach(async (key, value) =>{
    //     if(!value.link.includes(siteRoot)){
    //         value.link = siteRoot + value.link;
    //     }
    //     const $ = await loadSiteData(value.link);
    //     $("[class^=crumbItem]").each((index, element)=>{
    //         switch(index){
    //             case 0:
    //             value.province = $(element).text();
    //             break;

    //             case 1:
    //             value.city = $(element).text();
    //             break;  
    //         }
    //     })
    // })

    for(const entry of ads.entries()){
        console.log(entry)
    }
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