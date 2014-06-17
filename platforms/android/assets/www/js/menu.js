
function initMenu(){
    $('#menu_button').unbind().bind("click", function(){
        if(!menuIsUp){
            menuIsUp = true;
            createMenuContainer();
        }
        else{
            menuIsUp = false;
            $('#menu').removeClass('active_menu');
        }
    });
}

function searchButton(){
    menuIsUp=false;
    createSearchContainer();
    $('#menu').removeClass('active_menu');
    changeContainers('#search', dictionary[localStorage['language']]['search'], '');
}

function feedbackButton(){
    menuIsUp=false;
    createFeedbackContainer();
    $('#menu').removeClass('active_menu');
    changeContainers('#feedback', dictionary[localStorage['language']]['feedback'], '');
}

function aboutUsButton(){
    menuIsUp=false;
    createAboutUsContainer();
    $('#menu').removeClass('active_menu');
    changeContainers('#about_us', dictionary[localStorage['language']]['menu'], dictionary[localStorage['language']]['about_us']);
}

function countriesButton(){
    menuIsUp=false;
    createCountriesContainer();
    $('#menu').removeClass('active_menu');
    changeContainers('#countries', dictionary[localStorage['language']]['menu'], dictionary[localStorage['language']]['countries']);
}

function languagesButton(){
    menuIsUp=false;
    createLanguagesContainer();
    $('#menu').removeClass('active_menu');
    changeContainers('#languages', dictionary[localStorage['language']]['menu'], dictionary[localStorage['language']]['language']);
}

function createMenuContainer(){
    $('#header_link').unbind().bind('click', function(){
        backButton();
    });

    $('#menu').addClass('active_menu');

    $('#menu_home_link').text(dictionary[localStorage['language']]['home']).unbind().bind('click', function(){
        $('#menu').removeClass('active_menu');
        menuIsUp=false;
        changeContainers('#festivals', '', '');
        fixHeaderLink('#festivals');
        history_array.pop();
    });

    $('#menu_search_link').text(dictionary[localStorage['language']]['search']).unbind().bind('click', function(){
        searchButton();
    });
    $('#menu_about_us_link').text(dictionary[localStorage['language']]['about_us']).unbind().bind('click', function(){
        aboutUsButton();
    });
    $('#menu_feedback_link').text(dictionary[localStorage['language']]['feedback']).unbind().bind('click', function(){
        feedbackButton();
    });
    $('#menu_countries_link').text(dictionary[localStorage['language']]['countries']).unbind().bind('click', function(){
        countriesButton();
    });
    $('#menu_languages_link').text(dictionary[localStorage['language']]['language']).unbind().bind('click', function(){
        languagesButton();
    });


    $('.container').not('#menu').unbind().bind('click', function(){
        $('#menu').removeClass('active_menu');
        menuIsUp = false;
    });
}