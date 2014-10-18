//Data - client side DB
document.addEventListener('deviceready', onDeviceReady, false);

/*
console.log("LOCAL STORAGE CLEAR");
localStorage.clear();
*/

var db;

//loading screen no primeiro acesso a app


// Cordova is ready
function onDeviceReady(){
    document.addEventListener("backbutton", backButton, false);
    setHeightAndWidth();
    db = window.openDatabase("FestivAllDB", "1.0", "FestivAll Database", 5000000);

    //menu button
    initMenu();

    if(localStorage["firstRun"] == undefined || localStorage["firstRun"] == "true"){
        // Loading festivals
        $('#installer').addClass('visible');
    }
    //Conexao à base de dados do servidor
    $.ajax({
        url: "http://festivall.eu",
        dataType:"html",
        timeout: 8000,
        success:function (data) {
            if(localStorage["firstRun"] == undefined || localStorage["firstRun"] == "true"){
                localStorage.setItem("firstRun", "true");
                db.transaction(populateDB, errorCB, successCB);
            }
            else if(localStorage["firstRun"] == "false"){
                console.log("SYNCHRONIZING");
                sync("http://festivall.eu/festivals.json");
            }
        },
        error: function(model, response) {
            if(localStorage["firstRun"] == undefined){
                if(localStorage['language'] != undefined)
                    alert(dictionary[localStorage['language']]['you_need_internet_connection'], null, dictionary[localStorage['language']]['info'], 'Ok');
                else alert("You need an Internet Connection to run this app for the first time.");
                navigator.app.exitApp();
            }
            createFestivalsContainer(); //syncinc flow
        }
    });
}


// Get the last synchronization date
function getLastSync(callback) {
    var last_sync = localStorage["lastSync"].replace("T"," ").replace("Z","");
    console.log('LAST SYNC = ' + last_sync);
    callback(last_sync);
}

// Get the changes from the server
function getChanges(syncURL, modifiedSince, callback) {
    $.ajax({
        url: syncURL,
        data: {start_date: modifiedSince},
        dataType:"json",
        success:function (changes) {
            callback(changes);
        },
        error: function(model, response) {
        }
    });
}

// Apply the changes to cache webSQL database
function applyChanges(response, callback) {
    if (response['migration_version'] != localStorage["migration_version"]){
        localStorage.setItem("migration_version", response['migration_version']);
        localStorage.setItem("firstRun", "true");
        console.log("NEW DATABASE VERSION FOUND, REBUILDING DATABASE");
        db.transaction(populateDB, errorCB, successCB);
    }
    else {
        console.log("UPDATING DATA");
        console.log("CHANGES:" + JSON.stringify(response));
        insertData(response);}
}


//Synchronization algorithm logic
function sync(syncURL, callback ) {
    getLastSync(function(lastSync){
        getChanges(syncURL, lastSync,
            function (changes) {
                applyChanges(changes, callback);
            }
        );
    }, true);
}

// Populate the database
function populateDB(tx) {
    console.log('POPULATING DATABASE');
    tx.executeSql('DROP TABLE IF EXISTS FESTIVALS');
    tx.executeSql('DROP TABLE IF EXISTS SHOWS');
    tx.executeSql('DROP TABLE IF EXISTS DAYS');
    tx.executeSql('DROP TABLE IF EXISTS STAGES');
    tx.executeSql('DROP TABLE IF EXISTS COUNTRIES');
    tx.executeSql('DROP TABLE IF EXISTS VIDEOS');
    tx.executeSql('DROP TABLE IF EXISTS LANGUAGES');
    tx.executeSql('DROP TABLE IF EXISTS TRANSLATIONS');
    tx.executeSql('DROP TABLE IF EXISTS ABOUT_US');

    tx.executeSql('CREATE TABLE FESTIVALS(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), country_id INTEGER, latitude FLOAT, longitude FLOAT,  city VARCHAR(255), ' +
        'logo VARCHAR(255), map VARCHAR(255), updated_at DATETIME)');
    tx.executeSql('CREATE TABLE SHOWS(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), festival_id INTEGER, stage_id INTEGER, ' +
        'day_id INTEGER, photo VARCHAR(255), time TIME, no_date BOOLEAN, no_hours BOOLEAN, no_stage BOOLEAN, updated_at DATETIME)');
    tx.executeSql('CREATE TABLE DAYS(id INTEGER PRIMARY KEY AUTOINCREMENT, festival_id INTEGER, date DATETIME, opening_time TIME, closing_time TIME, updated_at DATETIME)');
    tx.executeSql('CREATE TABLE STAGES(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), festival_id, updated_at DATETIME)');
    tx.executeSql('CREATE TABLE COUNTRIES(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), updated_at DATETIME, flag VARCHAR(255))');
    tx.executeSql('CREATE TABLE VIDEOS(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), show_id INTEGER, url VARCHAR(255), updated_at DATETIME)');
    tx.executeSql('CREATE TABLE ABOUT_US(id INTEGER PRIMARY KEY, title VARCHAR(255), text TEXT(2048), updated_at DATETIME)');
    tx.executeSql('CREATE TABLE LANGUAGES(id INTEGER PRIMARY KEY, name VARCHAR(255), updated_at DATETIME)');
    tx.executeSql('CREATE TABLE TRANSLATIONS(id INTEGER PRIMARY KEY, language_id INTEGER, festival_id INTEGER, show_id INTEGER, method_name VARCHAR(255), text TEXT(2048), updated_at DATETIME)');

    $.getJSON("http://festivall.eu/festivals.json?callback=?", function(data) {
        localStorage.setItem("migration_version", data['migration_version']);
        insertData(data);
    });

}

function insertData(data){
    $.each(data, function(k,v){
        switch(k){
            case 'festivals':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO FESTIVALS (id, name, country_id, latitude, longitude, city, logo, map, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', " +
                            l.country_id + ", '" +
                            l.latitude + "', '" +
                            l.longitude +"', '" +
                            l.city.replace(/'/g, "''") + "', '" +
                            l.logo.replace(/'/g, "''") +"', '" +
                            l.map.replace(/'/g, "''") + "', '" +
                            l.updated_at +"')");
                    });
                }, errorCB, successCB);
                break;
            case 'stages':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO STAGES (id, name, festival_id, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', " +
                            l.festival_id + ", '" +
                            l.updated_at + "')");
                    });
                }, errorCB,  successCB);
                break;
            case 'days':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO DAYS (id, festival_id, date, opening_time, closing_time, updated_at) VALUES (" +
                            l.id + ", " +
                            l.festival_id + ", '" +
                            l.date + "', '" +
                            l.opening_time + "', '" +
                            l.closing_time + "', '" +
                            l.updated_at +"')");
                    });
                }, errorCB, successCB);
                break;
            case 'countries':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO COUNTRIES (id, name, flag, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', '" +
                            l.flag.replace(/'/g, "''") + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'shows':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO SHOWS (id, name, festival_id, stage_id, day_id, photo, time, no_date, no_hours, no_stage, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', " +
                            l.festival_id + ", " +
                            l.stage_id + ", " +
                            l.day_id + ", '" +
                            l.photo + "', '" +
                            l.time + "', '" +
                            l.no_date + "', '" +
                            l.no_hours + "', '" +
                            l.no_stage + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'videos':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO VIDEOS (id, name, show_id, url, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', " +
                            l.show_id + ", '" +
                            l.url.replace(/'/g, "''") + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'about_us':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO ABOUT_US (id, title, text, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.title.replace(/'/g, "''") + "', '" +
                            l.text.replace(/'/g, "''") + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'languages':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO LANGUAGES (id, name, updated_at) VALUES (" +
                            l.id + ", '" +
                            l.name.replace(/'/g, "''") + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'translations':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("INSERT OR REPLACE INTO TRANSLATIONS (id, language_id, festival_id, show_id, method_name, text, updated_at) VALUES (" +
                            l.id + ", " +
                            l.language_id + ", " +
                            l.festival_id + ", " +
                            l.show_id + ", '" +
                            l.method_name + "', '" +
                            l.text.replace(/'/g, "''") + "', '" +
                            l.updated_at + "')");
                    });
                }, errorCB, successCB);
                break;
            case 'deleted_items':
                db.transaction(function(tx){
                    $.each(v, function(i, l){
                        tx.executeSql("DELETE FROM " + l.table.toString().toUpperCase() +  " WHERE id=" + l.element);
                    });
                }, errorCB, successCB);
                updateLastSync();
                break;
        }
    });

}

//Updates de timestamp of 'a' festival with the date of the most recent synchronization
function updateLastSync(){
    db.transaction(
        function(tx) {
            var sql = "SELECT MAX(lastSync) as lastSync FROM("
                + "SELECT MAX(updated_at) as lastSync FROM FESTIVALS UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM SHOWS UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM DAYS UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM STAGES UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM VIDEOS UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM ABOUT_US UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM LANGUAGES UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM TRANSLATIONS UNION ALL "
                + "SELECT MAX(updated_at) as lastSync FROM COUNTRIES)";

            tx.executeSql(sql, [],
                function(tx, results) {
                    var last_sync = results.rows.item(0).lastSync;
                    console.log('UPDATING LASTSYNC WITH : ' + last_sync);
                    localStorage.setItem("lastSync", last_sync);
                }, errorQueryCB);
        }, function(){
            console.log("ERROR UPDATING LASTSYNC");
        }, successCB
    );


    //Changes firstRun variable to true
    if(localStorage["firstRun"] == 'true'){
        console.log("COMPLETING FIRST RUN");
        //English as default language
        setLanguageVariable('1');
        //Portugal as default country
        localStorage.setItem('country_id', 1);
        //(lol, 30-05-14 benfica campeão eu estive aqui)
    }
    setTimeout(createFestivalsContainer(), 1000);
}


// Transaction success callback
function successCB() {
    //console.log("Transaction Success: "+ x.message+", "+ x.code);
}

// Transaction error callback
function errorCB(err) {
    //alert("Error processing SQL: " + err + ", " + err.message + ", " + err.code);
    //console.log("Error processing SQL: " + err.code + " : " + err.message);
}

function errorQueryCB(tx, err){
    //alert("Error processing SQL query: " + err + ", " + err.message + ", " + err.code);
    //console.log("Error processing SQL query: " + err.code + " : " + err.message);
}