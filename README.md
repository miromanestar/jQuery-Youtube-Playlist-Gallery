# jQuery-Youtube-Playlist-Gallery
A HTML/JS/CSS paginated youtube playlist gallery with jQuery and fancybox! Also has built in search capability!

The script tag for yt-gallery.js has several attributes:

 - playlistID is the youtube playlist ID

 - [Optional] searchEnabled is true/false, hides searchbar, default = true
  
 - [Optional] columns can be 1, 2, or 3 (It will remain responsive regardless), default = 3
 
 - [Optional] resultsPerPage has a limit of 50 as per the youtube API, default = 5 (Set by Youtube API)
  

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
