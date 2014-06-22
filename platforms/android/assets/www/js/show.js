// SHOW_CONTAINER


// Queries the local Database for a show
function createShowContainer(show_id){

    db.transaction(function (tx) {
        tx.executeSql('SELECT SHOWS.*, SHOWS.festival_id AS f_id, STAGES.NAME AS stage_name, DAYS.DATE AS day_date, ' +
            'FESTIVALS.NAME AS festival_name, TRANSLATIONS.* ' +
            'FROM SHOWS LEFT JOIN STAGES ON SHOWS.STAGE_ID = STAGES.ID LEFT JOIN DAYS ON SHOWS.DAY_ID = DAYS.ID ' +
            'LEFT JOIN FESTIVALS ON SHOWS.FESTIVAL_ID = FESTIVALS.ID LEFT JOIN TRANSLATIONS ON SHOWS.ID = TRANSLATIONS.SHOW_ID ' +
            'AND TRANSLATIONS.LANGUAGE_ID='+localStorage['language_id'] + ' ' +
            'WHERE SHOWS.ID='+show_id , [], queryShowSuccess, errorQueryCB);

        tx.executeSql('SELECT * FROM VIDEOS WHERE SHOW_ID='+show_id, [], queryShowVideosSuccess, errorQueryCB);
    }, errorCB);

    $('.swipe_bar_list').removeClass('middle last').addClass('first');
    $('#show_nav_item').text(dictionary[localStorage['language']]['tickets']).addClass('current');
    $('#videos_nav_item').text(dictionary[localStorage['language']]['transports']).removeClass('current');
}

// Success callback for the the query of one festival
function queryShowSuccess(tx, results) {

    var show = results.rows.item(0);
    current_festival_id = show.f_id;

    if(show.text == undefined)
        $('#show_description').html(dictionary[localStorage['language']]['description_not_available_yet']);

    else
        $('#show_description').html(show.text.replace(/\r\n/g, "<br>"));


    $('#header_link').unbind().bind('click', function(){
        createFestivalContainer(show.f_id);
    });

    if(show.no_date !== "true"){
        var show_day = show.day_date.slice(8,10);
        var numeric_month = show.day_date.slice(5,7);
        var show_month = changeNumberToMonth(numeric_month);
    }


    $('#header_subtitle').text(show.festival_name);
    $('#show_nav_item').text(dictionary[localStorage['language']]['band']);
    $('#videos_nav_item').text(dictionary[localStorage['language']]['videos']);

    if(show.photo != "null" && show.photo != "")
        $('#show_photo').html('<img width="100%" src="' + show.photo + '">');
    else
        $('#show_photo').html('<img width="100%" src="img/placeholder.png">');

    if(show.no_stage === "true")
        $('#show_stage').text(dictionary[localStorage['language']]['stage_to_be_confirmed']);
    else
        $('#show_stage').text(show.stage_name);

    if(show.no_date === "true")
        $('#show_date').text(dictionary[localStorage['language']]['date_to_be_confirmed']);
    else
        $('#show_date').text(show_day + " " + show_month);

    var show_time = show.time.slice(11,16);
    if(show.no_hours === "true")
        $('#show_time').text(dictionary[localStorage['language']]['time_to_be_confirmed']);
    else
        $('#show_time').text(show_time);
}
