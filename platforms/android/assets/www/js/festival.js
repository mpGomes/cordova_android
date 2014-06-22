// FESTIVAL_CONTAINER

var current_festival_id, current_festival_name, festival_container, status;
var during_festival_carousel;

// Queries the local Database for a festival
function createFestivalContainer(festival_id){

    db.transaction(function (tx) {
        tx.executeSql("SELECT FESTIVALS.*, FESTIVALS.id AS f_id, DAYS.*, DAYS.id AS day_id, TRANSLATIONS.* " +
            "FROM FESTIVALS LEFT JOIN DAYS ON FESTIVALS.id = DAYS.festival_id " +
            "LEFT JOIN TRANSLATIONS ON FESTIVALS.id = TRANSLATIONS.festival_id AND TRANSLATIONS.method_name='tickets_price' " +
            "AND TRANSLATIONS.language_id="+localStorage['language_id'] + " " +
            "WHERE FESTIVALS.id="+festival_id + " " +
            "ORDER BY DAYS.date", [], queryFestivalSuccess, errorQueryCB);
    }, errorCB);
}

// Success callback for the the query of one festival
function queryFestivalSuccess(tx, results) {

    var festival = results.rows.item(0);
    var festivals = results.rows;
    var festival_date = festival.date.toString().replace(/-/g,'/');
    window.current_time = new Date().getTime();

    //falta ver quando um festival tem interregnos no meio sem dias de festival checkIfDuringFestival()
    var first_day_date = new Date(festival_date).getTime();

    var diff = first_day_date - current_time;

    current_festival_id = festival.f_id;
    current_festival_name = festival.name;

    $('#header_link').unbind().bind('click', function(){
        changeContainers("#festivals", "FestivAll", "");
        fixHeaderLink("#festivals");
        history_array.pop();
    });

    var last_closing_time = getLastDayClosingTime(festivals);

    //after festival
    if (current_time > last_closing_time){
        festival_container = "before";
        status = "after";
        createBeforeFestival(festival, festivals, 0, status);
    }
    //before festival
    else if(diff > 0){
        festival_container = "before";
        status = "before";
        createBeforeFestival(festival, festivals, diff, status);
    }
    //during festival
    else if (diff < 0){
        var curr_time = current_time;
        var closest_closing_time = {"diff":9007199254740992,"day":undefined };
        var during = false;

        for(var i = 0; i< festivals.length; i++){
            var day = festivals.item(i);
            var day_date = toDate(day.date);
            var day_time = new Date(day_date[0], day_date[1], day_date[2]).getTime();

            var closing_time = new Date(day_date[0], day_date[1], day_date[2]).getTime() + 24*60*60*1000 + getMiliSeconds(day.closing_time);

            if (curr_time >= day_time && curr_time <= closing_time){
                var aux_diff = closing_time - curr_time;
                if (aux_diff < closest_closing_time["diff"])
                    closest_closing_time = {"diff":aux_diff, "day":day };
                during = true;
            }
        }

        //in between days
        if (!during){
            festival_container = "before";
            status = "in_between";
            createBeforeFestival(festival, festivals, 0, status);
        }
        //during festival day
        else{
            createDuringFestival(closest_closing_time["day"], festivals);
            festival_container = "during";
        }
    }

    changeContainers('#' + festival_container + '_festival', current_festival_name, "");
}

//Obter o tempo de fecho do festival
function getLastDayClosingTime(days){
    var result = 0;
    for(var i = 0; i< days.length; i++){
        var day = days.item(i);
        var day_date = toDate(day.date);

        var closing_time = new Date(day_date[0], day_date[1], day_date[2]).getTime() + 24*60*60*1000 + getMiliSeconds(day.closing_time);
        if (closing_time > result)
            result = closing_time;
    }
    return result;
}

function createBeforeFestival(festival, days, diff, status){

    var festival_days_selector = $('#festival_days');
    festival_days_selector.empty();

    if(festival.city !== null)
        $('#festival_city').text(dictionary[localStorage['language']]['place'] + ": " + festival.city);

    if(festival.text === null)
        $('#festival_price').text(dictionary[localStorage['language']]['price'] + ": ---");
    else
        $('#festival_price').text(dictionary[localStorage['language']]['price'] + ": " + festival.text);


    $('.festival_poster').height($('.festival_poster').width());
    $('#festival_poster').attr("src", festival.logo);

    if(status == "before"){
        $('.countdown_bg').attr('src', 'img/countdown_bg.png');

        var dhms = dhm(diff).toString();
        var countdown_days = String(dhms.split(':')[0]);

        var festival_countdown_days_selector = $('#festival_countdown_days');
        countdown_days = parseInt(countdown_days) + 1;
        festival_countdown_days_selector.text(countdown_days);

        //numero de digitos (falta 1 / 10 / 100 dias)
        switch (countdown_days.toString().length) {
            case 1:
                festival_countdown_days_selector.addClass('one');
                break;
            case 2:
                festival_countdown_days_selector.addClass('two');
                break;
            case 3:
                festival_countdown_days_selector.addClass('three');
                break;
        }

        $('#festival_left_word').text(dictionary[localStorage['language']]['remaining']);

        if(countdown_days == 1)
            $('#festival_days_word').text(dictionary[localStorage['language']]['day']);
        else
            $('#festival_days_word').text(dictionary[localStorage['language']]['days']);

    }
    else if(status == "in_between"){
        //alert("in between");
        //to do
    }
    else if(status == "after"){
        $('.countdown_bg').attr('src', 'img/festival-after.png');
        $('#festival_countdown_days').empty();
        $('#festival_left_word').empty();
        $('#festival_days_word').empty();
    }

    addFestivalDays(days, festival_days_selector);
    bindClickToNavBottom("before", festival);
}


function addFestivalDays(festivals, festival_days_selector){
    var festival, festival_day, festival_day_first_number, festival_day_second_number,
        festival_month, numeric_month, next_numeric_month, festival_next_month;

    for(var i = 0; i < festivals.length; i++){
        festival = festivals.item(i);

        festival_day = festival.date.slice(8,10);
        festival_day_first_number = festival_day.slice(0,1).replace("0", "");
        festival_day_second_number = festival_day.slice(1,2);
        festival_day = festival_day_first_number + festival_day_second_number;

        numeric_month = festival.date.slice(5,7);
        festival_month = changeNumberToMonth(numeric_month);

        if(festivals.length == 1)
            festival_days_selector.append(festival_day + " " + festival_month);
        else{
            if(i < festivals.length - 2){
                next_numeric_month = festivals.item(i+1).date.slice(5,7);
                festival_next_month = changeNumberToMonth(next_numeric_month);

                if(festival_month == festival_next_month)
                    festival_days_selector.append(festival_day + ", ");
                else
                    festival_days_selector.append(festival_day + " " + festival_month);
            }
            else if(i == festivals.length - 2){
                next_numeric_month = festivals.item(i+1).date.slice(5,7);
                festival_next_month = changeNumberToMonth(next_numeric_month);

                if(festival_month == festival_next_month)
                    festival_days_selector.append(festival_day);
                else
                    festival_days_selector.append(festival_day + " " + festival_month);
            }
            else
                festival_days_selector.append(" " + dictionary[localStorage['language']]['and'] + " " + festival_day + " " + festival_month);
        }
    }
}

function createDuringFestival(festival, days){
    db.transaction(function (tx){
        tx.executeSql('SELECT * FROM STAGES WHERE STAGES.festival_id=' + festival.f_id,[],
            function(tx,results){
                var stages = results.rows;
                var stages_length = stages.length;
                var stage, stage_id;

                var festival_during_days_selector = $('#festival_during_days');
                festival_during_days_selector.empty();
                addFestivalDays(days, festival_during_days_selector);

                if(festival.city === "null")
                    $('#festival_during_city').hide();
                else{
                    $('#festival_during_city').show();
                    $('#festival_during_city_span').text(festival.city);
                }

                if(!festival.text)
                    $('#festival_during_price').hide();
                else{
                    $('#festival_during_price').show();
                    $('#festival_during_price_span').text(festival.text);
                }

                $('.festival_during_poster').height($('.festival_during_poster').width());
                $('#festival_during_poster').attr("src", festival.logo);

                $('#festival_during_shows').empty();

                if(stages_length > 0){
                    for(var i = 0; i<stages_length; i++){console.log(festival);
                        stage = stages.item(i);
                        (function(stage){ //manha gigante, pouco legivel
                            db.transaction(  function(tx){
                                tx.executeSql('SELECT * FROM (SELECT * FROM SHOWS ' +
                                        ' WHERE SHOWS.festival_id=' + festival.f_id + ' AND SHOWS.stage_id=' + stage.id + ' AND SHOWS.day_id = ' + festival.day_id +
                                        ' AND TIME(REPLACE(REPLACE(TIME,"Z",""),"T"," "))>=TIME(REPLACE("' + festival.opening_time + '","T"," ")) ORDER BY TIME)' +
                                        ' UNION ALL SELECT * FROM (SELECT * FROM SHOWS ' +
                                        ' WHERE SHOWS.festival_id=' + festival.f_id + ' AND SHOWS.stage_id=' + stage.id + ' AND SHOWS.day_id = ' + festival.day_id +
                                        ' AND TIME(REPLACE(REPLACE(TIME,"Z",""),"T"," "))<=TIME(REPLACE("' + festival.closing_time + '","T"," ")) ORDER BY TIME)',
                                    [],
                                    function(tx,results){
                                        var shows = results.rows;
                                        var curr_index = - 1;

                                        var shows_length = shows.length;
                                        $('#festival_during_shows').append(
                                                '<div class="row during_festival_header"><span>' + stage.name + '</span></div>' +
                                                '<div id="during_festival_' + stage.id + '_carousel" class="list swiper-container">' +
                                                '<ul class="swiper-wrapper"></ul>' +
                                                '</div>');

                                        if(shows_length > 0)
                                            for(var j = 0; j < shows_length; j++){
                                                var show = shows.item(j);

                                                $('#during_festival_' + stage.id + '_carousel .swiper-wrapper').append(
                                                        '<li id="during_festival_show_'+ show.id + '" class="row swiper-slide">' +
                                                        '<div class="content-slide">' +
                                                        '<span class="column icon_swipe_left"></span>' +
                                                        '<div class="column during_festival_column">' +
                                                        '<h3 class="band_name">' + show.name + '</h3>' +
                                                        '<span id="show_curr_icon' + show.id + '_' + stage.id +'"></span>' +
                                                        '<span class="current_show">' + show.time.slice(11,16) + '</span>' +
                                                        '</div>' +
                                                        '<span class="column icon_swipe_right"></span>' +
                                                        '</div>' +
                                                        '</li>');

                                                //tirar a seta para a esquerda na 1ºbanda
                                                if(j==0)
                                                    $('#during_festival_show_'+ show.id + ' .icon_swipe_left').remove();

                                                //tirar a seta para a direita na ultima banda
                                                if(j==shows_length - 1)
                                                    $('#during_festival_show_'+ show.id + ' .icon_swipe_right').remove();

                                                //banda a actuar agora
                                                if(checkIfCurrentShow(shows, j, festival.date, festival.opening_time, festival.closing_time)){
                                                    $('#show_curr_icon' + show.id + '_' + stage.id).addClass('icon_current_show');
                                                    curr_index = j;
                                                }

                                                (function (show_name){
                                                    $('#during_festival_show_' + show.id ).unbind().bind('click', function(){
                                                        createShowContainer(this.id.replace("during_festival_show_", ""));
                                                        changeContainers("#show", show_name, current_festival_name);
                                                    });
                                                })(show.name);
                                            }

                                        else
                                            $('#during_festival_' + stage.id + '_carousel .swiper-wrapper').append(
                                                    '<li class="row swiper-slide">' +
                                                    '<div class="content-slide">' +
                                                    '<div class="column during_festival_column">' +
                                                    '<h3 class="band_name">' + dictionary[localStorage['language']]['no_bands_for_this_stage'] + '</h3>' +
                                                    '</div>' +
                                                    '</div>' +
                                                    '</li>');

                                        initDuringFestivalCarousel('#during_festival_' + stage.id + '_carousel');

                                        if(curr_index != -1)
                                            during_festival_carousel.swipeTo(curr_index, 150);
                                    },errorQueryCB);
                            }, errorCB);
                        })(stage);
                    }
                }
                else
                    $('#festival_during_shows').append(dictionary[localStorage['language']]['no_stages_for_this_festival']);

                bindClickToNavBottom("during", festival);

            }, errorQueryCB);
    }, errorCB);

}


function bindClickToNavBottom(festival_status, festival){
    $('#'+festival_status+'_shows_button').text(dictionary[localStorage['language']]['bands']).unbind().bind('click', function(){
        createShowsContainer(festival.f_id);
        changeContainers("#shows", current_festival_name, dictionary[localStorage['language']]['bands']);
    });

    $('#'+festival_status+'_lineup_button').text(dictionary[localStorage['language']]['lineup']).unbind().bind('click', function(){
        createLineupContainer(festival.f_id);
        changeContainers("#lineup", current_festival_name, dictionary[localStorage['language']]['lineup']);
    });

    $('#'+festival_status+'_info_button').text(dictionary[localStorage['language']]['info']).unbind().bind('click', function(){
        createInfoContainer(festival.f_id);
        changeContainers("#info", current_festival_name, dictionary[localStorage['language']]['info']);
    });

    $('#'+festival_status+'_map_button').text(dictionary[localStorage['language']]['map']).unbind().bind('click', function(){
        createMapContainer(festival);
        changeContainers("#map", current_festival_name, dictionary[localStorage['language']]['map']);
    });

}
function dhm(t){
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = '0' + Math.floor( (t - d * cd) / ch),
        m = '0' + Math.round( (t - d * cd - h * ch) / 60000);
    return [d, h.substr(-2), m.substr(-2)].join(':');
}

function changeNumberToMonth(numeric_month){
    var month;
    switch(numeric_month){
        case "01":
            month = dictionary[localStorage['language']]['january'];
            break;
        case "02":
            month = dictionary[localStorage['language']]['february'];
            break;
        case "03":
            month = dictionary[localStorage['language']]['march'];
            break;
        case "04":
            month = dictionary[localStorage['language']]['april'];
            break;
        case "05":
            month = dictionary[localStorage['language']]['may'];
            break;
        case "06":
            month = dictionary[localStorage['language']]['june'];
            break;
        case "07":
            month = dictionary[localStorage['language']]['july'];
            break;
        case "08":
            month = dictionary[localStorage['language']]['august'];
            break;
        case "09":
            month = dictionary[localStorage['language']]['september'];
            break;
        case "10":
            month = dictionary[localStorage['language']]['october'];
            break;
        case "11":
            month = dictionary[localStorage['language']]['november'];
            break;
        case "12":
            month = dictionary[localStorage['language']]['december'];
            break;
    }
    return month;
}


function initDuringFestivalCarousel(container){

    during_festival_carousel = new Swiper(container,{
        loop:false,
        grabCursor: true,
        speed:500
    });
}


//______________Functions for determining the current show______________________________________________________________



//returns the miliseconds equivalent of some Time(HH:MM:SS)
function getMiliSeconds(time){
    var hours = time.slice(11,13);
    var mins = time.slice(14,16);
    var minutes = parseInt(hours)*60 + parseInt(mins);

    return minutes*60*1000;
}

//Returns the start time in miliseconds of the next show
function getNextShowTime(show_time, shows, j, closing_time, day_time, opening_time,  next_day_time){
    var next_show_time = closing_time;
    if (j < shows.length-1){
        var next_show = shows.item(j+1);

        var next_show_time_test = day_time + getMiliSeconds(next_show.time);
        next_show_time_test = amPmTranslation(next_show_time_test, opening_time, closing_time, next_day_time, day_time );
        if (next_show_time_test >= show_time && next_show_time_test < next_show_time )
            next_show_time = next_show_time_test;
    }
    return next_show_time;
}


//Adds 24 hours to the show if its after mid-night
function amPmTranslation(show_time, opening_time, closing_time, next_day_time, day_time ){
    closing_time = closing_time - 24*60*60*1000;
    if (next_day_time >= show_time &&  show_time >= opening_time){
        //do nothing test
    }
    else if (day_time <= show_time && show_time <= closing_time){ //depois da meia-noite, acrescenta 24 hora ao show_time
        show_time = show_time + 24*60*60*1000;
    }

    return show_time;
}

function toDate(date){
    var year = parseInt(date.slice(0,4));
    var month = parseInt(date.slice(5,7))-1;//month in date is 0-11
    var day = parseInt(date.slice(8,10));
    return [year, month, day];
}

//checks if a show is currently playing on a stage
function checkIfCurrentShow(shows, j, date, opening_time, closing_time){
    var show = shows.item(j);

    var aux_date = toDate(date);

    var day_time = new Date(aux_date[0], aux_date[1], aux_date[2]).getTime();
    var next_day_time = new Date(aux_date[0], aux_date[1], aux_date[2]).getTime() + 24*60*60*1000; //dia + 24h

    var opening_time = new Date(aux_date[0], aux_date[1], aux_date[2]).getTime() + getMiliSeconds(opening_time);
    var closing_time = new Date(aux_date[0], aux_date[1], aux_date[2]).getTime() + 24*60*60*1000 + getMiliSeconds(closing_time);


    var show_time = new Date(aux_date[0], aux_date[1], aux_date[2]).getTime() + getMiliSeconds(show.time);

    show_time = amPmTranslation(show_time, opening_time, closing_time, next_day_time, day_time);
    var next_show_time = getNextShowTime(show_time, shows, j, closing_time, day_time, opening_time, next_day_time);

    return (next_show_time >= current_time && current_time >= show_time);
}