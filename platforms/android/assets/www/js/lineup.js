// LINEUP_CONTAINER

var lineup_nav_items = [];
var current_linup_page = 0;
var lineup_carousel = {};

function initLineupCarousel(carousel){
    lineup_carousel[carousel] = new Swiper(carousel,{
        loop:false,
        grabCursor: true,
        speed:500,
        onSlideChangeStart: function(){
            createPagingSwipeBar(lineup_carousel[carousel].activeIndex, lineup_nav_items);
        }
    });

    bindClickToNavBar(lineup_nav_items, lineup_carousel[carousel]);
}

// Queries the local Database for a show
function createLineupContainer(festival_id){
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM DAYS WHERE FESTIVAL_ID='+festival_id + ' ORDER BY date', [], queryLineupSuccess, errorQueryCB);
    }, errorCB);
}

// Success callback for the the query of one festival
function queryLineupSuccess(tx, results) {

    $('#lineup_days_scroll_wrapper').empty().append('<ul id="lineup_days_buttons" class="nav_top"></ul>');

    $('#lineup_stages_bar').empty();
    $('#lineup_shows').empty();

    $('#header_link').unbind().bind('click', function(){
        createFestivalContainer(current_festival_id);
    });

    var days = results.rows;

    //Gets stages id's and names
    var stages = [];
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM STAGES WHERE FESTIVAL_ID='+days.item(0).festival_id , [],
            function(tx,results){
                for(var j = 0; j<results.rows.length; j++)
                    stages[j] = {"name":results.rows.item(j).name, "id":results.rows.item(j).id};

                buildLineup(stages, days);
            }, errorQueryCB);
    }, errorCB);
}

function buildLineup(stages, days){

    if(stages.length >0){
        var days_length = days.length;
        for(var i = 0; i<days_length; i++){
            var day = days.item(i);

            $('#lineup_shows').append('' +
                '<div id="lineup_day_' + day.id + '_stages" class="lineup_day_stages swiper-container">' +
                '<div class="scroll_wrapper swiper-wrapper"></div>' +
                '</div>');


            if(i==0) //First day lineup shows on page open
                $('#lineup_day_' + day.id + '_stages').addClass('active');


            for(var s = 0; s < stages.length; s++)
                (function(day,stage,stages_length,s,day_i,days_length){ //manha gigante, pouco legivel
                    var day_opening_time = day.opening_time;
                    var day_closing_time = day.closing_time;

                    db.transaction(function(tx){
                        tx.executeSql('SELECT * FROM (SELECT * FROM SHOWS' +
                                ' WHERE festival_id=' + day.festival_id + ' AND stage_id=' + stage.id + ' AND day_id=' + day.id +
                                ' AND TIME(REPLACE(REPLACE(TIME,"Z",""),"T"," "))>=TIME(REPLACE("' + day_opening_time + '","T"," ")) ORDER BY TIME)' +
                                ' UNION ALL SELECT * FROM (SELECT * FROM SHOWS' +
                                ' WHERE festival_id=' + day.festival_id + ' AND stage_id=' + stage.id + ' AND day_id=' + day.id +
                                ' AND TIME(REPLACE(REPLACE(TIME,"Z",""),"T"," "))<=TIME(REPLACE("' + day_closing_time + '","T"," ")) ORDER BY TIME)', [],

                            function(tx,results){
                                var shows = results.rows;

                                //append day:stage frame
                                $('#lineup_day_' + day.id + '_stages .swiper-wrapper').append('<div id="' + day.id + '_' + stage.id + '_lineup_frame" class="swiper-slide"></div>');

                                var show, show_time;
                                if(shows.length > 0)
                                    for(var l = 0; l < shows.length; l++){
                                        show = shows.item(l);
                                        show_time = show.time.slice(11,16);

                                        $('#' + day.id + '_' + stage.id + '_lineup_frame').append('' +
                                            '<li id="lineup_show_' + show.id + '" class="row content-slide">' +
                                            '<div class="show_time column fixed bdr_r"></div>' +
                                            '<div class="column"><h3 class="band_name">' + show.name + '</h3></div>' +
                                            '</li>');

                                        if(show.no_hours === "true")
                                            $('#lineup_show_' + show.id + ' .show_time').text('--:--');
                                        else
                                            $('#lineup_show_' + show.id + ' .show_time').text(show_time);

                                        (function (show_name){
                                            $('#lineup_show_' + show.id).unbind().bind('click', function(){
                                                createShowContainer(this.id.replace("lineup_show_", ""));
                                                changeContainers("#show", show_name, current_festival_name);
                                            });
                                        })(show.name);
                                    }

                                else
                                    $('#' + day.id + '_' + stage.id + '_lineup_frame').append('' +
                                        '<div class="padded content-slide">' +
                                        '<p>' + dictionary[localStorage['language']]['no_shows_for_this_stage_on_this_day'] + '</p>' +
                                        '</div>');

                                //ultimo palco
                                if(s == (stages_length-1)){
                                    finishLineupStage(day, stages, days_length, '#lineup_day_' + day.id + '_stages');
                                    initLineupCarousel('#lineup_day_' + day.id + '_stages');
                                }

                                //só inicia o scroll lineup_days se houver mais que 4 dias
                                if(day_i == (days_length-1) && s == (stages_length-1) && days_length > 4)
                                    $('#lineup_days_buttons').addClass('horizontal_scroll_wrapper');

                            }, errorQueryCB);
                    }, errorCB);
                })(day,stages[s], stages.length, s, i, days_length);
        }
    }
    else{
        $('#lineup_shows').append('' +
            '<div class="padded">' +
            '<p>Cartaz ainda não disponível.</p>' +
            '</div>');
        changeContainers("#lineup", current_festival_name, "Cartaz");
    }
}

function appendStagesToNavBar(day, stages){
    var lineup_stages_nav_bar = $('#lineup_stages_bar');
    lineup_stages_nav_bar.empty();

    for(var p = 0; p < stages.length; p++){
        lineup_nav_items[p] = '#day_' + day.id + '_stage_' + stages[p].id + '_nav_item';

        if(p==0)
            lineup_stages_nav_bar.append('' +
                '<li><a id="day_' + day.id + '_stage_' + stages[p].id + '_nav_item" class="current" href="#">' + stages[p].name + '</a></li>');
        else
            lineup_stages_nav_bar.append('' +
                '<li><a id="day_' + day.id + '_stage_' + stages[p].id + '_nav_item" href="#">' + stages[p].name + '</a></li>');
    }
}

function finishLineupStage(day, stages, days_length, carousel){
    appendStagesToNavBar(day, stages);

    var show_day = day.date.slice(8,10);
    var numeric_month = day.date.slice(5,7);
    var month = changeNumberToMonthAbrev(numeric_month);

    $('#lineup_days_buttons').append('<li id="lineup_day_' + day.id + '_button" class="column">' +
        '<a class="item">' +  show_day + ' ' + month + '</a></li>');


    //Resize the lineup buttons according to their number
    var width;
    switch (days_length){
        case 1:
            width = String(window.innerWidth);
            break;
        case 2:
            width = String(window.innerWidth/2);
            break;
        case 3:
            width = String(window.innerWidth/3);
            break;
        case 4:
            width = String(window.innerWidth/4);
            break;
    }
    var lineup_day_button_selector = $('#lineup_day_' + day.id + '_button');
    lineup_day_button_selector.css("width", width + 'px');

    if(days_length <= 4)
        $('#lineup_days_buttons .item').css('width', '100%');

    $('#lineup_days_buttons .column').eq(0).addClass('current');


    lineup_day_button_selector.unbind().bind('click', function(){
        var day_id = this.id.replace('lineup_day_', '').replace('_button', '');

        //set visibility to the correct lineup_day_frame
        $('.lineup_day_stages').removeClass('active');
        $('#lineup_day_' + day_id + '_stages').addClass('active');
        $('#lineup_days_buttons .column').removeClass('current');
        $(this).addClass('current');

        var swipe_bar_list = $('#lineup_stages_bar');
        swipe_bar_list.find('a').removeClass('current');
        swipe_bar_list.removeClass('middle last').addClass('first');
        swipe_bar_list.find('a').first().addClass('current');

        bindClickToNavBar(lineup_nav_items, lineup_carousel[carousel]);

        lineup_carousel[carousel].swipeTo(0, 200);
    });
}