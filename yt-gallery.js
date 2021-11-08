/*
    Miro Manestar | June 6, 2020
    miroimanestar@gmail.com
    A simple front-end script that grabs youtube videos and displays them in a gallery format!
*/
jQuery(document).ready(function () {
    initialize();

    var timer = null;
    $('#ytgallery-search').keyup(function () {
        clearTimeout(timer);
        timer = setTimeout(search, 250);
    });
});

window.addEventListener('resize', adjustColumns);

function initialize() {
    checkCache();
    adjustColumns();
    ytButtons();
}

var playlistId = $('#ytgallery-script').attr('playlistId') || 'Error: No playlistID set.'; //Required.
var maxResults = $('#ytgallery-script').attr('resultsPerPage') || 5; //Max of 50
var searchEnabled = $('#ytgallery-script').attr('searchEnabled') || 'true'; //Optional.
var numColumns = $('#ytgallery-script').attr('columns') || 3; //Max is 4, optional.

var apiKey = ''; //Set your API key.

var cacheName = `ytgallery-${ playlistId }`;
var cache = getCache(); //Will check if cache exists or not.
var playlistInfo;

var okayToPaginate = false;
var currentPage = 1;
var state; //Defines whether user is currently searching or not; used to synchronize behaviors.

$('.ytgallery-buttons, #ytgallery-playlist-search, #ytgallery-refresh').hide();

//If there is no cache or it is more than 1 day old, it will rebuild cache.
function checkCache() {
    if (playlistId === 'Error: No playlistID set.') {
        $('.ytgallery-buttons, #ytgallery-search, .ytgallery-refresh, #ytgallery-load-icon').hide();
        $('.ytgallery-noplaylistiderror').show();
        return console.error(playlistId);
    }
    $('.ytgallery-error').hide();

    if (!localStorage[cacheName]) { //Cache doesn't exist.
        startRetrieval();
        console.log(`Cache for \"${ cacheName }\" not found... building.`);
    } else {
        let currentTime = new Date().getTime();
        if (currentTime - cache.time > 86400000) { //Cache is more than 1 day old.
            startRetrieval();
            console.log(`Cache for \"${ cacheName }\" is more than a day old... rebuilding.`);
        } else {
            renderItems(getPageData());
            console.log(`Cache for \"${ cacheName }\" is less than a day old... keeping.`);
        }
    }
}

function getCache() {
    if (localStorage[cacheName]) {
        return JSON.parse(localStorage[cacheName]);
    }
}

function startRetrieval() {
    getPlaylistInfo();
    getPlaylistItems();
}

//Only grabs the ids of each video from the playlist before passing them to buildCache().
function getPlaylistItems(data, token) {
    let playlistItems = data || [];
    
    $('.ytgallery-buttons, #ytgallery-search, .ytgallery-refresh').hide();
    $('.ytgallery-error').hide();

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        data: {
            key: apiKey,
            playlistId: playlistId,
            part: 'snippet',
            maxResults: 50,
            pageToken: token
        },
        success: function (data) {
            for (let item of data.items) {
                if (item.snippet.title !== 'Private video') {
                    playlistItems.push(item.snippet.resourceId.videoId);
                } else {
                    console.error(`Video with ID \"${ item.snippet.resourceId.videoId }\" is private... skipping.`);
                }
            }

            if (data.nextPageToken) {
                getPlaylistItems(playlistItems, data.nextPageToken);
            } else {
                buildCache(playlistItems);
                console.log(`Playlist items successfully grabbed with ${ playlistItems.length } items... grabbing item data.`);
            }
        },
        error: function (response) {
            logAjaxError(response, 'getPlaylistItems()');
        }
    });
}

/*
    Grabs all necessary data for each video before placing it into an object.
    Pagination is done by accessing the local cache data for a page rather
    than making another request to youtube for it.
*/
function buildCache(playlistIds, data, iteration) {
    let iterationNum = iteration + 1 || 1;
    let ids = playlistIds.slice((iterationNum - 1) * maxResults, iterationNum * maxResults);
    cache = data || ({ playlistInfo: playlistInfo, time: new Date().getTime(), numPages: 0, pages: [{ items: [] }] });

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        data: {
            key: apiKey,
            id: ids.toString(),
            part: 'snippet, contentDetails, statistics, recordingDetails, liveStreamingDetails',
            maxResults: 50
        },
        success: function (data) {
            for (let item of data.items) {
                if (item.snippet.title !== 'Private video') {
                    cache.pages[iterationNum - 1].items.push({
                        title: item.snippet.title,
                        description: item.snippet.description,
                        date: getDate(item), //Grabs 1 of three possible date sources.
                        thumbnail: item.snippet.thumbnails.medium.url,
                        duration: parseIsoToDuration(item.contentDetails.duration, item.snippet.liveBroadcastContent),
                        views: numberWithCommas(item.statistics.viewCount),
                        id: item.id
                    });
                    ytButtonStyling();
                    cache.numPages = Math.ceil(playlistIds.length / maxResults);
                    if (currentPage === iterationNum) { //If current page isn't loaded, load ASAP.
                        renderItems(getPageData(currentPage - 1));
                    }
                } else {
                    console.log(`Video with ID \"${ item.snippet.resourceId.videoId }\" is private... skipping.`)
                }
            }
            
            
            if (iterationNum * maxResults < playlistIds.length + 1) {
                cache.pages.push({ items: [] }); //Create empty page for next iteration.
                buildCache(playlistIds, cache, iterationNum);
                console.log(`Page ${ iterationNum } data has been retrieved.`);
            } else {
                localStorage.setItem(cacheName, JSON.stringify(cache)); //Save cache to storage once completed.
                console.log(`Page ${ iterationNum } data has been retrieved.`);
            }
        },
        error: function (response) {
            logAjaxError(response, 'buildCache()');
        }
    });
}

/*
    Retrives playlist info such as title, thumbnails, localized info, etc.
*/
function getPlaylistInfo() {
     $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlists',
        data: {
            key: apiKey,
            id: playlistId,
            part: 'snippet',
        },
        success: function (data) {
           console.log('Successfully retrieved playlist info');
           playlistInfo = ({ title: data.items[0].snippet.title,
                             description: data.items[0].snippet.description,
                             publishedAt: parseIsoToDate(data.items[0].snippet.publishedAt),
                             channelTitle: data.items[0].snippet.channelTitle,
                             channelId: data.items[0].snippet.channelId,
                             thumbnails: data.items[0].snippet.thumbnails,
                             localized: data.items[0].snippet.localized,
                          });
        },
        error: function (response) {
            logAjaxError(response, 'getPlaylistInfo()');
        }
     });
}

function renderItems(items) {
    const Item = ({ title, date, thumbnail, duration, views, id }) => `
    <a class="ytgallery-video-container" data-fancybox href="https://www.youtube.com/watch?v=${ id }">
        <div class= "ytgallery-thumbnail-container">
            <img class="ytgallery-video-thumbnail" src="${ thumbnail }">
            <p class="ytgallery-video-duration">${ duration }<\/p>
        <\/div>
        <p class="ytgallery-video-title">${ title }<\/p>
        <i class="far fa-clock" id="ytgallery-date-icon" aria-hidden="true"><\/i><p class="ytgallery-video-date">${ date }<\/p>
        <p class="ytgallery-video-views">${ views }<\/p><i class="fa fa-eye" id="ytgallery-views-icon" aria-hidden="true"><\/i>
    <\/a>
    `;

    if (searchEnabled === 'true') {
        $('#ytgallery-search').show();
    } else {
        $('#ytgallery-search').hide();
    }

    if (cache.numPages === 1) {
        $('.ytgallery-buttons').hide();
    } else {
        $('.ytgallery-buttons').show();
    }

    if (state === 'search') {
        $('.ytgallery-buttons').hide();
    } else if (state === 'default' && cache.numPages > 1) {
        $('.ytgallery-buttons').show();
    }

    $('.ytgallery-refresh').show();
    $('#ytgallery-flexbox').html(items.map(Item).join(''));
    $('#ytgallery-load-icon').hide();
    $('.ytgallery-pagination-text').text(`Page ${ currentPage } of ${ cache.numPages }`);

    ytButtonStyling();
    adjustColumns();
    
    // You might wanna remove this or edit it for your own site...
    if ($(document).scrollTop() - $('#ytgallery-flexbox').offset().top >= 200) {
        $('html, body').animate({ scrollTop: $('#ytgallery-search').offset().top - $('header').height() - 20 }, 'slow');
    }
    
    okayToPaginate = true;

}

//Will only execute if the search returns less items than allowed by the maxResults variable.
function search() {
    let input = document.getElementById('ytgallery-search').value.toLowerCase();

    if (input !== '') {
        let data = cache.pages;
        let results = [];

        for (let page of data) {
            for (let item of page.items) {
                if (item.title.toLowerCase().includes(input) || item.date.toLowerCase().includes(input)) {
                    results.push(item);
                }
            }
        }

        if (results.length < maxResults && results.length > 0) {
            $('#yt_loader').show();
            $('.yt_buttons').hide();

            currentSearchPage = 1;
            state = 'search';
            numSearchResults = results.length;
            renderItems(results);
        }
    } else {
        $("#yt_loader").show();
        state = 'default';
        renderItems(getPageData());
    }  
}

function ytButtons() {
    $('#ytgallery-back-top, #ytgallery-back-bottom').click(function () {
        if (okayToPaginate && currentPage !== 1) { //If on first page, disable back button.
            if (getPageData(currentPage - 2)) {
                okayToPaginate = false;
                currentPage--;

                $('#ytgallery-buttons-bottom').hide();
                $('ytgallery-load-icon').show();

                renderItems(getPageData());
            } else { //This shouldn't do anything, but it's there just in case something wonky happens.
                okayToPaginate = false;
                $('#ytgallery-flexbox').empty();
                $('#ytgallery-buttons-bottom').hide();
                $('#ytgallery-load-icon').show();
            }
        }
    });

    $('#ytgallery-next-top, #ytgallery-next-bottom').click(function () {
        if (okayToPaginate && currentPage !== cache.numPages) { //If on last page, disable next button.
            if (getPageData(currentPage).length > 0) { //Only run this method if the ajax request for page has completed.
                okayToPaginate = false;
                currentPage++;

                $('#ytgallery-buttons-bottom').hide();
                $('ytgallery-load-icon').show();

                renderItems(getPageData());
            } else { //Just wait until the ajax request is completed; buildCache() will automatically render it.
                currentPage++;
                okayToPaginate = false;
                $('#ytgallery-flexbox').empty();
                $('#ytgallery-buttons-bottom').hide();
                $('#ytgallery-load-icon').show();
            }
        }
    });

    $('#ytgallery-refresh-btn').click(function() { //Hide everything.
        refresh();
    });
}

function refresh() {
    state = 'default';
    currentPage = 1;
    $('.ytgallery-refresh').hide();
    $('#ytgallery-search').hide();
    $('#ytgallery-search').val('');
    $('#ytgallery-load-icon').show();
    $('#ytgallery-flexbox').empty();
    startRetrieval();
}

function ytButtonStyling() {
    if (cache.numPages === 1) {
        $('.ytgallery-buttons').hide();
    }
    
    if (currentPage === 1) {
        $('#ytgallery-back-top, #ytgallery-back-bottom').addClass('disabled');
    } else {
        $('#ytgallery-back-top, #ytgallery-back-bottom').removeClass('disabled');
    }

    if (currentPage === cache.numPages) {
        $('#ytgallery-next-top, #ytgallery-next-bottom').addClass('disabled');
    } else {
        $('#ytgallery-next-top, #ytgallery-next-bottom').removeClass('disabled');
    }
}

/*
    The columns setting only specifies a max number of columns....
    The columns will be automatically resized if the screen is too small.
*/
function adjustColumns() {
    var width = window.innerWidth;

    if (numColumns === "4" && width >= 1410) {
        $('.ytgallery-video-container').removeClass('col1 col2 col3').addClass('col4');
    } else if (numColumns === "3" || width >= 1050) {
        $('.ytgallery-video-container').removeClass('col1 col2 col4').addClass('col3');
    }
    
    if (numColumns === "2" || width < 1050) {
        $('.ytgallery-video-container').removeClass('col1 col3 col4').addClass('col2');
    }
    
    if (numColumns === "1" || width <= 768) {
        $('.ytgallery-video-container').removeClass('col2 col3 col4').addClass('col1');
    }
}

//A shortcut method for grabbing the correct page from the cache.
function getPageData(page) {
    pageRef = page || currentPage - 1;
    return cache.pages[pageRef].items;
}

/*
    The recordingDate field can be manually set for each video, has highest precedence.
    actualStartTime denotes when, if a video has been livestreamed, it began streaming.
    publishedAt is the time at which the video was officially published.
*/
function getDate(item) {
    if (item.recordingDetails && item.recordingDetails.recordingDate != null) {
        return parseIsoToDate(item.recordingDetails.recordingDate);
    } else if (item.liveStreamingDetails && item.liveStreamingDetails.actualStartTime != null) {
        return parseIsoToDate(item.liveStreamingDetails.actualStartTime);
    } else if (item.liveStreamingDetails && item.liveStreamingDetails.scheduledStartTime != null) {
        return parseIsoToDate(item.liveStreamingDetails.scheduledStartTime);
    } else {
        return parseIsoToDate(item.snippet.publishedAt);
    }
}

function logAjaxError(ajaxResponse, msg) {
    let response = JSON.parse(ajaxResponse.responseText);
    console.error(`${ msg } | Error ${ response.error.code }: ${ response.error.message }`);
    
    $('.ytgallery-ajaxerror').show();
    $('#ytgallery-load-icon, .ytgallery-buttons, #ytgallery-search').hide();
}

function parseIsoToDate(s) {
    date = new Date(s);
    year = date.getFullYear();
    month = date.toLocaleString('default', { month: 'long' });
    day = date.getUTCDate();

    return `${ month } ${ day }, ${ year }`;
}

function parseIsoToDuration(duration, type) {
    switch (type) {
        case 'live': return 'LIVE';
        case 'upcoming': return 'UPCOMING'
        default: break;
    }

    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    match = match.slice(1).map(function(x) {
        if (x != null) {
            return x.replace(/\D/, '');
        }
    });

    var hours = (parseInt(match[0]) || 0);
    var minutes = (parseInt(match[1]) || 0);
    if (minutes < 10 && minutes !== 0 && hours !== 0) { minutes = `0${ minutes }`; }
    var seconds = (parseInt(match[2]) || 0);
    if (seconds < 10) { seconds = `0${ seconds }`; }

    //return hours * 3600 + minutes * 60 + seconds;
    if (hours === 0) { return `${ minutes }:${ seconds }` } else { return `${ hours}:${ minutes }:${ seconds }`; }
}

function numberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
