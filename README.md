## KIJIJI SCRAPER

### PROJECT DESCRIPTION

Créer une application nodejs pour charger les annonces sur kijiji dans soumissionrenovation.ca. Le chargement se fera tous les 5 minutes dans une base de données MySQL.

### LIBRAIRIES

- scheduler-js : Permet de créer une tache programmée a l'instar de crontab.
- axios : Utiliser pour envoyer des requêtes ajax a une page html
- cheerio : librairie nodejs utiliser pour faire du web scrapping
- fs : Utiliser pour créer les fichiers logs pour le scrapping

### STRUCTURE

`kijiji_scraper.js`
Ce fichier représente le core de l'application vu qu'il fourni toutes les fonctions nécessaire au scrapping

`Index.js`
ce fichier est le principale de l'application nodejs. Il contient la tache automatisée et gere l'execution de l'application.

`config.js`
Contient les parametres de configuration de l'application tels que:
**baseSiteUrl** : qui est le url de base de kijiji
**startUrl** : qui est le url utilisé au demarrage de l'appli pour trouver les annonces.

`dbconfig.js`
Contient les paramètres de connexion a la base de données MySQL:

### FUNCTIONNALITES

`getAds()`: c'est la fonction de chargement de tous les annonces sur la page https://www.kijiji.ca/b-skilled-trades/canada/c76l0. *Cette fonction doit être asynchrone*.

`loadSiteData( string url)`: cette fonction envoi une requête avec **Axios** vers le l'url passé en paramètre. La réponse retournée est le contenu html de la page qui est charger en mémoire avec **cheerio**. *La fonction loadSiteData doit être asynchrone*.

`getAdsDetail()`: C'est la fonction principale de l'application. Elle charge le lien de chaque annonce en mémoire pour trouver les détails sur celle-ci. Cette fonction s'occupe du mapping des détails des annonces dans la table **sr_contractor_leads**. *La fonction getAdsDetail doit être asynchrone*

`mapToContractLead()`: transforme les données du scraper en enregistrements de base de données.

### UTILISATION

1. Cloner le repository de gihub:
   `git clone https://github.com/alcjho/kijiji_scrapper.git`
2. A l'interieur du folder kijiji_scraper, installer toutes les librairies :
   `npm install`
3. Démarrer l'application avec la commande suivante:
   `node index`
4. Au premier lancement le scraper charge les annonces immediatement.
   attendez 10 minutes avant le prochain chargement. ou ajouter une nouvelle cédule dans index.js
5. Voilal!