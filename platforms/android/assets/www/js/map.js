// MAP_CONTAINER


// Queries the local Database for a map
function createMapContainer(festival) {

    $('#header_link').unbind().bind('click', function(){
        createFestivalContainer(current_festival_id);
    });

    $('#map_page').empty().append('<div id="map_scroll_wrapper" class="scroll_wrapper"><div>');

    if(festival.map != "")
        $('#map_scroll_wrapper').append('<div id="map_scroller" class="horizontal_scroll_wrapper">' +
                '<img src="' + festival.map +'">' +
            '</div>');
    else
        $('#map_scroll_wrapper').append('<div id="map_scroller" class="padded"><p>' +
            dictionary[localStorage['language']]['map_not_available_yet'] + '</p></div>');

    var hasMap = localStorage[festival.name + '_map.jpg'];
    if(hasMap != undefined ){
        var filename = hasMap;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(filename, {create: true, exclusive: false}, function (fileEntry) {
                var file_path = fileEntry.toURL();
                addMap(festival, file_path);
            });
        });
    }
}

function addMap(festival, file_path){
    var dummy = makeid();
    //console.log('FETCHING LOGO :' + file_path);
    $('#map_scroll_wrapper').empty().append('<div id="map_scroller" class="horizontal_scroll_wrapper">' +
        '<img src="' + file_path + '?dummy=' + dummy + '"></div>');
}

