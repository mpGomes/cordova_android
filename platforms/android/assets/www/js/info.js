// INFO_CONTAINER
var info_carousel = false;

function initInfoCarousel(){

    info_carousel = new Swiper('#info',{
        loop:false,
        grabCursor: true,
        speed:500,
        onSlideChangeStart: function(){
            createPagingSwipeBar(info_carousel.activeIndex, ['#tickets_nav_item','#transports_nav_item','#weather_nav_item']);
        }
    });

    bindClickToNavBar(['#tickets_nav_item','#transports_nav_item','#weather_nav_item'], info_carousel);
}

// Queries the local Database for a show
function createInfoContainer(festival_id){

    $('#header_link').unbind().bind('click', function(){
        createFestivalContainer(festival_id);
    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT FESTIVALS.*, TRANSLATIONS.* ' +
            'FROM FESTIVALS LEFT JOIN TRANSLATIONS ON FESTIVALS.ID = TRANSLATIONS.FESTIVAL_ID ' +
            'AND TRANSLATIONS.LANGUAGE_ID='+localStorage['language_id'] + ' ' +
            'WHERE FESTIVALS.ID='+festival_id,
            [], queryInfoSuccess, errorCB);
    }, errorCB);

    $('.swipe_bar_list').removeClass('middle last').addClass('first');
    $('#tickets_nav_item').text(dictionary[localStorage['language']]['tickets']).addClass('current');
    $('#transports_nav_item').text(dictionary[localStorage['language']]['transports']).removeClass('current');
    $('#weather_nav_item').text(dictionary[localStorage['language']]['weather']).removeClass('current');
}

// Success callback for the the query info of one festival
function queryInfoSuccess(tx, results) {
    var festivals = results.rows;
    var festival = results.rows.item(0);
    var info_texts = '';
    var tickets_scroller_selector = $('#tickets_scroller');
    var transports_scroller_selector = $('#transports_scroller');

    for (var i=0; i<festivals.length; i++){
        if(festivals.item(i).text)
            info_texts = festivals.item(i).text.replace(/\r\n/g, "<br>");

        switch (festivals.item(i).method_name){
            case 'tickets_info':
                tickets_scroller_selector.html(info_texts);
                break;
            case 'transports_info':
                transports_scroller_selector.html(info_texts);
                break;
        }
        info_texts = '';
    }

    if (tickets_scroller_selector.is(':empty'))
        tickets_scroller_selector.html(dictionary[localStorage['language']]['description_not_available_yet']);
    if (transports_scroller_selector.is(':empty'))
        transports_scroller_selector.html(dictionary[localStorage['language']]['description_not_available_yet']);

    var latitude = festival.latitude;
    var longitude = festival.longitude;

    $('#weather_scroller').empty();
    if(latitude === "null" || longitude === "null")
        $('#weather_scroller').append('' +
            '<div class="padded weather_offline">' +
            '<p>' + dictionary[localStorage['language']]['impossible_to_get_weather_for_this_festival'] + '</p>' +
            '</div>');
    else
        $.ajax({
            type: 'GET',
            url: 'http://api.worldweatheronline.com/free/v1/weather.ashx?q='+
                latitude +'%2C' + longitude +'&format=json&num_of_days=5&key=dzh3ma5y6fhxfwuac5ceuyjd',
            contentType:'application/json',
            dataType: 'jsonp',
            timeout: 3000,
            success:function (data) {
                $.each(data, function(k,v){
                    $.each(v, function(weather_key, weather_value){
                        if(weather_key=="current_condition"){
                            $('#weather_scroller').append(
                                    '<div id="weather_current">' +
                                    '<div class="row">' +
                                    '<div class="column centered">' +
                                    '<img src="" id="weather_img_current">' +
                                    '<span id="weather_temperature_current"></span>' +
                                    '</div>' +
                                    '</div>' +
                                    '<p id="weather_description_current" class="row"></p>' +
                                    '</div>' +
                                    '<ul id="weather_list" class="list" style="width:100%"></ul>'
                            );
                            $.each(weather_value[0], function(temperature_key, temperature_value){
                                if(temperature_key=="temp_C")
                                    $('#weather_temperature_current').text(temperature_value + " ºC");

                                else if(temperature_key=="weatherDesc"){
                                    var weather_description_selector = $('#weather_description_current');
                                    $.each(temperature_value[0], function(desc_key, desc_value){
                                        weather_description_selector.html(translateWeatherDescription(desc_value));
                                    });
                                }
                                else if(temperature_key=="weatherIconUrl")
                                    $.each(temperature_value[0], function(icon_key, icon_value){
                                        icon_changed = changeWeatherIcon(icon_value);
                                        $('#weather_img_current').attr('src', icon_changed);
                                    });
                            });
                        }
                        var day_index, weather_day, numeric_month, weather_month, week_day, icon_changed;
                        if(weather_key=="weather"){
                            $('#weather_list').empty();
                            $.each(weather_value, function(day_key, day_value){
                                day_index = day_key + 1;
                                $('#weather_list').append('' +
                                        '<li id="weather_day' + day_index +'" class="row">' +
                                        '<div class="column centered">' +
                                        '<strong id="weather_weekday' + day_index +'" class="weather_weekday"></strong><br>' +
                                        '<span id="weather_date' + day_index +'" class="weather_date"></span>' +
                                        '</div>' +
                                        '<div class="column no_padding">' +
                                        '<img src="" id="weather_img' + day_index +'" class="weather_icon">' +
                                        '</div>' +
                                        '<div class="column weather_description">' +
                                        '<div id="weather_description' + day_index +'"></div>' +
                                        '</div>' +
                                        '<div class="column weather_temperature">' +
                                        '<span id="weather_max_temperature' + day_index +'" class="max"></span>' +
                                        '<span id="weather_min_temperature' + day_index +'" class="min"></span>' +
                                        '</div>' +
                                        '</li>');

                                $.each(day_value, function(temperature_key, temperature_value){
                                    if(temperature_key=="date"){
                                        weather_day = temperature_value.slice(8,10);
                                        numeric_month = temperature_value.slice(5,7);
                                        weather_month = changeNumberToMonthAbrev(numeric_month);
                                        week_day = new Date(2013, numeric_month-1, weather_day);
                                        $('#weather_weekday'+day_index).text(numberToWeekDay(week_day.getDay()));
                                        $('#weather_date'+day_index).text(weather_day + " " + weather_month);
                                    }
                                    else if(temperature_key=="tempMaxC")
                                        $('#weather_max_temperature'+day_index).text(temperature_value + "°");

                                    else if(temperature_key=="tempMinC")
                                        $('#weather_min_temperature'+day_index).text(temperature_value + "°");

                                    else if(temperature_key=="weatherDesc")
                                        $.each(temperature_value[0], function(desc_key, desc_value){
                                            description_changed = translateWeatherDescription(desc_value);
                                            $('#weather_description'+day_index).html(description_changed);
                                        });

                                    else if(temperature_key=="weatherIconUrl")
                                        $.each(temperature_value[0], function(icon_key, icon_value){
                                            icon_changed = changeWeatherIcon(icon_value);
                                            $('#weather_img'+day_index).attr('src', icon_changed);
                                        });

                                });
                            });
                        }
                    });
                });
            },
            error: function(model, response){
                $('#weather_scroller').append('' +
                    '<div class="padded weather_offline">' +
                    '<p>' + dictionary[localStorage['language']]['weather_connection_error'] + '</p>' +
                    '</div>');
            }
        });

}


function numberToWeekDay(weekday_number){
    var week_day;

    switch(weekday_number){
        case 0:
            week_day = dictionary[localStorage['language']]['sun'];
            break;
        case 1:
            week_day = dictionary[localStorage['language']]['mon'];
            break;
        case 2:
            week_day = dictionary[localStorage['language']]['tue'];
            break;
        case 3:
            week_day = dictionary[localStorage['language']]['wed'];
            break;
        case 4:
            week_day = dictionary[localStorage['language']]['thu'];
            break;
        case 5:
            week_day = dictionary[localStorage['language']]['fri'];
            break;
        case 6:
            week_day = dictionary[localStorage['language']]['sat'];
            break;
    }
    return week_day;
}

function translateWeatherDescription(desc_value){

    switch (desc_value){
        case "Moderate or heavy snow in area with thunder":
            desc_value = dictionary[localStorage['language']]['heavy_snow_with_thunder'];
            break;
        case "Patchy light snow in area with thunder":
            desc_value = dictionary[localStorage['language']]['light_snow_with_thunder'];
            break;
        case "Moderate or heavy rain in area with thunder":
            desc_value = dictionary[localStorage['language']]['heavy_rain_with_thunder'];
            break;
        case "Patchy light rain in area with thunder":
            desc_value = dictionary[localStorage['language']]['light_rain_with_thunder'];
            break;
        case "Moderate or heavy showers of ice pellets":
            desc_value = dictionary[localStorage['language']]['heavy_rain_with_sleet'];
            break;
        case "Light showers of ice pellets":
            desc_value = dictionary[localStorage['language']]['light_rain_with_sleet'];
            break;
        case "Light sleet showers":
            desc_value = dictionary[localStorage['language']]['light_rain_with_sleet'];
            break;
        case "Light snow showers":
            desc_value = dictionary[localStorage['language']]['light snow'];
            break;
        case "Moderate or heavy sleet showers":
            desc_value = dictionary[localStorage['language']]['rain_with_sleet'];
            break;
        case "Torrential rain shower":
            desc_value = dictionary[localStorage['language']]['torrential_rain'];
            break;
        case "Moderate or heavy rain shower":
            desc_value = dictionary[localStorage['language']]['moderate_or_heavy_rain'];
            break;
        case "Light rain shower":
            desc_value = dictionary[localStorage['language']]['light_rain'];
            break;
        case "Ice pellets":
            desc_value = dictionary[localStorage['language']]['sleet'];
            break;
        case "Heavy snow":
            desc_value = dictionary[localStorage['language']]['heavy_snow'];
            break;
        case "Patchy heavy snow":
            desc_value = dictionary[localStorage['language']]['heavy_snow'];
            break;
        case "Moderate snow":
            desc_value = dictionary[localStorage['language']]['moderate_snow'];
            break;
        case "Patchy moderate snow":
            desc_value = dictionary[localStorage['language']]['moderate_snow'];
            break;
        case "Light snow":
            desc_value = dictionary[localStorage['language']]['light_snow'];
            break;
        case "Patchy light snow":
            desc_value = dictionary[localStorage['language']]['light_snow'];
            break;
        case "Moderate or heavy sleet":
            desc_value = dictionary[localStorage['language']]['sleet'];
            break;
        case "Light sleet":
            desc_value = dictionary[localStorage['language']]['light_rain'];
            break;
        case "Moderate or Heavy freezing rain":
            desc_value = dictionary[localStorage['language']]['heavy_rain'];
            break;
        case "Light freezing rain":
            desc_value = dictionary[localStorage['language']]['light_rain'];
            break;
        case "Heavy rain":
            desc_value = dictionary[localStorage['language']]['heavy_rain'];
            break;
        case "Heavy rain at times":
            desc_value = dictionary[localStorage['language']]['heavy_rain_at_times'];
            break;
        case "Moderate rain":
            desc_value = dictionary[localStorage['language']]['moderate_rain'];
            break;
        case "Moderate rain at times":
            desc_value = dictionary[localStorage['language']]['moderate_rain_at_times'];
            break;
        case "Light rain":
            desc_value = dictionary[localStorage['language']]['light_rain'];
            break;
        case "Patchy light rain":
            desc_value = dictionary[localStorage['language']]['light_rain'];
            break;
        case "Heavy freezing drizzle":
            desc_value = dictionary[localStorage['language']]['heavy_drizzle'];
            break;
        case "Freezing drizzle":
            desc_value = dictionary[localStorage['language']]['drizzle'];
            break;
        case "Light drizzle":
            desc_value = dictionary[localStorage['language']]['light_drizzle'];
            break;
        case "Patchy light drizzle":
            desc_value = dictionary[localStorage['language']]['light_drizzle'];
            break;
        case "Freezing fog":
            desc_value = dictionary[localStorage['language']]['fog'];
            break;
        case "Fog":
            desc_value = dictionary[localStorage['language']]['fog'];
            break;
        case "Blizzard":
            desc_value = dictionary[localStorage['language']]['blizzard'];
            break;
        case "Blowing snow":
            desc_value = dictionary[localStorage['language']]['snow'];
            break;
        case "Thundery outbreaks in nearby":
            desc_value = dictionary[localStorage['language']]['storm'];
            break;
        case "Patchy freezing drizzle nearby":
            desc_value = dictionary[localStorage['language']]['light_drizzle'];
            break;
        case "Patchy sleet nearby":
            desc_value = dictionary[localStorage['language']]['sleet'];
            break;
        case "Patchy snow nearby":
            desc_value = dictionary[localStorage['language']]['snow'];
            break;
        case "Patchy rain nearby":
            desc_value = dictionary[localStorage['language']]['rain'];
            break;
        case "Mist":
            desc_value = dictionary[localStorage['language']]['mist'];
            break;
        case "Overcast":
            desc_value = dictionary[localStorage['language']]['cloudly'];
            break;
        case "Cloudy":
            desc_value = dictionary[localStorage['language']]['cloudly'];
            break;
        case "Partly Cloudy":
            desc_value = dictionary[localStorage['language']]['partly_cloudy'];
            break;
        case "Clear":
            desc_value = dictionary[localStorage['language']]['sunny'];
            break;
        case "Sunny":
            desc_value = dictionary[localStorage['language']]['sunny'];
            break;
    }
    return desc_value;
}

function changeWeatherIcon(weather_icon_url){
    var weather_icon;
    weather_icon_url = weather_icon_url.split('/');
    var weather_icon_url_splited = weather_icon_url[weather_icon_url.length -1];

    switch(weather_icon_url_splited){
        case "wsymbol_0001_sunny.png":
            weather_icon = "img/weather/sunny.png";
            break;
        case "wsymbol_0002_sunny_intervals.png":
            weather_icon = "img/weather/cloudy1.png";
            break;
        case "wsymbol_0003_white_cloud.png":
            weather_icon = "img/weather/cloudy5.png";
            break;
        case "wsymbol_0004_black_low_cloud.png":
            weather_icon = "img/weather/overcast.png";
            break;
        case "wsymbol_0006_mist.png":
            weather_icon = "img/weather/mist.png";
            break;
        case "wsymbol_0007_fog.png":
            weather_icon = "img/weather/fog.png";
            break;
        case "wsymbol_0008_clear_sky_night.png":
            weather_icon = "img/weather/sunny_night.png";
            break;
        case "wsymbol_0009_light_rain_showers.png":
            weather_icon = "img/weather/light_rain.png";
            break;
        case "wsymbol_0010_heavy_rain_showers.png":
            weather_icon = "img/weather/shower3.png";
            break;
        case "wsymbol_0011_light_snow_showers.png":
            weather_icon = "img/weather/snow2.png";
            break;
        case "wsymbol_0012_heavy_snow_showers.png":
            weather_icon = "img/weather/snow4.png";
            break;
        case "wsymbol_0013_sleet_showers.png":
            weather_icon = "img/weather/sleet.png";
            break;
        case "wsymbol_0016_thundery_showers.png":
            weather_icon = "img/weather/tstorm1.png";
            break;
        case "wsymbol_0017_cloudy_with_light_rain.png":
            weather_icon = "img/weather/light_rain.png";
            break;
        case "wsymbol_0018_cloudy_with_heavy_rain.png":
            weather_icon = "img/weather/shower3.png";
            break;
        case "wsymbol_0019_cloudy_with_light_snow.png":
            weather_icon = "img/weather/snow1.png";
            break;
        case "wsymbol_0020_cloudy_with_heavy_snow.png":
            weather_icon = "img/weather/snow4.png";
            break;
        case "wsymbol_0021_cloudy_with_sleet.png":
            weather_icon = "img/weather/sleet.png";
            break;
        case "wsymbol_0024_thunderstorms.png":
            weather_icon = "img/weather/tstorm3.png";
            break;
        case "wsymbol_0025_light_rain_showers_night.png":
            weather_icon = "img/weather/shower1_night.png";
            break;
        case "wsymbol_0026_heavy_rain_showers_night.png":
            weather_icon = "img/weather/shower2_night.png";
            break;
        case "wsymbol_0027_light_snow_showers_night.png":
            weather_icon = "img/weather/snow1_night.png";
            break;
        case "wsymbol_0028_heavy_snow_showers_night.png":
            weather_icon = "img/weather/snow3_night.png";
            break;
        case "wsymbol_0029_sleet_showers_night.png":
            weather_icon = "img/weather/sleet.png";
            break;
        case "wsymbol_0032_thundery_showers_night.png":
            weather_icon = "img/weather/tstorm1_night.png";
            break;
        case "wsymbol_0033_cloudy_with_light_rain_night.png":
            weather_icon = "img/weather/shower1_night.png";
            break;
        case "wsymbol_0034_cloudy_with_heavy_rain_night.png":
            weather_icon = "img/weather/shower2_night.png";
            break;
        case "wsymbol_0035_cloudy_with_light_snow_night.png":
            weather_icon = "img/weather/snow1_night.png";
            break;
        case "wsymbol_0036_cloudy_with_heavy_snow_night.png":
            weather_icon = "img/weather/snow3_night.png";
            break;
        case "wsymbol_0037_cloudy_with_sleet_night.png":
            weather_icon = "img/weather/sleet.png";
            break;
        case "wsymbol_0040_thunderstorms_night.png":
            weather_icon = "img/weather/tstorm2_night.png";
            break;
    }
    return weather_icon;
}
