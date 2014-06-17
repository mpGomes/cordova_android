function createFeedbackContainer(){
    current_page = "feedback";

    $('#header_link').unbind().bind('click', function(){
        backButton();
    });

    $("#submitFeedback").unbind().bind('click', function() {
        submitFeedback();
    });

    if(navigator.network.connection.type == Connection.NONE)
        navigator.notification.alert(dictionary[localStorage['language']]['you_need_internet_connection'], null, dictionary[localStorage['language']]['feedback'], 'Ok');

    $('#feedback h2').text(dictionary[localStorage['language']]['feedback_title']);
    $('#feedback p').text(dictionary[localStorage['language']]['feedback_text']);
    $('#input_feedback_name').attr('placeholder', dictionary[localStorage['language']]['name']);
    $('#input_feedback_email').attr('placeholder', dictionary[localStorage['language']]['email']);
    $('#input_feedback_text').attr('placeholder', dictionary[localStorage['language']]['write_something']);
}

function submitFeedback(){

    /* get some values from elements on the page: */
    var name = $('#input_feedback_name').val();
    var email = $('#input_feedback_email').val();
    var text = $('#input_feedback_text').val();

    if(name == "")
        navigator.notification.alert(dictionary[localStorage['language']]['you_need_to_insert_your_name'], null, dictionary[localStorage['language']]['feedback'], 'Ok');

    else if(text == "")
        navigator.notification.alert(dictionary[localStorage['language']]['you_need_to_speak_about_something'], null, dictionary[localStorage['language']]['feedback'], 'Ok');

    else
        $.post("http://festivall.eu/feedbacks", {name: name, text: text, email: email}).done(function( data ) {
            $('#input_feedback_text').val('');
            navigator.notification.alert('Obrigado (Thank you!) =)', null, dictionary[localStorage['language']]['feedback'], 'Ok');
        });
}