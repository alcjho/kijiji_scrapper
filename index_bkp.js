const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');
const fs = require('fs');
 
(async () => {
 
    const config = {
        baseSiteUrl: `https://www.kijiji.ca/b-skilled-trades/canada/c76l0`,
        startUrl: `https://www.kijiji.ca/b-skilled-trades/canada/c76l0`,
        concurrency: 10,//Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
        maxRetries: 3,//The scraper will try to repeat a failed request few times(excluding 404). Default is 5.       
        logPath: './ads/'//Highly recommended: Creates a friendly JSON for each operation object, with all the relevant data. 
    }
 
    const adsCategory = [];//Holds all article objects.
 
    const getPageObject = (pageObject) => {//This will create an object for each page, with "title", "story" and "image" properties(The names we chose for our scraping operations below)
        adsCategory.push(pageObject)
    }
 
    //Create a new Scraper instance, and pass config to it.
    const scraper = new Scraper(config);
 
    //Now we create the "operations" we need:
    const root = new Root();//The root object fetches the startUrl, and starts the process.  
 
    //Any valid cheerio-advanced-selectors selector can be passed. For further reference: https://cheerio.js.org/
    const category = new OpenLinks('.css-1wjnrbv',{name:'category'});//Opens each category page.
    const article = new OpenLinks('article a', {name:'article', getPageObject });//Opens each article page, and calls the getPageObject hook.
    const title = new CollectContent('h1', { name: 'title' });//"Collects" the text from each H1 element.
    const story = new CollectContent('section.meteredContent', { name: 'story' });//"Collects" the the article body.
 
    root.addOperation(category);//Then we create a scraping "tree":
      category.addOperation(article);
       article.addOperation(image);
       article.addOperation(title);
       article.addOperation(story);
 
    await scraper.scrape(root);
    console.log(category); 
})();    
 