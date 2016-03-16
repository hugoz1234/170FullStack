$(document).ready(function() {
    var supplies = [];
    var tags = [];
    var projectID = "";
    $("#createProjectButton").click(function(){
        var item = $('#projectTitleInput');
        $.post(
            '/create/' + item.data('id') + '/' + item.val(),
            {"tags": tags}
        ).done(function(response) {
                console.log(response);
                window.location.href= '/edit/' + item.data('id') + '/' + response.projectID;
            })

    });

    $("#createStep").click(function(){
        var item = $('#comment');
        projectID = item.data('id');
        console.log("CREATE BUTTON", item.val(), projectID);
        $.post(
            '/addStep',
            { step: item.val(), id: item.data('id')}
        ).done(function(response) {
                location.reload();
            })
    });

    $("#deleteProject").click(function(){
        var item = $('#comment');
        projectID = item.data('id');
        $.post(
            '/deleteProject',
            { id: projectID}
        ).done(function(response) {
                window.location.href= '/';
            })
    });

    $(".tagLink").one('click', function(){
        var box = $('#addCategory');
        box.append($("<p></p>").text($(this).html()));
        tags.push($(this).attr('tag'));
        console.log("tagList", tags);
    });

    $("#publishButton").click(function(){
        window.location.href =  '/' + $(this).data('id') + '/projects';
    });

    $("#addSupply").click(function(){
        var box = $('#supplies');
        box.append(""+
        "<div class='row supplyRow'>" +
            " <div class='col-sm-3'> " +
                "<div class='input-group'>" +
                    "<input type='text' class='form-control number' placeholder='Quantity'>" +
                "</div>"+
            "</div>" +
            "<span class='btn-separator'></span>" +
            " <div class='col-sm-6'> " +
                "<div class='input-group'>" +
                    "<div class='input-group-btn'>" +
                        "<input type='text' class='form-control name' placeholder='Supply'>" +
                        "<button type='button' class='btn btn-default deleteSupply'>Remove</button>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            "<br>" +
        "</div>");
    });
    $('#supplies').on('click', '.deleteSupply', function() {
        console.log("remove: " + $(this).parent().parent().parent().parent().toString);
        $(this).parent().parent().parent().parent().remove();
    });

    $("#saveSupplies").click(function(){
        $(".supplyRow").each(function() {
            supplies.push({
                quantity :$(this).find(".number").val(),
                supply : $(this).find(".name").val()
            });
        });
        console.log("Supplies: " + supplies.toString());
        $.post(
            '/addSupplies',
            { supplies: supplies, id: $(this).data('id')}
        ).done(function(response) {
                location.reload();
            })
    });


    $('#page-selection').bootpag({
        total: 5
    }).on("page", function(event, num){
        $.get(
            '/getProjects',
            { pageNum: num}
        ).done(function(response) {
                console.log(response);
            });
        $("#content").html("Page " + num); // or some ajax content loading...
    });

    (function () {
        var $images = $('.reHeight');
        if ($images.length === 0) {
            return;
        }

        var tweakInitialHeight = function () {
            $images.each(function () {
                var $el = $(this);
                var w = $el.data('width');
                var h = $el.data('height');
                var r = h / w;
                $el.css('height', ($el.width() * r) + 'px');
            });
        };

        $(window).on('resize.sg.tweakInitialHeight', tweakInitialHeight);
        tweakInitialHeight();

        if (typeof $images.unveil !== 'function') {
            throw new Error('lazyload: $images.unveil is not a function');
        }

        $images.unveil(300, function () {
            var $el = $(this);
            $el.on('load', function () {
                window.SG.PubSub.publish('resize.sg.scrollspy');
                window.SG.PubSub.publish('resize.sg.scroll-navigate');
                $el.siblings('.loader').remove();
                $el.css('height', '');
                $el.addClass('loaded');
            });
        });

    })();

});