
function createCountriesContainer(){
    $('#header_link').unbind().bind('click', function(){
        backButton();
    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM COUNTRIES', [], queryCountriesSuccess, errorCB);
    }, errorCB);

}

// Success callback for the the query about_us
function queryCountriesSuccess(tx, results) {

    var countries = results.rows;
    var countries_length = countries.length;

    $('#countries_page_list').empty();

    for(var i = 0; i <countries_length; i++){
        var country = countries.item(i);


        $('#countries_page_list').append('' +
            '<li id="country_' + country.id + '_button" class="country_select">' +
            '<img class="country_flag" src="' + country.flag + '">' +
            country.name + '</li>');

        $('#country_' + country.id + '_button').unbind().bind('click', function(){
            localStorage.setItem('country_id', this.id.replace("country_", "").replace("_button", ""));
            createFestivalsContainer();
        });
    }
}
