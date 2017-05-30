/**
 * Created by tung on 12/05/17.
 */
let mongoose = require('./db');
let fs = require('./fs');
let request = require('request');

//define the schema
let AnalySchema = new mongoose.Schema(
    {title: String,
    timestamp: String,
    user: String,
    anon: String,
    revid: Number,
    parentid: Number,
    size: Number,
    sha1: String,
    anon: String}, {
    versionKey: false }
);

/**
 * Used to search title for search box
 * @param title It's the letters that user enter to search
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.searchTitle = function (tit, callback) {
    let reg = '^'+tit+'.*';
    let treg = new RegExp(reg,'i');
    return this.aggregate([
        {$match: {title: treg} },
        {$group: {_id: "$title"} },
        {$sort: {title: -1} },
        {$limit: 5}
    ]).exec(callback);
};

/**
 * Methods used in full set statistic
 */
/**
 * Used to find the revision numbers statistic in full set
 * of each article
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.eachArticleRevisionNum = function (callback, tit) {
    let trep;
    if(tit === undefined)  trep = new RegExp(tit);
    else  trep = tit;
    return this.aggregate([
        {$match:
            {title: trep}
        },
        {$group: {
            _id: "$title",
            revNum: {$sum: 1}
        }},
        {$sort: {revNum: -1} }//large to small
    ]).exec(callback);
};
/**
 * Used to find the article edited by registered users in full set
 * registered users: is the users are not anons
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.registerUserEachArticle = function (callback) {
   return this.aggregate([
       {$match: {
           $and: [
               // {user: {$nin: fs.botList} },
               // {user: {$nin: fs.botList} },
               {anon: {$exists: false} }
           ]
       }},
       {$group: {
           _id: "$title",
           uniqUser: {$addToSet: "$user"}
       }},
       {$project: {"title": 1,
           uniqueUserCount: {$size: "$uniqUser"} } },
       {$sort: {uniqueUserCount: -1} }//large to small
   ]).exec(callback)
};
/**
 * Used to find the history of each article in full set
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.historyForArticle = function (callback) {
    return this.aggregate([
        {$group: {
            _id: "$title",
            firRev: {$min: '$timestamp'}
        }},
        {$sort: {firRev: -1} },// fresh to long history
    ]).exec(callback);
};

/**
 * Methods used to full set revision static figs
 * by year and by four user types
 * Or used to show the individual article four user types
 * static
 */
/**
 * Used to show the admin statistic
 * (if both in admin and bot, treat as admin)
 * @param callback
 * @param tit if have a title, used to individual static
 * @returns {Promise}
 */
AnalySchema.statics.adminStatistic = function (callback, tit) {
    let trep;
    if(tit === undefined)  trep = new RegExp(tit);
    else  trep = tit;
    return this.aggregate([
        {$match: {
            $and: [
                {user: {$in: fs.admList} },
                {title: trep}
            ]
        }},
        {$project: {
            Year: {$substr: ["$timestamp", 0, 4] },
        }},
        {$group: {
            _id: "$Year",
            count: {$sum : 1}
        }},
        {$sort: {_id : 1} }
    ]).exec(callback);
};
/**
 * Used to show the bot statistic
 * (if both in admin and bot, treat as admin)
 * @param callback
 * @param tit for individual title
 * @returns {Promise}
 */
AnalySchema.statics.botStatistic = function (callback, tit) {
    let trep;
    if(tit === undefined)  trep = new RegExp(tit);
    else  trep = tit;
    return this.aggregate([
        {$match: {
            $and: [
                {user: {$nin: fs.admList} },
                {user: {$in: fs.botList} },
                {title: trep}
            ]
        }},
        {$project: {
            Year: {$substr: ["$timestamp", 0, 4] },
        }},
        {$group: {
            _id: "$Year",
            count: {$sum: 1}
        }},
        {$sort: {_id: 1} }
    ]).exec(callback);
};
/**
 * Used to show the normal user statistic
 * normal user: (NOT admin)&&(NOT bot)&&(NOT anon)
 * @param callback
 * @param tit for title
 * @returns {Promise}
 */
AnalySchema.statics.normalUserStatistic = function (callback, tit) {
    let trep;
    if(tit === undefined)  trep = new RegExp(tit);
    else  trep = tit;
    return this.aggregate([
        {$match: {
            $and: [
                {user: {$nin: fs.botList} },
                {user: {$nin: fs.admList} },
                {anon: {$exists: false} },
                {title: trep}
            ]
        }},
        {$project: {
            Year: {$substr: ["$timestamp", 0, 4 ]},
        }},
        {$group: {
            _id: "$Year",
            count: {$sum: 1}
        }},
        {$sort: {_id: 1} }
    ]).exec(callback);
};

/**
 * Used to show the anons statistic
 * @param callback
 * @param tit for individual title
 * @returns {Promise}
 */
AnalySchema.statics.anonStatistic = function (callback, tit) {
    let trep;
    if(tit === undefined)  trep = new RegExp(tit);
    else  trep = tit;
    return this.aggregate([
        {$match: {
            $and: [
                {anon: {$exists: true} },
                {title: trep}
            ]
        }},
        {$project: {
            Year: {$substr: ["$timestamp", 0, 4] },
        }},
        {$group: {
            _id: "$Year",
            count: {$sum: 1}
        }},
        {$sort: {_id: 1} }
    ]).exec(callback);
};

/**
 * find the last revision of a article
 * @param callback
 * @param tit
 * @returns {Promise}
 */
AnalySchema.statics.lastRevisionTime = function (callback, tit) {
    let trep = tit.trim();
    return this.find({title: trep} )
        .sort( {timestamp: -1})
        .limit(1)
        .exec(callback);
};
/**
 * request Wiki
 * @param tit request for the special title
 * @param rvstart from the last revsion time of local DB
 * @param callback
 */
AnalySchema.statics.requestWiki = function (tit, rvstart, callback) {
    let wikiEndpoint = 'https://en.wikipedia.org/w/api.php';
    let titStr = "titles="+tit.trim().split(' ').join('%20');
    let rvstartStr = "rvstart="+rvstart.toISOString();
    let parameters = ["action=query",
        "format=json",
        "prop=revisions",
        "rvdir=newer",
        "rvlimit=max",
        "rvprop=timestamp|anon|userid|user|ids|size|sha1"];
    parameters.push(titStr,rvstartStr);
    let url = wikiEndpoint + "?" + parameters.join("&");
    console.log(url);
    let options = {
        url: url,
        Accept: 'application/json',
        'Accept-Charset': 'utf-8'
    }
    request(options, function (err, res, data) {
        if (err) {
            console.log('Error:', err);
        } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
        } else {
            console.log("Wiki fetch success");
            let json = JSON.parse(data);
            let pages = json.query.pages;
            revisions = pages[Object.keys(pages)[0]].revisions;
            revisions.shift();
            callback(revisions);
        }
    });
};
/**
 * find the five TOP user of a individual article
 * @param tit
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.topUser = function (tit, callback){
    return this.aggregate([
        {$match: {
            $and: [
                {user: {$nin: fs.botList} },
                {user: {$nin: fs.admList} },
                {anon: {$exists: false} },
                {title: tit}
            ]
        }},
        {$group: {
            _id: "$user",
            revNum: {$sum: 1}
        }},
        {$sort: {revNum: -1} },
        {$limit: 5}//large to small
    ]).exec(callback);
};
/**
 * get the single user for a individual article
 * @param tit title
 * @param user
 * @param callback
 * @returns {Promise}
 */
AnalySchema.statics.individualUserStatic = function (tit, user, callback){
    return this.aggregate([
        {$match: {
            $and: [
                {user: {$in: user} },
                {title: tit}
            ]
        }},
        {$group: {
            _id: {year: {$substr: ["$timestamp", 0, 4]}, us :"$user" },
            count: {$sum : 1}
        }},
        {$sort: {_id : 1} }
    ]).exec(callback);
};


//use model and export model
let AnalyWiki = mongoose.model('AnalyWiki', AnalySchema, 'revisions');

module.exports = AnalyWiki;