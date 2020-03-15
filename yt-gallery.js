jQuery(document).ready(function() {
    checkCache();
    adjustColumns();
    ytButtons();

    var timer = null;
    $('#playlist_search').keyup(function() {
        clearTimeout(timer);
        timer = setTimeout(search, 250);
    });
});

window.addEventListener('resize', adjustColumns);

var playlistID = document.currentScript.getAttribute('playlistID');
var maxResults = document.currentScript.getAttribute('resultsPerPage');
var searchEnabled = document.currentScript.getAttribute('searchEnabled');
var numColumns = document.currentScript.getAttribute('columns') || 3;

var apiKey = 'AIzaSyDTZeKfWmeOytVM6fgCMsAR3R-Up-wdEJA';

var cacheName = 'yt_gly_' + playlistID;

var okayToPaginate = false;
var numPages;
var currentPage = 1;

var state;

function checkCache() {
    if (!localStorage[cacheName]) {
        getPlaylistItems();
        console.log('Cache for \"' + cacheName + '\" not found... building.');
    } else {
        let cacheTime = JSON.parse(localStorage[cacheName]).time;
        let d = new Date();
        let t = d.getTime();

        if (t - cacheTime > 86400000) {
            getPlaylistItems();
            console.log('Cache for \"' + cacheName + '\" is more than a day old... rebuilding.');
        } else {
            console.log('Cache for \"' + cacheName + '\" is less than a day old... keeping.');
            numPages = JSON.parse(localStorage[cacheName]).numPages;
            renderItems(returnPageCache());
        }
    }
}

function getPlaylistItems(data, token) {
    let d = new Date();
    let playlistItems = data || [];

    $('.yt_buttons').css('display', 'none');
    $('#playlist_search').css('display', 'none');
    $('.yt_refresh').css('display', 'none');

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        data: {
            key: apiKey,
            playlistId: playlistID,
            part: 'snippet',
            maxResults: 50,
            pageToken: token
        },
        success: function(data) {
            for (let item of data.items) {
                if (item.snippet.title !== 'Private video') {
                    playlistItems.push(item.snippet.resourceId.videoId);
                } else {
                    console.log('Video with ID \"' + item.snippet.resourceId.videoId + '\" is private. Skipping...');
                }
            }

            if (data.nextPageToken) {
                getPlaylistItems(playlistItems, data.nextPageToken);
            } else {
                console.log('Playlist items successfully grabbed with ' + playlistItems.length + ' items... building cache');
                buildCache(playlistItems);
            }
        },
        error: function(response) {
            logAjaxError(response, 'getPlaylistItems()');
        }
    });
}

function buildCache(playlistIDs, data, iteration) {
    let d = new Date();
    let cache = data || ({ time: d.getTime(), numPages: 0, pages: [{ items: [] }] });

    let iterationNum = iteration + 1 || 1;
    let ids = [];
    ids = playlistIDs.slice((iterationNum - 1) * maxResults, iterationNum * maxResults);

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        data: {
            key: apiKey,
            id: ids.toString(),
            part: 'snippet, contentDetails, statistics',
            maxResults: 50
        },
        success: function(data) {
            for (let item of data.items) {
                if (item.snippet.title !== 'Private video') {
                    cache.pages[iterationNum - 1].items.push({
                        title: item.snippet.title,
                        date: parseISOString(item.snippet.publishedAt),
                        thumbnail: item.snippet.thumbnails.medium.url,
                        duration: YTDurationToSeconds(item.contentDetails.duration),
                        views: numberWithCommas(item.statistics.viewCount),
                        id: item.id
                    });
                    localStorage.setItem(cacheName, JSON.stringify(cache));
		    ytButtonStyling();
                } else {
                    console.log('Video with ID \"' + item.snippet.resourceId.videoId + '\" is private. Skipping...');
                }
            }

            if (iterationNum === 1) {
                numPages = Math.ceil(playlistIDs.length / maxResults);
                cache.numPages = numPages;
                renderItems(cache.pages[iterationNum - 1].items);
            }

            if (iterationNum * maxResults < playlistIDs.length + 1) {
                console.log('Page ' + iterationNum + ' cache has been built.');
                cache.pages.push({ items: [] });
                buildCache(playlistIDs, cache, iterationNum);
            } else {
                console.log('Page ' + iterationNum + ' cache has been built.');
                console.log('Video cache successfully built with ' + playlistIDs.length + ' items.');
            }
        },
        error: function(response) {
            logAjaxError(response, 'buildCache()');
        }
    });
}

function renderItems(items) {
    const Item = ({ title, date, thumbnail, duration, views, id }) => `
    <a class="video_container" data-fancybox href="${ 'https://www.youtube.com/watch?v=' + id }">
        <div class= "thumb_contain">
            <img class="video_thumb" src="${ thumbnail }">
            <p class="yt_dur">${ duration }<\/p>
        <\/div>
        <p class="yt_desc">${ title }<\/p>
        <i class="far fa-clock" id="yt_date_icon" aria-hidden="true"><\/i><p class="yt_date">${ date }<\/p>
        <p class="yt_view">${ views }<\/p><i class="fa fa-eye" id="yt_view_icon" aria-hidden="true"><\/i>
    <\/a>
    `;

    if (searchEnabled === 'true') {
        $('#playlist_search').css('display', 'inherit');
    } else {
        $('#playlist_search').css('display', 'none');
    }

    if (numPages === 1) {
        $('.yt_buttons').css('display', 'none');
    } else {
        $('.yt_buttons').css('display', 'inherit');
    }

    if (state === 'search') {
        $('.yt_buttons').css('display', 'none');
    }
    if (state === 'default' && numPages > 1) {
        $('.yt_buttons').css('display', 'inherit');
    }

    $('.yt_refresh').css('display', 'inherit');
    $("#yt_flexbox").empty();
    $('#yt_flexbox').html(items.map(Item).join(''));
    $('#yt_loader').css('display', 'none');
    $('.pagination_txt').text('Page ' + currentPage + ' of ' + numPages);
    ytButtonStyling();
    okayToPaginate = true;
}

function search() {
    let input = document.getElementById('playlist_search').value.toLowerCase();

    if (input !== '') {
        let data = JSON.parse(localStorage[cacheName]).pages;
        let results = [];

        for (let page of data) {
            for (let item of page.items) {
                if (item.title.toLowerCase().includes(input) || item.date.toLowerCase().includes(input)) {
                    results.push(item);
                }
            }
        }

        if (results.length < maxResults && results.length > 0) {
            $('#yt_loader').css('display', 'inherit');
            $('.yt_buttons').css('display', 'none');

            currentSearchPage = 1;
            state = 'search';
            numSearchResults = results.length;
            renderItems(results);
        }
    } else {
        $("#yt_loader").css("display", "inherit");
        state = 'default';
        renderItems(returnPageCache());
    }
}

function ytButtons() {
    $('#yt_back_btn_top, #yt_back_btn_bottom').click(function() {
		goBack();
    });

    $('#yt_next_btn_top, #yt_next_btn_bottom').click(function() {
		goNext();
    });

    $('#yt_refresh_btn').click(function() {
        state = 'default';
        currentPage = 1;
        $('#playlist_search').val('');
        $('#yt_loader').css('display', 'inherit');
        $('#yt_flexbox').empty();
        getPlaylistItems();
    });
}

function goBack() {
	if (okayToPaginate && currentPage !== 1 && returnPageCache(currentPage - 2)) {
		if(returnPageCache(currentPage - 2)) {
			okayToPaginate = false;
			currentPage--;

			$('#yt_buttons_bottom').css('display', 'none');
			$('#yt_loader').css('display', 'inherit');

			renderItems(returnPageCache());
		} else {
			okayToPaginate = false;
			$('#yt_flexbox').empty();
			$('#yt_buttons_bottom').css('display', 'none');
			$('#yt_loader').css('display', 'inherit');
			setTimeout(goBack, 250);
		}
	}
}

function goNext() {
	if (okayToPaginate && currentPage !== numPages) {
		if(returnPageCache(currentPage)) {
			okayToPaginate = false;
			currentPage++ ;

			$('#yt_buttons_bottom').css('display', 'none');
			$('#yt_loader').css('display', 'inherit');

			renderItems(returnPageCache());
		} else {
			okayToPaginate = false;
			$('#yt_flexbox').empty();
			$('#yt_buttons_bottom').css('display', 'none');
			$('#yt_loader').css('display', 'inherit');
			setTimeout(goNext, 250);
		}
	}
}

function ytButtonStyling() {
    if (numPages === 1) {
        $('.yt_buttons').css('display', 'none');
    }

    if (currentPage === 1) {
        $('#yt_back_btn_top, #yt_back_btn_bottom').css({ 'background-color': '#cf7474', 'cursor': 'default' });
    } else {
        $('#yt_back_btn_top, #yt_back_btn_bottom').css({ 'background-color': '#cd4e4e', 'cursor': 'pointer' });
    }

    if (currentPage === numPages) {
        $('#yt_next_btn_top, #yt_next_btn_bottom').css({ 'background-color': '#cf7474', 'cursor': 'default' });
    } else {
        $('#yt_next_btn_top, #yt_next_btn_bottom').css({ 'background-color': '#cd4e4e', 'cursor': 'pointer' });
    }
}

function adjustColumns() {
    var width = window.innerWidth;

    if (numColumns === "3" && width >= 1024) {
        $(".video_container").css("width", "31%");
    }

    if (numColumns === "2" || width < 1024) {
        $(".video_container").css("width", "48%");
    }

    if (numColumns === "1" || width <= 768) {
        $(".video_container").css("width", "100%");
    }
}

function returnPageCache(page) {
    pageRef = page || currentPage - 1;
    return JSON.parse(localStorage[cacheName]).pages[pageRef].items;
}

function logAjaxError(ajaxResponse, msg) {
    let response = JSON.parse(ajaxResponse.responseText);
    let message = msg + ' | Error ' + response.error.code + ': ' + response.error.message;
    console.error(message);
    $('#yt_flexbox').html('<p style="text-align: center;">${ message }</p>');

    $('.yt_refresh').css('display', 'inherit');
    $('#yt_loader').css('display', 'none');
    $('.yt_buttons').css('display', 'none');
    $('#playlist_search').css('display', 'none');
}

function parseISOString(s) {
    date = new Date(s);
    year = date.getFullYear();
    month = date.toLocaleString('default', { month: 'long' });
    day = date.getDate();

    return month + " " + day + ", " + year;
}

function YTDurationToSeconds(duration) {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    match = match.slice(1).map(function(x) {
        if (x != null) {
            return x.replace(/\D/, '');
        }
    });

    var hours = (parseInt(match[0]) || 0);
    var minutes = (parseInt(match[1]) || 0);
    if (minutes < 10 && minutes !== 0) { minutes = "0" + minutes; }
    var seconds = (parseInt(match[2]) || 0);
    if (seconds < 10) { seconds = "0" + seconds; }

    //return hours * 3600 + minutes * 60 + seconds;
    if (hours === 0) { return minutes + ":" + seconds } else { return hours + ":" + minutes + ":" + seconds; }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
