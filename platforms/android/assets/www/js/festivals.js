// FESTIVALS_CONTAINER


// Queries the local Database for all festivals
function createFestivalsContainer(){

    db.transaction(function queryFestivals(tx) {
        tx.executeSql('SELECT FESTIVALS.*, MIN(DAYS.date) as first_day ' +
            'FROM DAYS INNER JOIN FESTIVALS ' +
            'ON FESTIVALS.id = DAYS.festival_id ' +
            'WHERE FESTIVALS.country_id=' + localStorage['country_id'] + ' ' +
            'GROUP BY DAYS.festival_id ' +
            'ORDER BY first_day', [], queryFestivalsSuccess, errorQueryCB);
    }, errorCB, successCB);
}


// Callback for the festivals query
function queryFestivalsSuccess(tx, results) {
    //Create festivals container after insertions
    console.log("CREATING FESTIVALS CONTAINER")
    if(localStorage["firstRun"] == "true"){
        localStorage.setItem("firstRun", "false");
        $('#installer').removeClass('visible');
    }
    $('#festivals_buttons').empty();

    var festivals_length = results.rows.length;
    var festivals = results.rows;

    var ended_festivals = [];
    for (var i=0; i<festivals_length; i++){
        var festival = festivals.item(i);
        checkIfAfterFestival(festival.id, ended_festivals, i, festivals_length);
    }

    appendCountryToFestivals(festivals.item(0).country_id);
    changeContainers('#festivals', '', '');

}

function checkIfAfterFestival(festival_id, ended_festivals, i, festivals_length){
    var current_time = new Date().getTime();
    db.transaction(function (tx) {
        tx.executeSql('SELECT *, FESTIVALS.id AS id, DAYS.id as day_id ' +
            'FROM FESTIVALS INNER JOIN DAYS ON FESTIVALS.ID = DAYS.FESTIVAL_ID ' +
            'WHERE FESTIVALS.ID='+festival_id, [], function(tx,results){
            var closing_time = getLastDayClosingTime(results.rows);
            var festival = results.rows.item(0);

            if (current_time > closing_time)
                ended_festivals.push(festival);
            else
                addFestivalToList(festival, i, festivals_length);

            //add ended festivals
            if(i >= festivals_length-1 && ended_festivals.length > 0){
                //meter linha
                $('#festivals_buttons').append('<br><div id="festivals_line_break">' + dictionary[localStorage['language']]['finished'] + '</div>');
                for(var j = 0; j < ended_festivals.length; j++)
                    addFestivalToList(ended_festivals[j]);
            }
        }, errorQueryCB);
    }, errorCB, successCB);

}

function addFestivalToList(festival){
    $('#festivals_buttons').append('' +
        '<li id="festival_' + festival.id +'" class="item">' +
        '<a href="#"><img class="festival_logo_img" src="' + festival.logo + '"></a>' +
        '</li>');

    $('#festival_'+festival.id).unbind().bind('click', function() {
        createFestivalContainer(this.id.replace("festival_", ""));
    });

    //Check if the logo file exists
    var filename = festival.name + '.jpg';
    var hasLogo = localStorage[festival.name];
    var url = festival.logo;
    //Ajax call to download logo if it is not stored
    if(hasLogo == undefined || festival.logo != hasLogo){
        console.log('CHECKING LOGO: old logo :' + hasLogo + ', festival.Logo : ' + festival.logo);
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(filename, {create: true, exclusive: false}, function (fileEntry)  {
			//Might not sync correctly first time because of lag in syncronization
			var file_path = fileEntry.toURL();
			var fileTransfer = new FileTransfer();
			fileTransfer.download(
				url,
				file_path,
				function(entry) {
					console.log('SUCCESS DOWNLOAD LOGO FROM WITH URL:' + url);
					localStorage[festival.name] = url;
					addLogo(festival, file_path);  //Reads from the file
				},
				function(error) {
					console.log('ERROR DOWNLOAD LOGO FROM WITH URL:' + url);
					if(hasLogo != undefined)
						addLogo(festival, file_path);
                    }
                );
            });
        });
    }
    else{  //Reads from the file
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(filename, {create: true, exclusive: false}, function (fileEntry)  {
                var file_path = fileEntry.toURL();
                addLogo(festival, file_path);
            });
        });
    }
    //Cache the map of the festival
    cacheMap(festival);
}

//fail reading
function fail(evt) {
    console.log(' 000.ERROR : ' + evt.target.error.code);
}

function addLogo(festival, file_path){
    var dummy = makeid();
    //console.log('FETCHING LOGO :' + file_path);
    $('#festival_' + festival.id ).empty().append('<a href="#"><img class="festival_logo_img" src="' + file_path + '?dummy=' + dummy + '"></a>');;
}


function makeid(){
    var text = "";
    var possible = "0123456789";
    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function cacheMap(festival){
    //Check if the MAP file exists
    var filename = festival.name + '_map.jpg';
    var hasMap = localStorage[filename];
    var url = festival.map;
    //Ajax call to download logo if it is not stored
    if(festival.map != hasMap || hasMap == undefined ){
        console.log('CHECKING MAP: old map :' + hasMap + ', festival.map : ' + festival.map);
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(filename, {create: true, exclusive: false}, function (fileEntry) {
			    var file_path = fileEntry.toURL();
				var fileTransfer = new FileTransfer();
				fileTransfer.download(
					url,
					file_path,
					function(entry) {
						console.log('SUCCESS DOWNLOAD MAP FROM WITH URL:' + url);
						localStorage[festival.name + '_map.jpg'] = url;
					},
					function(error) {
						console.log('ERROR MAP FROM WITH FAIL, URL:' + url);
					}
				);
			});
        });
    }
}

function appendCountryToFestivals(country_id){
    db.transaction(function queryFestivalsCountry(tx) {
        tx.executeSql('SELECT COUNTRIES.* FROM COUNTRIES WHERE COUNTRIES.id=' + country_id,
            [], queryFestivalsCountrySuccess, errorQueryCB);
    }, errorCB, successCB);

}

// Callback for the festivals query
function queryFestivalsCountrySuccess(tx, results) {
    var country = results.rows.item(0);
    $('.festival_list .item').height($('.festival_list .item').width());
    $('#festivals_country_title span').text(country.name);
    $('#festivals_country_flag').attr('src', country.flag);
}