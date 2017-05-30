/**
 * Created by tung on 12/05/17.
 */
google.charts.load('current', {'packages':['corechart']});
google.charts.load('current', {'packages':['bar']});
//data for figs
var allBarData;
var allPieData;
var indiviBarData;
var indiviPieData;
var userRevBarData;
/**
 * Process data for correct format of bar chart
 * to four type users by year
 * @param info The Array of four infomation JSON array
 * each of them shows a type of user by static year
 * @returns {Array}
 * From [admin:{2001,num},{2002,num}...],
 *      [bot:{2001,num},{2002,num}...],
 *      [regular:{2001,num},{2002,num}...],
 *      [anon:{2001,num},{2002,num}...]
 * To [ ['Years', 'admin', 'bot', 'regular', 'anon'],
 *      ['2001', 'num', 'num', 'num', 'num'],
 *      ['2002', 'num', 'num', 'num', 'num'],...]
 */
function formatDataByTime(info) {
    info = info.filter(ele => (ele.length>0));
    //find the range of the year
    let minY = info[0][0]._id;
    let maxY = info[0][info[0].length-1]._id;
    info.forEach(ele => {
        ele[0]._id<minY ?
            (minY = ele[0]._id):(minY = minY);
        ele[ele.length-1]._id>maxY ?
            (maxY = ele[ele.length-1]._id) : (maxY = maxY);
    });
    //data is the OUTPUT
    let data = [];
    for (let i = minY; i <= maxY; i++ ){
        data.push([i.toString(10)]);
    }
    /**
     * For each json array of four type user
     * for each year
     * put the num into the correct pace of data
     */
    info.forEach((jsonArr,idx) => {
        jsonArr.forEach((ele,eIdx) =>{
            for (let i = 0; i < data.length; i++) {
                if (ele._id == data[i][0]) {
                    data[i][idx+1]=ele.count;
                }
            }
        });
    });
    // set the header and fill the array with 0 to format
    data.unshift(['Years', 'admin', 'bot', 'regular', 'anon']);
    data.forEach((ele) => {
        if(ele.length<5){
            let s = 5-ele.length;
            for(let i = 0; i < s; i++){
                ele.push(0)
            }
        }
    })
    return data;
};
/**
 * Process data for correct format of pie chart
 * to four type users by year
 * @param info The Array of four infomation JSON array
 * each of them shows a type of user by static year
 * @returns {Array}
 * From [admin:{2001,num},{2002,num}...],
 *      [bot:{2001,num},{2002,num}...],
 *      [regular:{2001,num},{2002,num}...],
 *      [anon:{2001,num},{2002,num}...]
 * To [['UserType', 'number'],
 *     ['admin', totalNum],
 *     ['bot', totalNum],
 *     ['regular', totalNum],
 *     ['anon', totalNum]];
 */
function formatDataToSum(info) {
    let data = [['UserType', 'number'],
        ['admin'],
        ['bot'],
        ['regular'],
        ['anon']];
    info.forEach((jsonArr, idx) =>{
       // data[idx+1].push(
        let sum = 0;
        for(let ele of jsonArr){
           sum += ele.count;
        }
        data[idx+1].push(sum);
    });
    return data;
}
/**
 * format user data to json
 * @param userJson
 * @returns {[*]}
 */
function formatUserData(msg, user) {
    //[{"_id":{"year":"2006","us":"YellowMonkey"},"count":59},{"_id":{"year":"2007","us":"YellowMonkey"},"count":26},{"_id":{"year":"2008","us":"AussieLegend"},"count":90},{"_id":{"year":"2008","us":"YellowMonkey"},"count":6},{"_id":{"year":"2009","us":"AussieLegend"},"count":96},{"_id":{"year":"2009","us":"YellowMonkey"},"count":12},{"_id":{"year":"2010","us":"AussieLegend"},"count":51},{"_id":{"year":"2010","us":"YellowMonkey"},"count":182},{"_id":{"year":"2011","us":"AussieLegend"},"count":30},{"_id":{"year":"2012","us":"AussieLegend"},"count":29},{"_id":{"year":"2013","us":"AussieLegend"},"count":39},{"_id":{"year":"2014","us":"AussieLegend"},"count":46},{"_id":{"year":"2015","us":"AussieLegend"},"count":32},{"_id":{"year":"2016","us":"AussieLegend"},"count":22},{"_id":{"year":"2017","us":"AussieLegend"},"count":5}];
    let a = ['Year'];
    let head = a.concat(user);
    let data = [head];
    let dbody = [];
    msg.forEach(ele =>{
        dbody.push(ele._id.year);
        dbody.push(ele._id.us);
        dbody.push(ele.count);
    } )
    let maxY = dbody[dbody.length-3];
    let minY = dbody[0];
    for (let i = minY; i <= maxY; i++ ){
        data.push([i.toString(10)]);
    }
    for(let i = 0; i < dbody.length; i++){
        for(let j = 0; j < user.length; j++){
            for(let k = 0; k < data.length; k++){
                if(dbody[i]==data[k][0]&&dbody[i+1]==user[j]){
                    data[k][j+1]=dbody[i+2];
                }
            }
        }
    }
    return data;
}
/**
 * DOCUMENT READY
 */
$(document).ready(function() {
    //set the full page setting
    $('#fullpage').fullpage({
        sectionsColor: ['#1BBC9B', '#4bbfc3'],
        anchors: ['helloPage', 'mostRev'],
        menu: '#menu',
        lockAnchors: false,
        navigation: false,
        scrollingSpeed: 700
    });
    // search bar
    $('#sText').keyup(function() {
        let key = { sText: $(this).val() };
        let infoBox = $('#infoBox');
        infoBox.show();
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/getTitle",
            data: key,
            success: function (msg) {
                infoBox.html('');
                for (let i = 0; i < msg.length; i++) {
                    infoBox.append("<p class='titSelect'>" + msg[i]._id + "</p>");
                }
            }
        });
    });
    // check if the article up to data, otherwise fetch new data
    $('#pullDB').click(function () {
        let tit = { sText: $('#sText').val() };
        let individual = $('#showIndividual');
        individual.append('<p> Getting the wiki... </p>');
        $.ajax({
            type: "get",
            dataType: "text",
            url: "/searchArticle",
            data: tit,
            success: function (msg) {
                msg = msg.split('|');
                $('#topUser').empty();
                individual.empty();
                individual.append("<p>Title: "+msg[0]+"</p>");
                individual.append("<p>New revisions get: "+msg[1]+"</p>");
                individual.append("<p>Total revision number: "+JSON.parse(msg[2])[0].revNum+"</p>");
                individual.append("<p>Top 5 users: </p>");
                let user = JSON.parse(msg[3]);
                for(let i of user){
                    individual.append("<p style='text-decoration: underline;'>"+i._id+": "+i.revNum+"</p>");
                    $('#topUser').append("<option>"+i._id+"</option>");
                }
                $.ajax({
                    type: "get",
                    dataType: "text",
                    url: "/individualArticleData",
                    data: tit,
                    success: function (msg) {
                        msg = msg.split('|');
                        let info = [];
                        msg.forEach(
                            (ele,idx) => {info[idx] = JSON.parse(ele)
                            });
                        indiviBarData = formatDataByTime(info);
                        indiviPieData = formatDataToSum(info);
                    }
                });
            },
            error: function () {
                individual.append('Invalid title !');
                setTimeout(function(){ individual.empty() }, 3000);
            }
        });
        $('#individual-1').mousedown();
    });
    /**
     * three button used to get the data and render figs;
     */
    $('#individual-1').click(function (event) {
        event.preventDefault();
        let visData = google.visualization.arrayToDataTable(
            indiviBarData
        );
        let options = {
            chart: {
                title: 'Individual static: '+$('#sText').val()
            },
            'width':550,
            'height':400,
            backgroundColor: '#1BBC9B',
            chartArea:{
                backgroundColor: '#1BBC9B'
            },
            hAxis: {
                textStyle:{color: '#000000'}
            }
        };
        let chart = new google.charts.Bar($("#individual-fig")[0]);
        chart.draw(visData, google.charts.Bar.convertOptions(options));
    });
    $('#individual-2').click(function (event) {
        event.preventDefault();
        let visData = google.visualization.arrayToDataTable(
            indiviPieData
        );
        let options = {
            chart: {
                title: 'Individual static: '+$('#sText').val()
            },
            'width':550,
            'height':400,
            backgroundColor: '#1BBC9B',
            hAxis: {
                textStyle:{color: '#ffffff'}
            }
        };
        let chart = new google.visualization.PieChart($("#individual-fig")[0]);
        chart.draw(visData, options);
    });
    $('#individual-3').click(function (event) {
        let key = {
            title: $('#sText').val(),
            user: $('#topUser').val()
        };
        if(key.user.length<1){
            alert("no user select");
        }
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/userStatic",
            data: key,
            success: function (msg) {
                let user = key.user.sort();
                ///
                let a = ['Year'];
                let head = a.concat(user);
                let data = [head];
                let dbody = [];
                msg.forEach(ele =>{
                    dbody.push(ele._id.year);
                    dbody.push(ele._id.us);
                    dbody.push(ele.count);
                } )
                let maxY = dbody[dbody.length-3];
                let minY = dbody[0];
                for (let i = minY; i <= maxY; i++ ){
                    data.push([i.toString(10)]);
                }
                for(let i = 0; i < dbody.length; i++){
                    for(let j = 0; j < user.length; j++){
                        for(let k = 0; k < data.length; k++){
                            if(dbody[i]==data[k][0]&&dbody[i+1]==user[j]){
                                data[k][j+1]=dbody[i+2];
                            }
                        }
                    }
                }
                let uLength = user.length+1;
                data.forEach((ele) => {
                    if(ele.length<uLength){
                        let s = uLength-ele.length;
                        for(let i = 0; i < s; i++){
                            ele.push(0)
                        }
                    }
                });
                ////
                userRevBarData = data;
                let visData = google.visualization.arrayToDataTable(
                    userRevBarData
                );
                let options = {
                    chart: {
                        title: key.user+"'s revission static: "+key.title
                    },
                    'width':550,
                    'height':400,
                    backgroundColor: '#1BBC9B',
                    chartArea:{
                        backgroundColor: '#1BBC9B'
                    },
                    hAxis: {
                        textStyle:{color: '#000000'}
                    }
                };
                let chart = new google.charts.Bar($("#individual-fig")[0]);
                chart.draw(visData, google.charts.Bar.convertOptions(options));
            }
        });

    });
    //rend the full-set text statics
    $.ajax({
        type: "get",
        dataType: "json",
        url: "/revNumArticle",
        success: function (msg) {
            let info = $('.revNum');
            let a = msg[0];
            let b = msg[msg.length-1];
            info.html('');
            info.append("<p >1.The article with the most number of revisions:<br/>  <span>"
                + a._id
                + "</span> <br/>Revision number: <span>"
                + a.revNum
                + "</span></p>");
            info.append("<p >2.The article with the least number of revisions:<br/>  <span>"
                + b._id
                + "</span> <br/>Revision number: <span>"
                + b.revNum
                +"</span></p>");
        }
    });
    $.ajax({
        type: "get",
        dataType: "json",
        url: "/registerNumArticle",
        success: function (msg) {
            let info = $('.registerUser');
            let a = msg[0];
            let b = msg[msg.length-1];
            info.append("<p >3.The article edited by largest group of registered users:<br/>  <span>"
                + a._id
                + "</span> <br/>User number: <span>"
                + a.uniqueUserCount
                +"</p>");
            info.append("<p >4.The article edited by smallest group of registered users:<br/>  <span>"
                + b._id
                + "</span> <br/>User number: <span>"
                + b.uniqueUserCount
                +"</p>");
        }
    });
    $.ajax({
        type: "get",
        dataType: "json",
        url: "/historyArticle",
        success: function (msg) {
            let info = $('.history');
            let a = msg[0];
            let b = msg[msg.length-1];
            info.append("<p >5.The article with the shortest history:<br/>  <span>"
                + a._id
                + "</span> <br/>Start from: <span>"
                + a.firRev.toString().slice(0,10)
                +"</span></p>");
            info.append("<p >6.The article with the longest history:<br/>  <span>"
                + b._id +"</span> <br/>Start from: <span>"
                + b.firRev.toString().slice(0,10)
                +"</span></p>");
        }
    });
    /**
     * get the data from the full set four type users
     * Parse it from string to a array includes four JSON arrays
     * and trans these data to the Google chart accept format
     */
    $.ajax({
        type: "get",
        dataType: "text",
        url: "/fullUserData",
        success: function (msg) {
            msg = msg.split('|');
            let info = [];
            msg.forEach(
                (ele,idx) => {info[idx] = JSON.parse(ele)
            });
            allBarData = formatDataByTime(info);
            allPieData = formatDataToSum(info);
        }
    });
    //plot two figs of full set level
    $('#fullset-bar').click(function (event) {
        event.preventDefault();
        let visData = google.visualization.arrayToDataTable(
            allBarData
        );
        let options = {
            chart: {
                title: 'Total static'
            },
            'width':600,
            'height':480,
            backgroundColor: '#4bbfc3',
            chartArea:{
                backgroundColor: '#4bbfc3'
            },
            hAxis: {
                textStyle:{color: '#000000'}
            }
        };
        let chart = new google.charts.Bar($("#fullInfo-fig")[0]);
        chart.draw(visData, google.charts.Bar.convertOptions(options));
    });
    $('#fullset-pie').click(function (event) {
        event.preventDefault();
        let visData = google.visualization.arrayToDataTable(
            allPieData
        );
        let options = {
            chart: {
                title: 'Total static'
            },
            'width':600,
            'height':480,
            backgroundColor: '#4bbfc3',
            hAxis: {
                textStyle:{color: '#ffffff'}
            }
        };
        let chart = new google.visualization.PieChart($("#fullInfo-fig")[0]);
        chart.draw(visData, options);
    });
});

/**
 *Log: the dynamic extend html need to rebind the event!
 *Ref:http://stackoverflow.com/questions/203198/event-binding-on-dynamically-created-elements
 */
$(document).on('click','.titSelect',function(){
    $('#sText').val($(this).html());
    $(this).parent('#infoBox').fadeToggle("slow");
});
