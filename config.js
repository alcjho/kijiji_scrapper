const config =  {
    baseSiteUrl: `https://www.kijiji.ca/b-skilled-trades/canada/c76l0`,
    startUrl: `https://www.kijiji.ca/b-skilled-trades/canada/c76l0`,
    concurrency: 10,//Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
    maxRetries: 3,//The scraper will try to repeat a failed request few times(excluding 404). Default is 5.       
    logPath: './logs/'//Highly recommended: Creates a friendly JSON for each operation object, with all the relevant data. 
};

const config_rbq = {
    baseSiteUrl: `https://www.pes.rbq.gouv.qc.ca/RegistreLicences/Recherche?mode=Entreprise`,
}

exports.config = config;
exports.config_rbq = config_rbq;