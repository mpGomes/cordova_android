var menuIsUp = false;
var history_array = [];
var screen_width;
var screen_height;

function setHeightAndWidth(){
    screen_height = window.innerHeight;
    screen_width = window.innerWidth;

    $('.swipe_bar_list').css('min-width', screen_width + 'px');
    $('body').css('width', screen_width + 'px').css('height', screen_height + 'px');
}

//Navigation
function changeContainers(page, title, subtitle){
    var header_title_selector = $('#header_title');
    var header_subtitle = $('#header_subtitle');
    $('.container').removeClass("visible");
    $(page).addClass("visible");

    incrementHistory(page);
    console.log('history_array :' + history_array + ', length: '+ history_array.length );

    switch(page){
        case "#festivals":
            header_title_selector.removeClass('heading1').addClass('heading0');
            header_title_selector.html('<img id="logo" alt="FestivAll" src="img/logo.png"> FestivAll');
            header_subtitle.empty();
            $('#header_link').unbind();
            $('#festivals_line_break').text(dictionary[localStorage['language']]['finished']);
            break;

        case "#before_festival":
            header_subtitle.empty();
            header_title_selector.removeClass('heading0').addClass('heading1');

            if(title == undefined)
                header_title_selector.text(current_festival_name);
            else
                header_title_selector.text(title);
            break;

        case "#during_festival":
            header_subtitle.empty();
            header_title_selector.removeClass('heading0').addClass('heading1');

            if(title == undefined)
                header_title_selector.text(current_festival_name);
            else
                header_title_selector.text(title);
            break;

        case "#shows":
            header_subtitle.text(dictionary[localStorage['language']]['bands']);
            header_title_selector.removeClass('heading0').addClass('heading1');

            if(title == undefined)
                header_title_selector.text(current_festival_name);
            else
                header_title_selector.text(title);
            break;

        case "#lineup":
            header_subtitle.text(dictionary[localStorage['language']]['lineup']);
            header_title_selector.removeClass('heading0').addClass('heading1');

            if(title == undefined)
                header_title_selector.text(current_festival_name);
            else
                header_title_selector.text(title);

            createPagingSwipeBar(current_linup_page, lineup_nav_items);
            break;

        case "#feedback":
            header_title_selector.removeClass('heading0').addClass('heading1').empty().text(title);
            header_subtitle.text(subtitle);
            break;

        case "#about_us":
            header_title_selector.removeClass('heading0').addClass('heading1').empty().text(dictionary[localStorage['language']]['menu']);
            header_subtitle.text(subtitle);
            break;

        case "#search":
            header_title_selector.removeClass('heading0').addClass('heading1').empty().text(dictionary[localStorage['language']]['search']);
            header_subtitle.empty();
            break;

        case "#search_results":
            header_title_selector.removeClass('heading0').addClass('heading1').empty().text(title);
            header_subtitle.text(subtitle);
            break;

        case "#info":
            header_subtitle.text(dictionary[localStorage['language']]['info']);
            if(info_carousel)
                info_carousel.swipeTo(0, 1);
            else
                initInfoCarousel();
            break;

        case "#show":
            header_title_selector.removeClass('heading0').addClass('heading1').empty().text(title);
            if(show_carousel)
                show_carousel.swipeTo(0, 1);
            else
                initShowCarousel();
            break;

        default:
            header_title_selector.removeClass('heading0').addClass('heading1').text(title);
            header_subtitle.text(subtitle);
    }
}

function backButton(){
    if(menuIsUp){
        menuIsUp = false;
        $('#menu').removeClass('active_menu');
    }
    else{
        if(history_array.length > 1){
            history_array.pop();
            var history_popped = history_array.pop();
            changeContainers(history_popped);
        }else navigator.app.exitApp();

    }
}

function incrementHistory(page){
    history_array.push(page);
}

function fixHeaderLink(page){
    var history_popped = history_array.pop();
    while(history_popped != page){
        history_popped = history_array.pop();
    }
}

function bindClickToNavBar(nav_items, carousel){
    var nav_item = "";

    //nav width
    var swipe_bar_list = $('.swipe_bar_list');
    var nav_width = swipe_bar_list.width() / 2;

    for(var i=0; i<nav_items.length; i++){
        nav_item = nav_items[i];

        //console.log(carousel.id);

        (function (i, nav_item, nav_items, carouselx){
            $(nav_item).unbind().bind('click', function(){
                swipe_bar_list.find('a').removeClass('current');
                $(nav_items[i]).addClass('current');

                if(i == 0)
                    swipe_bar_list.removeClass('middle last').addClass('first');
                else if(i == nav_items.length -1)
                    swipe_bar_list.removeClass('first middle').addClass('last');
                else
                    swipe_bar_list.removeClass('first last').addClass('middle').css('margin-left', '-' + nav_width + 'px');

                console.log(carouselx.id+ " "+carousel.id);
                carousel.swipeTo(i, 200);
            });
        })(i, nav_item, nav_items, carousel);
    }
}


// paging_function do swipebar
function createPagingSwipeBar(index, nav_items){

    //nav width
    var swipe_bar_list = $('.swipe_bar_list');
    var nav_width = swipe_bar_list.width() / 2;
    swipe_bar_list.find('a').removeClass('current');

    if(index == 0){
        $(nav_items[index]).addClass('current');
        swipe_bar_list.removeClass('middle last').addClass('first');
    }
    else if(index == nav_items.length -1){
        $(nav_items[index]).addClass('current');
        swipe_bar_list.removeClass('first middle').addClass('last');
    }
    else{
        $(nav_items[index]).addClass('current');
        swipe_bar_list.removeClass('first last').addClass('middle').css('margin-left', '-' + nav_width + 'px');
    }
}