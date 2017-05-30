/**
 * Created by tung on 12/05/17.
 */
let AnalyWiki = require('../models/analy.js');
let url = require('url');

//render page
let showPage = (req,res) => res.render('fullPage.pug');
/**
 * get title in the db for search box
 * @param req
 * @param res
 */
function getTitle(req,res){
    let sKey = req.query.sText;
    AnalyWiki.searchTitle(sKey,(err,result)=>{
        if(err) console.log("error happened at search titile");
        else {
            res.send(result);
            res.end();
        }
    });
};
// Three methods get the full set statistic result for Text
function eachArticleRevisionNum(req,res) {
    AnalyWiki.eachArticleRevisionNum((err,result)=>{
        if(err) console.log(err.message);
        else {
            res.send(result);
            res.end();
        }
    });
};
function registerUserEachArticle(req,res) {
    AnalyWiki.registerUserEachArticle((err,result)=>{
        if(err) console.log(err.message);
        else {
            res.send(result);
            res.end();
        }
    });
};
function historyForArticle(req,res) {
    AnalyWiki.historyForArticle((err,result)=>{
        if(err) console.log(err.message);
        else {
            res.send(result);
            res.end();
        }
    });
};
/**
 * If have title, send the  four type user of a
 * individual title;
 * if don't have title send the four types user
 * full set static for the overall data
 * @param req
 * @param res
 * @param title
 */
function fullSetUserData(req, res, title) {
    res.writeHead(200, {"Content-Type": "text"});
    AnalyWiki.adminStatistic((err,result) => {
        if (err) console.log(err.message);
        else res.write(JSON.stringify(result)+'|');
        AnalyWiki.botStatistic((err,result) => {
            if (err) console.log(err.message);
            else res.write(JSON.stringify(result)+'|');
            AnalyWiki.normalUserStatistic((err,result) => {
                if (err) console.log(err.message);
                else res.write(JSON.stringify(result)+'|');
                AnalyWiki.anonStatistic((err,result) => {
                    if (err) console.log(err.message);
                    else res.write(JSON.stringify(result));
                    res.end();
                }, title);
            }, title);
        }, title);
    }, title);
};

//check the two time gap
function daysBetween(time1, time2) {
    return (time1-time2)/(3600*24*1000);
}
/**
 * use the write individual article total revision
 * number and TOP 5 users
 * @param res
 * @param title
 */
function writeData(res, title) {
    res.writeHead(200, {"Content-Type": "text"});
    res.write(title+'|'+revisions.length+'|');
    AnalyWiki.eachArticleRevisionNum((err, result) =>{
        if (err) console.log(err.message);
        else  res.write(JSON.stringify(result)+'|');
        AnalyWiki.topUser(title, (err, result) => {
            if (err) console.log(err.message);
            else res.write(JSON.stringify(result));
            res.end();
        })
    }, title);
}
/**
 * use @AnalyWiki.lastRevisionTime to check the lastRevision
 * of individual, if out of data, use @AnalyWiki.requestWiki
 * to request the third party data, then, use the write data
 * to send message
 * @param req
 * @param res
 */
function articleFetch(req,res){
    let title = req.query.sText;
    console.log("search title "+title);
    AnalyWiki.lastRevisionTime((err,result)=>{
        if(err) console.log("error happened at search titile");
        else {
            if (result.length>0){
                let current = new Date();
                console.log('The last revision is at '+result[0].timestamp);
                let lastTime = new Date(Date.parse(result[0].timestamp));
                if(daysBetween(current, lastTime)>1){
                    console.log(title+" is out of date");
                    AnalyWiki.requestWiki(title, lastTime, function () {
                        if(revisions.length === 0){
                            console.log("It's already up to date");
                            writeData(res, title);
                        }else{
                            revisions.forEach((ele) =>{
                                ele.title = title;
                            });
                            AnalyWiki.insertMany(revisions);
                            writeData(res, title);
                        }
                    });
                }else{
                    AnalyWiki.requestWiki(title, lastTime, function () {
                        writeData(res, title);
                        console.log("The DB is up to date.")
                    });
                }
            }else {
                console.log("Not valid titile");
                res.send("Not valid titile");
                res.end();
            }
        }
    }, title);
};
/**
 * use to send to send a individual article static
 * of four types users and so on.
 * @fullSetUserData method specify a title for individual
 * @param req
 * @param res
 */
function individualArticleData(req, res){
    let title = req.query.sText;
    console.log("Get data of: "+title);
    fullSetUserData(req, res, title);
}
/**
 * use to send a static of a single user for
 * a single article
 * @param req
 * @param res
 */
function userStatic(req, res) {
    let title = req.query.title;
    let user = req.query.user;
    AnalyWiki.individualUserStatic(title, user, (err, result) => {
        if (err) console.log(err.message);
        else  res.send(result);
    });
}
module.exports={
    showPage:showPage,
    getTitle:getTitle,
    eachArticleRevisionNum:eachArticleRevisionNum,
    registerUserEachArticle:registerUserEachArticle,
    historyForArticle:historyForArticle,
    fullSetUserData:fullSetUserData,
    articleFetch:articleFetch,
    individualArticleData:individualArticleData,
    userStatic:userStatic
};

