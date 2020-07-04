# jQuery-Youtube-Playlist-Gallery
A HTML/JS/CSS paginated youtube playlist gallery with jQuery and fancybox! Also has built in search capability!

The script tag for yt-gallery.js has several attributes:

 - playlistID is the youtube playlist ID

 - [Optional] searchEnabled is true/false, hides searchbar, default = true
 
      The search bar will only work if it finds any results and if the number of results are less than resultsPerPage.
  
 - [Optional] columns can be 1, 2, 3, or 4 (It will remain responsive regardless), default = 3
 
      The columns argument only controls the max number of columns, but the actual number will change based on the
      size of the screen, ensuring it is always responsive and the video elements are never crushed together.
 
 - [Optional] resultsPerPage maximum is 50, default = 5
 
      The pagination in this script is not handled by the youtube data api, but the per page limit is 50. The pagination is handled via parsing a stored array which contains all       the pertinent data.
      
      All dates are formatted in the Month Day, Year format, and video duration is formatted to Hour:Minute:Seconds. The structure for the playlist data format is like so:
      ```
      ytgallery-PLAYLISTID
      {
        time: //Holds the date the cache was created, used for determining if cache needs to be remade
        numPages: //Holds the number of pages based on number of items and items per page
        
        playlistInfo: {
            title, description, publishedAt, channelId, channelTitle
            localized: {
                title, description
            }
            thumbnails: {
                default, medium, high
            }
        }
        
        pages: [{
            items: [{
                title, description, date, id, duration, thumbnail, views
            }]
        }]
      }
      ```
  

[Visit the live demo here.](https://miromanestar.github.io/jQuery-Youtube-Playlist-Gallery/)

**Dependencies**

<a href="https://jquery.com/">jQuery</a>
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
```
<a href="https://fancyapps.com/fancybox/3/">jQuery Fancybox</a>
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.js"></script>
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.css">
```
<a href="https://fontawesome.com/">FontAwesome Icons</a>
```html
<script src="https://kit.fontawesome.com/11c9b56b5a.js" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
```
