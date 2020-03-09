# jQuery-Youtube-Playlist-Gallery
A HTML/JS/CSS paginated youtube playlist gallery with jQuery and fancybox! Also has built in search capability!

The script tag for yt-gallery.js has several attributes:

  searchEnabled is true/false, if false also disables the search cache to reduce API requests
  
  columns can be 1, 2, or 3 (It will remain responsive regardless)
  
  playlistID is the youtube playlist ID
  
  resultsPerPage has a limit of 50 as per the youtube API
  

Visit my github page for a live demo: https://miromanestar.github.io/jQuery-Youtube-Playlist-Gallery/

**Dependencies**

jQuery
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
