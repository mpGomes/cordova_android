

function createLanguagesContainer(){
    $('#header_link').unbind().bind('click', function(){
        backButton();
    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM LANGUAGES', [], queryLanguagesSuccess, errorCB);
    }, errorCB);

}

// Success callback for the the query about_us
function queryLanguagesSuccess(tx, results) {

    var languages = results.rows;
    var languages_length = languages.length;

    $('#languages_page_list').empty();

    for(var i = 0; i < languages_length; i++){
        var language = languages.item(i);

        $('#languages_page_list').append('' +
            '<li id="language_' + language.id + '_button" class="language_select">' + language.name + '</li>');

        $('#language_' + language.id + '_button').unbind().bind('click', function(){
            var language_id = this.id.replace("language_", "").replace("_button", "");
            setLanguageVariable(language_id);
            appendCheckmarkToLanguage(language_id);
            changeContainers('#festivals', '', '');
        });
    }
    appendCheckmarkToLanguage(localStorage['language_id']);
}

function appendCheckmarkToLanguage(language_id){
    $('.language_checkmark').remove();
    $('#language_' + language_id + '_button').append('<img class="language_checkmark" src="img/checkmark.png">');
}

function setLanguageVariable(language_id){
    var language;

    switch (language_id){
        case '1':
            language = 'en';
            break;
        case '2':
            language = 'pt';
            break;
        case '3':
            language = 'de';
            break;
        case '4':
            language = 'da';
            break;
        default :
            language = 'en';
    }
    localStorage.setItem('language_id', language_id);
    localStorage.setItem('language', language);
}