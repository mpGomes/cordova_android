// VIDEOS_CONTAINER

var show_carousel = false;

//Success callback for the query of all the videos of a given show
function queryShowVideosSuccess(tx, results){
    if(navigator.connection.type == Connection.NONE)
        $('#band_videos_scroller').html('<div class="padded"><p>' + dictionary[localStorage['language']]['you_need_internet_connection'] + '</p></div>');
    else{

        var videos = results.rows;
        var videos_length = videos.length;
        $('#band_videos_scroller').empty();

        if(videos_length >0)
            for(var i = 0; i <videos_length; i++){
                var video = videos.item(i);
                var video_name = video.name;
                var video_url = video.url;
                var video_id = video.id;

                $('#band_videos_scroller').append(''+
                    '<div id="video_' + video_id + '">' +
                    '<h3 class="video_name">' + video_name + '</h3>' +
                    '<iframe width="'+video_url+'" height="200" src="http://www.youtube.com/embed/'+video_url+'?showinfo=0" frameborder="0" allowfullscreen></iframe>'+
                    '</div>');
            }
        else
            $('#band_videos_scroller').html('<div class="padded"><p>' + dictionary[localStorage['language']]['no_videos_available_yet'] + '</p></div>');
    }
}

function initShowCarousel(){
    show_carousel = new Swiper('#show',{
        loop:false,
        grabCursor: true,
        onSlideChangeStart: function(){
            createPagingSwipeBar(show_carousel.activeIndex, ['#show_nav_item','#videos_nav_item']);
        }
    });

    bindClickToNavBar(['#show_nav_item','#videos_nav_item'], show_carousel);
}