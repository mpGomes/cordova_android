// SHOWS_CONTAINER

function createShowsContainer(festival_id){

    db.transaction(function (tx){
        tx.executeSql('SELECT SHOWS.*, STAGES.NAME AS stage_name, DAYS.DATE AS day_date ' +
            'FROM SHOWS LEFT JOIN STAGES ON STAGES.ID = SHOWS.STAGE_ID LEFT JOIN DAYS ON DAYS.ID = SHOWS.DAY_ID ' +
            'WHERE SHOWS.FESTIVAL_ID='+festival_id +' ORDER BY SHOWS.NAME', [], queryShowsSuccess, errorQueryCB);
    }, errorCB);
}

// Success callback for the query all the shows of one festival
function queryShowsSuccess(tx, results) {

    var shows = results.rows;
    var shows_length = shows.length;
    var show, show_id, show_time;
    var show_name_letter, show_name_previous_letter, numeric_month, show_day, month;
    $('#shows_page_list').empty();


    $('#header_link').unbind().bind('click', function(){
        createFestivalContainer(current_festival_id);
    });

    if (shows_length > 0)
        for (var i=0; i<shows_length; i++){
            show = shows.item(i);
            show_id = shows.item(i).id;
            show_time = show.time.slice(11,16);
            numeric_month = show.day_date.slice(5,7);
            show_name_letter = show.name.slice(0,1);

            month = changeNumberToMonthAbrev(numeric_month);
            show_day = show.day_date.slice(8,10);

            if(show_name_letter != show_name_previous_letter){
                $('#shows_page_list').append('<li id="show_letter_' + show_name_letter.charCodeAt(0) +'"></li>');

                $('#show_letter_' + show_name_letter.charCodeAt(0)).append(
                        '<header class="list_header row"><span>' + show_name_letter + '</span></header>' +
                        '<ul id="show_list_letter_' + show_name_letter.charCodeAt(0) +'" class="list"></ul>');
            }

            $('#show_list_letter_'+show_name_letter.charCodeAt(0)).append(
                    '<li id="show_' + show_id + '" class="row">' +
                    '<div class="column fixed bdr_r">' +
                    '<span class="show_date">' + show_day + " " + month + '</span>' +
                    '<span class="show_time">' + show_time + '</span>' +
                    '</div>' +
                    '<div class="column">' +
                    '<h3 class="band_name">' + show.name + '</h3>' +
                    '<p class="stage_name">' + show.stage_name + '</p>' +
                    '</div>' +
                    '</li>');

            if(show.no_hours === "true")
                $('#show_'+show_id + ' .show_time').text("--:--");
            if(show.no_date === "true")
                $('#show_'+show_id + ' .show_date').text(dictionary[localStorage['language']]['tba']);


            (function (show_name){
                $('#show_'+show_id).unbind().bind('click', function(){
                    createShowContainer(this.id.replace("show_", ""));
                    changeContainers("#show", show_name, current_festival_name);
                });
            })(show.name);

            show_name_previous_letter = show_name_letter;
        }
    else
        $('#shows_page_list').append('<div class="padded"><p>' + dictionary[localStorage['language']]['no_bands_for_this_festival_yet'] + '</p></div>');
}

function changeNumberToMonthAbrev(numeric_month){
    var month;
    switch(numeric_month){
        case "01":
            month = dictionary[localStorage['language']]['jan'];
            break;
        case "02":
            month = dictionary[localStorage['language']]['feb'];
            break;
        case "03":
            month = dictionary[localStorage['language']]['mar'];
            break;
        case "04":
            month = dictionary[localStorage['language']]['apr'];
            break;
        case "05":
            month = dictionary[localStorage['language']]['may'];
            break;
        case "06":
            month = dictionary[localStorage['language']]['jun'];
            break;
        case "07":
            month = dictionary[localStorage['language']]['jul'];
            break;
        case "08":
            month = dictionary[localStorage['language']]['aug'];
            break;
        case "09":
            month = dictionary[localStorage['language']]['sep'];
            break;
        case "10":
            month = dictionary[localStorage['language']]['oct'];
            break;
        case "11":
            month = dictionary[localStorage['language']]['nov'];
            break;
        case "12":
            month = dictionary[localStorage['language']]['dec'];
            break;
    }
    return month;
}