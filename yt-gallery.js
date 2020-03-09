jQuery(document).ready(function() {
    getPlaylistItems();
    searchVisible();
    cacheControl();
    adjustColumns();
});

window.addEventListener('resize', adjustColumns);

var playlistID = document.currentScript.getAttribute('playlistID');
var maxResults = document.currentScript.getAttribute('resultsPerPage');
var searchEnabled = document.currentScript.getAttribute('searchEnabled');
var numColumns = document.currentScript.getAttribute('columns');

var searchCacheName = "yt_" + window.location.pathname.split("/").pop();

var videoIDs = [];
var apiKey = "YOUR_API_KEY_HERE";

var totalResults;
var numPages;
currentPage = 1;
var nextPageToken;
var prevPageToken;
var currentToken;
var okayToPaginate = true;

var state;

const Item = ({ id, snippet, contentDetails, statistics }) => `
<a class="video_container" data-fancybox href="${ 'https://www.youtube.com/watch?v=' + id }">
	<div class= "thumb_contain">
		<img class="video_thumb" src="${ snippet.thumbnails.medium.url }">
		<p class="yt_dur">${ YTDurationToSeconds(contentDetails.duration) }<\/p>
	<\/div>
	<p class="yt_desc">${ snippet.title }<\/p>
	<i class="far fa-clock" id="yt_date_icon" aria-hidden="true"><\/i><p class="yt_date">${ parseISOString(snippet.publishedAt) }<\/p>
	<p class="yt_view">${ statistics.viewCount }<\/p><i class="fa fa-eye" id="yt_view_icon" aria-hidden="true"><\/i>
<\/a>
`;

function getPlaylistItems(token) {
    $(".yt_refresh").css("display", "none");
	$("#yt_flexbox").empty();
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        data: {
            key: apiKey,
            playlistId: playlistID,
            part: 'snippet',
            maxResults: maxResults,
            pageToken: token
        },
        success: function(data) {
            console.log(data);
            nextPageToken = data.nextPageToken;
            prevPageToken = data.prevPageToken;
            totalResults = data.pageInfo.totalResults;
            numPages = Math.ceil(totalResults / maxResults);
            $(".pagination_txt").text("Page " + currentPage + " of " + numPages);
            getVideos(data, false);
        },
        error: function(response) {
            loadFailed(response, "getPlaylistItems()");
        }
    });
}

function getVideos(data, skipIteration) {
    videoIDs = [];

    if (!skipIteration) {
        for (var item of data.items) {
            if (item.snippet.title !== "Private video") {
                videoIDs.push(item.snippet.resourceId.videoId);
            } else {
                console.log("Video with ID \"" + item.snippet.resourceId.videoId + "\" is private. Skipping...");
            }
        }
    } else {
        videoIDs = data.slice();
    }

    console.log(videoIDs);

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        data: {
            key: apiKey,
            id: videoIDs.toString(),
            part: 'snippet, contentDetails, statistics',
            maxResults: maxResults
        },
        success: function(data) {
            console.log(data);
            $(".yt_refresh").css("display", "none");
            $("#yt_loader").css("display", "none");
            $("#yt_flexbox").html(data.items.map(Item).join(''));
            $("#yt_buttons_bottom").css("display", "inherit");
            okayToPaginate = true;
            ytButtons();
            adjustColumns();
        },
        error: function(response) {
            loadFailed(response, "getVideos()");
        }
    });

}

function ytButtons() {
    if (!prevPageToken) {
        $("#yt_back_btn_top, #yt_back_btn_bottom").css({ "background-color": "#cf7474", "cursor": "default" });
    } else {
        $("#yt_back_btn_top, #yt_back_btn_bottom").css({ "background-color": "#cd4e4e", "cursor": "pointer" });
    }

    if (!nextPageToken) {
        $("#yt_next_btn_top, #yt_next_btn_bottom").css({ "background-color": "#cf7474", "cursor": "default" });
    } else {
        $("#yt_next_btn_top, #yt_next_btn_bottom").css({ "background-color": "#cd4e4e", "cursor": "pointer" });
    }

    if (numPages === 1) {
        $(".yt_buttons").css("display", "none");
    }
    
    if(state === "search") {
    	$(".yt_buttons").css("display", "none");
    }
    
    if(state === "default" && numPages > 1) {
    	$(".yt_buttons").css("display", "inherit");
    }

    $("#yt_back_btn_top, #yt_back_btn_bottom").click(function() {
        if (okayToPaginate && currentPage - 1 !== 0) {
            getPlaylistItems(prevPageToken);
            currentToken = prevPageToken;
            okayToPaginate = false;
            $("#yt_loader").css("display", "inherit");
            $("#yt_buttons_bottom").css("display", "none");
            currentPage--;
        }
    });
    $("#yt_next_btn_top, #yt_next_btn_bottom").click(function() {
        if (okayToPaginate && currentPage + 1 !== numPages + 1) {
            getPlaylistItems(nextPageToken);
            currentToken = nextPageToken;
            okayToPaginate = false;
            $("#yt_loader").css("display", "inherit");
            $("#yt_buttons_bottom").css("display", "none");
            currentPage++;
        }
    });
    $("#yt_refresh_btn").click(function() {
        $("#yt_loader").css("display", "inherit");
        $(".yt_buttons").css("display", "inherit");
        getPlaylistItems();
        searchVisible();
    });
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

function loadFailed(apiResponse, msg) {
    $("#yt_flexbox").html("<p style='text-align: center;'>The videos failed to load. If the problem persists, please contact us at <a href='mailto:support@chestateesda.org'>support@chestateesda.org</a>.</p>");
    $(".yt_refresh").css("display", "inherit");
    $("#yt_loader").css("display", "none");
    $(".yt_buttons").css("display", "none");
    $("#playlist_search").css("display", "none");
    ytButtons();
    let response = JSON.parse(apiResponse.responseText);
    console.error(msg + " | Error " +  response.error.code + ": " + response.error.message);
}

function searchPlaylist() {
    let input = document.getElementById('playlist_search').value.toLowerCase();
    console.log("Search: " + input);
    if (input !== "") {
        let data = JSON.parse(localStorage[searchCacheName]);
        let results = [];
        for (let item of data.contents) {
            if (item.title.toLowerCase().includes(input)) {
                results.push(item.id);
            }
        }
        if (results.length < 50 && results.length > 0) {
        	$("#yt_flexbox").empty();
            $("#yt_loader").css("display", "inherit");
            $(".yt_buttons").css("display", "none");
            getVideos(results, true)
            state = "search";
        }
    } else {
    	$("#yt_flexbox").empty();
        $("#yt_loader").css("display", "inherit");
        getPlaylistItems(currentToken);
        state = "default";
    }
}

/*
    Method checks if cache exists. If so, it checks if the cache is more than one day old.
    If it is, it recreates the cache anyway. Otherwise
*/
function cacheControl() {
	if(searchEnabled === "true") {
	    if (!localStorage[searchCacheName]) {
	        cache()
	        console.log("Cache for \"" + searchCacheName + "\" not found... building.")
	    } else {
	        let cacheTime = JSON.parse(localStorage[searchCacheName]).time;
	        let d = new Date();
	        let t = d.getTime();
	        if (t - cacheTime > 86400000) {
	            cache();
	            console.log("Cache for \"" + searchCacheName + "\" is more than a day old... rebuilding.")
	        } else {
	            console.log("Cache for \"" + searchCacheName + "\" is less than a day old... keeping.")
	        }
	    }
	}
}

function cache(data, token) {
    let d = new Date();
    var searchCache = data || ({ time: d.getTime(), contents: [] });

    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        data: {
            key: apiKey,
            playlistId: playlistID,
            part: 'snippet',
            maxResults: 50,
            pageToken: token,
        },
        success: function(data) {
            cacheNextPageToken = data.nextPageToken;
            for (let item of data.items) {
                if (item.snippet.title !== "Private video") {
                    searchCache.contents.push({ title: item.snippet.title, id: item.snippet.resourceId.videoId });
                }
            }

            if (data.nextPageToken) {
                cache(searchCache, data.nextPageToken);
            } else {
                localStorage.setItem(searchCacheName, JSON.stringify(searchCache));
                console.log(searchCache);
            }
        },
        error: function(response) {
            loadFailed(response, "cache()");
        }
    });
}

function searchVisible() {
    if (searchEnabled === "false") {
        $("#playlist_search").css("display", "none");
    }
}

function adjustColumns() {
	var width = window.innerWidth;
	
    if(numColumns === "2") {
		$(".video_container").css("width", "48%");
    }
	
    if(numColumns === "1" || width <= 768) {
    	$(".video_container").css("width", "100%");
    }
}
