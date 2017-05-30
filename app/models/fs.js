/**
 * Created by tung on 21/05/17.
 */
/*
 * 1. in node.js, the path of require() is always anchor in
 *      the current module's working dir
 * 2. however, the others functions require path, like readFile() below,
 *      is anchor in the run time dir: in the example: server.js dir
 *      (think about it)
 *      we can test use: console.log(cwd());
 * 3. in express, we can do:
 *      app.set('views', path.join(__dirname,'app/views'));
 *     that set the 'views' variable. when
 *      res.render(view, data)
 *     it search under this 'views' variable
 * 4. in express, we also do:
 *      app.use(express.static(path.join(__dirname, 'public')));
 *     that set the static variable. when the tamplate need contain
 *     CSS or js... it search under this 'express.static' variable
 *
 */
let fs = require('fs');
var botList;
var admList;
/**
 * Used to read the bot list and admin list
 * store them in the global variable
 * @param fPath
 */
let readList =(fPath) => fs.readFileSync(fPath, 'utf8', (err, fd) => {
    if (err) console.error(fPath+'does not exist');
    return fd;
});
botList = readList('bot.txt').toString().trim().split('\n');
admList = readList('admin.txt').toString().trim().split('\n');

module.exports={
    botList:botList,
    admList:admList
};