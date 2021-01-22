$( function() {
$( "#panel1" ).enhanceWithin().panel();
$( "#popupHelpDialog" ).enhanceWithin().popup();
$( "#imageUploadDialog" ).enhanceWithin().popup();

// listeners:
$(".sendbutton").click(function(){

    var roomname = $(this).parents("[data-role='page']").attr("id");
    var yourname = $("#"+roomname).find("[class='yourname']").val().trim();
    var yourmessage = $("#"+roomname).find("[class='yourmessage']").val().trim();
    var publicprivate = $("#"+roomname).find("select[class='publicprivate']").val();
    var touser = $("#"+roomname).find("select[class='touser']").val();

    if(yourname.length < 3){
        alert("Your name must be 3 characters min");
        return;
    }
    if(yourmessage.length < 2){
        alert("Your message must be 2 characters min");
        return;
    }
    if(yourmessage.length > 500){
        alert("Your message cannot be longer than 500 characters");
        return;
    }

    $("#"+roomname).find("[class='yourmessage']").val('');

    if ( ( yourmessage.indexOf(".jpg") > 0 ) || ( yourmessage.indexOf(".gif") > 0 ) ) {
        testForImgBeforePosting(roomname,yourname,touser,publicprivate,yourmessage);
    }else{
        $("#"+roomname).find("div[class*='chatscroller']").append("<p><b><big>["+yourname+"]</big></b>  <i>"+publicprivate+"</i> to <b>"+touser+"</b>: "+yourmessage+"</p>");
        if(autoscroll === true){
            scrollToBottom($("#"+roomname).find("div[class*='chatscroller']"));
        }

        sendcue.push('MR|'+roomname+'|'+yourname+'|'+touser+'|'+publicprivate+'|'+yourmessage);
        emptySendQueue();
    }

});

$(".enterroom").click(function(){
    if(connected === false){
        alert("ERROR: not connected to server, please wait");
        return;
    }

    var roomname = $(this).parents("[data-role='page']").attr("id");
    $("#but_upload").data('roomname',roomname);
    var yourname = $("#"+roomname).find("[class='yourname']").val().trim();
    if(yourname.length < 3){
        alert("Your name must be 3 characters min");
        return;
    }
    $("#"+roomname).find("[class='yourname']").val(yourname);

    sendcue.push('ER|'+roomname+'|'+yourname);
    emptySendQueue();
});

$(".squelchbutton").click(function(){

    var roomname = $(this).parents("[data-role='page']").attr("id");
    var yourname = $("#"+roomname).find("[class='yourname']").val();
    var touser = $("#"+roomname).find("select[class='touser']").val();

    if((touser !== 'EVERYONE') && (touser !== yourname) ){// don't squelch yourself or everyone
        if (rooms[roomname].squelchlist.indexOf(touser) > -1){// this chatter has already been squelched, so un-squelch them
            sendcue.push('USQC|'+roomname+'|'+yourname+'|'+touser);

            for( var i = 0; i < rooms[roomname].squelchlist.length; i++){ // remove the matching user
                if ( rooms[roomname].squelchlist[i] === touser) {
                    rooms[roomname].squelchlist.splice(i, 1);
                    i--;
               }
            }
            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>"+touser+" <span style='color:#cc8f04'>HAS BEEN UN-SQUELCHED.</span></b></p>");
        }else{
            sendcue.push('SQC|'+roomname+'|'+yourname+'|'+touser);// squelch the chatter
            rooms[roomname].squelchlist.push(touser);
            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>"+touser+" <span style='color:#cc8f04'>HAS BEEN SQUELCHED.</span></b></p>");
        }
        if(autoscroll === true){
            scrollToBottom($("#"+roomname).find("div[class*='chatscroller']"));
        }
        emptySendQueue();
        populateChatterList(roomname);
    }
});

$(".leavebutton").click(function(){

    var roomname = $(this).parents("[data-role='page']").attr("id");
    var yourname = $("#"+roomname).find("[class='yourname']").val().trim();

    //swap the visibility of the enter and private blocks
    $("#"+roomname).find("div[class='notentered']").show();
    $("#"+roomname).find("div[class='entered']").css('display','none');

    //disable the send elements
    $("#"+roomname).find("input[class='yourmessage']").attr('disabled','disabled').textinput('disable');
    $("#"+roomname).find("button[class*='sendbutton']").attr('disabled','disabled');
    $("#"+roomname).find("button[class*='leavebutton']").attr('disabled','disabled');
    $("#"+roomname).find("button[class*='squelchbutton']").attr('disabled','disabled');
    $("#"+roomname).find("a[class*='uploadbutton']").addClass('ui-disabled');

    sendcue.push('LR|'+roomname+'|'+yourname);
    emptySendQueue();
});

$(".yourname").keyup(function(){
    var roomname = $(this).parents("[data-role='page']").attr("id");

    $(this).val($(this).val().replace('|','').replace('~',''));

    if($(this).val().length > 100){
        $(this).val($(this).val().substring(0,100));
        alert("Your name cannot be longer than 100 characters");
    }

    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        $("#"+roomname).find("button[class*='enterroom']").click();
    }
});

$(".yourmessage").keyup(function(event){

    var roomname = $(this).parents("[data-role='page']").attr("id");

    $(this).val($(this).val().replace('|','').replace('~',''));
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        $("#"+roomname).find("button[class*='sendbutton']").click();
    }
});

$(".touser").click(function(event){

    var roomname = $(this).parents("[data-role='page']").attr("id");

    populateChatterList(roomname);// we build a whole new dropdown every single time the list is clicked, which should prevent the list from dissapearing when the use has it open and a new chatter enters the room (annoying)

});

$("#autoscroll").click(function(){

    if(autoscroll === false){
        autoscroll = true;
        $("#autoscroll").text("Turn Autoscroll Off");
    }else{
        autoscroll = false;
        $("#autoscroll").text("Turn Autoscroll On");
    }
});

$("#upload").on('drop',function(){
    //$("#but_upload").click();
});

$("#but_upload").click(function(){
        var roomname = $("#but_upload").data('roomname');
        console.log(roomname);
        var fd = new FormData();
        var files = $('#upload')[0].files;

        // Check file selected or not
        if(files.length > 0 ){
            if(files[0].size > 256000){
                alert('file is too big for upload. Max is 256kb');
                $('#upload').val('');
            }else{
                $("#"+roomname).find("input[class='yourmessage']").attr('disabled','disabled').textinput('disable');
                $("#"+roomname).find("button[class*='sendbutton']").attr('disabled','disabled');

                fd.append('photo',files[0]);

                $.ajax({
                    url: 'wss/upload.cgi',
                    type: 'post',
                    data: fd,
                    contentType: false,
                    processData: false,
                    xhr: function() {
                        var xhr = new window.XMLHttpRequest();
                        xhr.upload.addEventListener("progress", function(evt) {
                            if (evt.lengthComputable) {

                                var percentComplete = ((evt.loaded / evt.total) * 100) - 8;
                                // Place upload progress bar visibility code here
                                $(".yourmessage").val('UPLOADING IMAGE: '+percentComplete.toFixed(0)+'%');
                            }
                        }, false);
                        return xhr;
                    },
                    success: function(response){
                        console.log(response);
                        if(response != 0){
                            if(response === 'ERRORtoobig'){
                                alert('file was too big for upload. Max is 256kb');
                                $('#upload').val('');
                            }else{
                                $(".yourmessage").val('https://'+window.location.hostname+'/uploads/'+response);
                            }
                            $("#"+roomname).find("input[class='yourmessage']").removeAttr('disabled').textinput('enable');
                            $("#"+roomname).find("button[class*='sendbutton']").removeAttr('disabled');
                            $('#upload').val('');
                        }else{
                            alert('file not uploaded');
                            $('#upload').val('');
                        }
                    },
                })
            };
        }else{
           alert("Please select a file.");
        }
    });


} );

var isTouch = ('ontouchstart' in document.documentElement);

var rtcdata = DetectRTC;
//console.log(rtcdata.stringify());

var autoscroll = false;

var rooms = {}; // keep track of all room metadata including user lists (chatters)

// websocket stuff
var sendcue = [];
var connection;
var connected;

connecttows();// connect to the server ASAP

function connecttows(){
    console.log('connecting...');
    $("#connmess").show();

    connection = new WebSocket('wss://'+window.location.hostname+'/pwsc');

    connection.onopen = function () {
        connected = true;
        console.log('connected');
        $("#conndot").css("backgroundColor","#5fbd5f");
        $("#connmess").hide();

        // get initial data and send a post connection message:
        var browserts = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var browsertz = new Date();
        var browserlocale = Intl.NumberFormat().resolvedOptions().locale;
        var getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage;
        var browserlang = getNavigatorLanguage();

        sendcue.push('PC|'+browserts+'|'+browsertz+'|'+browserlocale+'|'+browserlang);
        emptySendQueue();
    };

    connection.onclose = function (e) {
        connected = false;
        console.log('disconnected');
        $("#conndot").css("backgroundColor","red");

        // log out of all rooms visually and in the object
        for (let roomname in rooms) {
            //swap the visibility of the enter and private blocks
            $("#"+roomname).find("div[class='notentered']").show();
            $("#"+roomname).find("div[class='entered']").css('display','none');

            //disable the send elements
            $("#"+roomname).find("input[class='yourmessage']").attr('disabled','disabled').textinput('disable');
            $("#"+roomname).find("button[class*='sendbutton']").attr('disabled','disabled');
            $("#"+roomname).find("button[class*='leavebutton']").attr('disabled','disabled');
            $("#"+roomname).find("button[class*='squelchbutton']").attr('disabled','disabled');

        }

        rooms = {};

        connecttows();
    };

    // Log errors
    connection.onerror = function (e) {
        console.log('error',e);
    };

    // get messages from the server
    connection.onmessage = function (e) {

        console.log('got message from server: '+e.data);

        if(e.data === 'p'){
            connection.send('p');
        }

        // populate the list of chatters for a room
        if(e.data.indexOf('RCL|') === 0){// this means you have entered a room
            var incoming = e.data.split('|');
            var roomname = incoming[1];
            var chatterlist = incoming[2].split('~');
            chatterlist.sort();

            rooms[roomname] = {};
            rooms[roomname].chatterlist = chatterlist;
            rooms[roomname].squelchlist = [];

            //swap the visibility of the enter and private blocks
            $("#"+roomname).find("div[class='notentered']").hide();
            $("#"+roomname).find("div[class='entered']").css('display','inline');

            //enable the send elements
            $("#"+roomname).find("input[class='yourmessage']").removeAttr('disabled').textinput('enable');
            $("#"+roomname).find("button[class*='sendbutton']").removeAttr('disabled');
            $("#"+roomname).find("button[class*='leavebutton']").removeAttr('disabled');
            $("#"+roomname).find("button[class*='squelchbutton']").removeAttr('disabled');
            $("#"+roomname).find("a[class*='uploadbutton']").removeClass('ui-disabled');

            //make the name no longer editable
            $("#"+roomname).find("div[class='yourchosenname']").html($("#"+roomname).find("[class='yourname']").val());
        }
        if(e.data.indexOf('CLR|') === 0){// this means a chatter has left a room
            var incoming = e.data.split('|');
            var roomname = incoming[1];
            var chatterhandle = incoming[2];

            if(rooms[roomname]){//you are already in this room
                if (rooms[roomname].chatterlist.indexOf(chatterhandle) > -1){// this chatter is in the list

                    for( var i = 0; i < rooms[roomname].chatterlist.length; i++){ // remove the matching user
                        if ( rooms[roomname].chatterlist[i] === chatterhandle) {
                            rooms[roomname].chatterlist.splice(i, 1);
                            i--;
                       }
                    }

                    rooms[roomname].chatterlist.sort();
                }
            }
        }
        if(e.data.indexOf('CER|') === 0){// this means a new chatter has entered a room
            var incoming = e.data.split('|');
            var roomname = incoming[1];
            var chatterhandle = incoming[2];

            if(rooms[roomname]){//you are already in this room
                if (rooms[roomname].chatterlist.indexOf(chatterhandle) === -1){
                    rooms[roomname].chatterlist.push(chatterhandle);
                    rooms[roomname].chatterlist.sort();
                }
            }
        }
        if(e.data.indexOf('MFR|') === 0){// this is a message from a room [MFR|roomname|from|towhom|publicprivate|message]
            var incoming = e.data.split('|');
            var roomname = incoming[1];
            var fromchatter = incoming[2];
            var tochatter = incoming[3];
            var porp = incoming[4];
            var themessage = incoming[5];
            var yourname = $("#"+roomname).find("[class='yourname']").val();

            if(rooms[roomname]){//you are already in this room
                if (rooms[roomname].squelchlist.indexOf(fromchatter) === -1){// this chatter has not been squelched so display the message
                    if(tochatter === 'EVERYONE' ){
                        if(fromchatter !== yourname){
                            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>"+fromchatter+"</b>: "+renderHTML(roomname,themessage)+"</p>");
                        }
                    }else{
                        if(tochatter !== yourname){
                            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>"+fromchatter+"</b> <i>"+porp+"</i> to <b>"+tochatter+"</b>: "+renderHTML(roomname,themessage)+"</p>");
                        }else{
                            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>"+fromchatter+"</b> <i>"+porp+"</i> to <b><big>["+tochatter+"]</big></b>: "+renderHTML(roomname,themessage)+"</p>");
                        }
                    }

                    if(autoscroll === true){
                        scrollToBottom($("#"+roomname).find("div[class*='chatscroller']"));
                    }
                    //make sure the room history does not get too long, max 100 messages
                    if($("#"+roomname+" div[class*='chatscroller'] p").length > 100){
                        $("#"+roomname+" div[class*='chatscroller'] p")[0].remove();
                    }
                }
            }
        }


    };
}

function scrollToBottom(jqueryobj){
    setTimeout(function(){
        var div_height = jqueryobj.height();
        var div_offset = jqueryobj.offset().top;
        var window_height = $(window).height();
        $('html,body').scrollTop(div_offset-window_height+div_height);
    },300);

}

function populateChatterList(roomname){
    var touser = $("#"+roomname).find("select[class='touser']");

    var optionstring='';

    var devicewidth = $(window).width();

    rooms[roomname].chatterlist.forEach(function (item, index) {
        var displayhandle = item;

        if (rooms[roomname].squelchlist.indexOf(item) > -1){
            displayhandle = '(s) '+item;
        }

        if(devicewidth < 376){
            if(item.length > 18){
                displayhandle = displayhandle.substring(0,15)+'...';
            }
        }else if(devicewidth < 415){
            if(item.length > 25){
                displayhandle = displayhandle.substring(0,22)+'...';
            }
        }else if(devicewidth < 769){
            if(item.length > 40){
                displayhandle = displayhandle.substring(0,37)+'...';
            }
        }

        optionstring = optionstring + `<option value="${item}">${displayhandle}</option>`;
    });

    optionstring = `<option value="EVERYONE">EVERYONE</option>` + optionstring;

    if(touser.html().trim() !== optionstring){// dont rebuild list if it has not changed
        touser.empty();
        touser.html(optionstring);
    }
}

function emptySendQueue(){
    var sendqtimer = setInterval(function(){
        if(sendcue.length === 0){
            clearInterval(sendqtimer);
        }else{
            if(connected){
                connection.send(sendcue[0]);
                sendcue.shift();
            }
        }
    }, 10);
}

function testForImgBeforePosting(roomname,yourname,touser,publicprivate,yourmessage) {
    var msgboxwid = $("#"+roomname).find("div[class*='chatscroller']").width();

    var brokenparts = yourmessage.split(/(https?:\/\/[^\s]+)/);

    var numberofimgurls = 0;

    brokenparts.forEach(stringpart => {
        if(stringpart.indexOf('http') === 0 && ( ( stringpart.indexOf(".jpg") > 0 ) || ( stringpart.indexOf(".gif") > 0 ) ) ){
            numberofimgurls++;
        }
    });

    var numberofloadedimgs = 0;

    var mydisplayedmessagestring = '';
    var mymessagestringtotransmit = '';

    var imgtoobig = false;

    // so we will need to start a timer and keep checking back to see when all the images are loaded
    var imgloadtimer = setInterval(function(){
        if(numberofloadedimgs === numberofimgurls){
            clearInterval(imgloadtimer);

            if(imgtoobig !== true){
                sendcue.push('MR|'+roomname+'|'+yourname+'|'+touser+'|'+publicprivate+'|'+mymessagestringtotransmit);
                emptySendQueue();
            }
            $("#"+roomname).find("div[class*='chatscroller']").append("<p><b>["+yourname+"]</b> <i>"+publicprivate+"</i> to <b><big>"+touser+"</big></b>: "+mydisplayedmessagestring+"</p>");
            if(autoscroll === true){
                console.log('posting my ownimage message with autoscroll');
                scrollToBottom($("#"+roomname).find("div[class*='chatscroller']"));
            }
        }
    },20);


    brokenparts.forEach(stringpart => {
        if(stringpart.indexOf('http') === 0 && ( ( stringpart.indexOf(".jpg") > 0 ) || ( stringpart.indexOf(".gif") > 0 ) ) ){

            $('<img src="'+stringpart+'" />').appendTo('body').css({
                'position': 'absolute',
                'top': -9999
            }).load(function() {
                var imgwid = $(this).width();
                var imghei = $(this).height();

                if((imgwid > 1920) || (imghei > 1920)){
                    var imgratio = imgwid / msgboxwid;
                    var imgdisphei = imghei / imgratio;
                    mydisplayedmessagestring = mydisplayedmessagestring + '<div style="position:relative;width: '+msgboxwid+'px; height: '+imgdisphei+'px; border: 7px solid red; border-radius: 5px; box-sizing: border-box; background-size: cover; background-image:linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(' + stringpart + ');"><div style="position: absolute;color:white;"> &nbsp; max pixels: 1280W →</div><div style="position: absolute;top: 2em;left:.5em;color:white;writing-mode: vertical-rl;text-orientation: upright;font-size:0.8em;">1280H↓</div><div style="position: relative;top: 40%;text-align:center;font-size:1.7em;color:red;font-weight:bold;">IMAGE TOO BIG<br>ENTIRE MESSAGE<br>NOT SENT</div></div> ';
                    imgtoobig = true;
                }else{
                    var imgdisplaywidth;
                    if(imgwid < msgboxwid){
                        imgdisplaywidth = imgwid;
                    }else{
                        imgdisplaywidth = msgboxwid;
                    }
                    mydisplayedmessagestring = mydisplayedmessagestring + ' <a target="_blank" href="' + stringpart + '"><img style="width: '+imgdisplaywidth+'px; border: 0px; -moz-border-radius: 5px; border-radius: 5px;" src="' + stringpart + '"></a> ';
                    mymessagestringtotransmit = mymessagestringtotransmit + stringpart + '~IMG~' + imgwid + '~' + imghei + ' ';

                }
                numberofloadedimgs++;

                $(this).remove();
            });

        }else{
            mydisplayedmessagestring = mydisplayedmessagestring + stringpart;
            mymessagestringtotransmit = mymessagestringtotransmit + stringpart;
        }
    });

}

function renderHTML(roomname,text) {
    var msgboxwid = $("#"+roomname).find("div[class*='chatscroller']").width();

    var rawText = text;
    var urlRegex =/(https?:\/\/[^\s]+)/ig;

    return rawText.replace(urlRegex, function(url) {

        if ( ( url.indexOf(".jpg") > 0 ) || ( url.indexOf(".gif") > 0 ) ) {
            var imgurlwithdims = url.split('~IMG~');
            var imgdims = imgurlwithdims[1].split('~');
            var imgwid = imgdims[0];
            var imghei = imgdims[1];
            var imgdisplaywidth;
            if(imgwid < msgboxwid){
                imgdisplaywidth = imgwid;
            }else{
                imgdisplaywidth = msgboxwid;
            }

            var ffidtag = '';
            if( (isTouch === false) && ( url.indexOf(".gif") > 0 ) ){

                var ffid = Math.floor(Math.random() * 1000);
                ffidtag = 'id="'+ ffid +'"';

                setTimeout(function(){
                    new Freezeframe(
                    document.getElementById(ffid),
                    {
                        responsive: false,
                        overlay: true
                    });
                    console.log(ffid);
                },20);
            }

            return '<a target="_blank" href="' + imgurlwithdims[0] + '"><img '+ffidtag+' style="width: '+imgdisplaywidth+'px; border: 0px; -moz-border-radius: 5px; border-radius: 5px;" src="' + imgurlwithdims[0] + '">' + '</a>' + '<br/>';


        } else {// keep in mind this only creates links in the recipients chat window, not in the senders
            return '<a target="_blank" href="' + url + '">' + url + '</a>' + '<br/>';
        }
    })
}



