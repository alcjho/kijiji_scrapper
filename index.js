const fs = require('fs');
const fn = require('./functions');

// const category = fn.loadAdsCategories();
// console.log(category);

(async () => {
    const ads = await fn.getAdsDetail();
    console.log(ads);
})();