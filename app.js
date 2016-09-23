var app = angular.module('QueueTube', []);

function onKeyDown(e) {
  //console.log("In instant search");
}

function onBodyLoad() {
  currentSearch = "";
  currentSuggestion = "";
  currentVideoId = "";
  playlistShowing = false;
  playlistArr = [];
  xhrWorking = false;
  pendingSearch = false;
  pendingDoneWorking = false;
}

function doInstantSearch() {
  //console.log("In instant search");
  if (xhrWorking) {
    pendingSearch = true;
    return;
  }
  var searchBox = $("#query");
  if (searchBox.val() == currentSearch) {
    return;
  }
  currentSearch = searchBox.val();
  keyword = searchBox.val();
  var the_url = "http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&jsonp=window.yt.www.suggest.handleResponse&q=" + encodeURIComponent(searchBox.val()) + "&cp=1";
  $.ajax({
    type: "GET",
    url: the_url,
    dataType: "script"
  });
  xhrWorking = true;
}

yt = {};

yt.www = {};

yt.www.suggest = {};

yt.www.suggest.handleResponse = function(suggestions) {
  //console.log("Suggestions are:");
  //console.log(suggestions);
  
  if (suggestions[1][0]) {
    var searchTerm = suggestions[1][0][0];
  } else {
    var searchTerm = null;
  }
  //console.log("Yo!!");
  document.getElementById('play').innerHTML = searchTerm;
  searchtermdisplay = keyword;
  //$rootScope.$apply();
  if (!searchTerm) {
    searchTerm = keyword;
  }
  angular.element(document.getElementById('query')).scope().search(searchTerm);
};

function doneWorking() {
  xhrWorking = false;
  if (pendingSearch) {
    pendingSearch = false;
    doInstantSearch();
  }
  var searchBox = $("#searchBox");
  searchBox.attr("class", "statusPlaying");
}

// Run

app.run(function () {
  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

// Config

app.config( function ($httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// Service

app.service('VideosService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {

  var service = this;

  var youtube = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '480',
    playerWidth: '640',
    state: 'stopped'
  };

  var searchtermdisplay = 'hello';

  var results = [];
  var upcoming = [
    {id: 'PT2_F-1esPk', title: 'The Chainsmokers - Closer (Lyric) ft. Halsey'},
    {id: 'BPNTC7uZYrI', title: 'Coldplay - Up&Up (Official video)'},
    {id: 'jGflUbPQfW8', title: 'OMI - Cheerleader (Felix Jaehn Remix) [Official Video]'},
    {id: 'bx1Bh8ZvH84', title: 'Oasis - Wonderwall'},
    {id: 'zwJPcRtbzDk', title: 'Daft Punk - Human After All (SebastiAn Remix)'},
    {id: 'sEwM6ERq0gc', title: 'HAIM - Forever (Official Music Video)'},
    {id: 'fTK4XTvZWmk', title: 'Housse De Racket â˜â˜€â˜ Apocalypso'}
  ];
  var history = [
    
  ];

  $window.onYouTubeIframeAPIReady = function () {
    $log.info('Youtube API is ready');
    var searchBox = $("#query");
    searchBox.keyup(doInstantSearch);
    onBodyLoad();
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
    $rootScope.$apply();
  };

  function onYoutubeReady (event) {
    $log.info('YouTube Player is ready');
    var randomNumber = Math.floor(Math.random() * upcoming.length);
    // youtube.player.cueVideoById(history[0].id);
    // youtube.videoId = history[0].id;
    // youtube.videoTitle = history[0].title;
    var firstVideo = upcoming[randomNumber];
    service.launchPlayer(firstVideo.id, firstVideo.title);
    service.archiveVideo(firstVideo.id, firstVideo.title);
    service.deleteVideo('upcoming', firstVideo.id);
    //event.target.playVideo();
    var el = document.getElementById('upcoming');
    var sortable = Sortable.create(el, {onEnd: function (/**Event*/evt) {
        //upcoming[evt.oldIndex]
        upcoming.splice(evt.newIndex, 0, upcoming.splice(evt.oldIndex, 1)[0]);
        //console.log(evt.oldIndex);  // element's old index within parent
        //console.log(evt.newIndex);  // element's new index within parent
        
    }});
  }

  function onYoutubeStateChange (event) {
    if (event.data == YT.PlayerState.PLAYING) {
      youtube.state = 'playing';
    } else if (event.data == YT.PlayerState.PAUSED) {
      youtube.state = 'paused';
    } else if (event.data == YT.PlayerState.ENDED) {
      youtube.state = 'ended';
      service.launchPlayer(upcoming[0].id, upcoming[0].title);
      service.archiveVideo(upcoming[0].id, upcoming[0].title);
      service.deleteVideo('upcoming', upcoming[0].id);
    }
    $rootScope.$apply();
  }

  this.bindPlayer = function (elementId) {
    $log.info('Binding to ' + elementId);
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': onYoutubeReady,
        'onStateChange': onYoutubeStateChange
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        youtube.player.destroy();
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id, title) {
    youtube.player.loadVideoById(id);
    youtube.videoId = id;
    youtube.videoTitle = title;
    return youtube;
  }

  this.listResults = function (data) {
    results.length = 0;
    for (var i = 0; i <= data.items.length - 1; i++) {
      results.push({
        id: data.items[i].id.videoId,
        title: data.items[i].snippet.title,
        description: data.items[i].snippet.description,
        thumbnail: data.items[i].snippet.thumbnails.default.url,
        author: data.items[i].snippet.channelTitle
      });
    }
    return results;
  }

  this.queueVideo = function (id, title) {
    upcoming.push({
      id: id,
      title: title
    });
    return upcoming;
  };

  this.archiveVideo = function (id, title) {
    history.unshift({
      id: id,
      title: title
    });
    return history;
  };

  this.deleteVideo = function (list, id) {
    if(list === 'upcoming'){
      list = upcoming;
    }
    else{
      list = history;
    }
    //console.log("deleting " + list);
    for (var i = list.length - 1; i >= 0; i--) {
      //console.log(list[i].id);
      if (list[i].id === id) {
        list.splice(i, 1);
        break;
      }
    }
  };

  this.getYoutube = function () {
    return youtube;
  };

  this.getResults = function () {
    return results;
  };

  this.getUpcoming = function () {
    return upcoming;
  };

  this.getHistory = function () {
    return history;
  };

}]);

// Controller

app.controller('VideosController', function ($scope, $http, $log, VideosService) {

    init();

    function init() {
      $scope.youtube = VideosService.getYoutube();
      $scope.results = VideosService.getResults();
      $scope.upcoming = VideosService.getUpcoming();
      $scope.history = VideosService.getHistory();
      $scope.playlist = true;
    }

    function doYoutubeSearch(keyword) {
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyBLetBQN3JhsaMmtErnf_brKYevhp2n9Kc',
          type: 'video',
          maxResults: '8',
          part: 'id,snippet',
          fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
          q: keyword
        }
      })
      .success( function (data) {
        VideosService.listResults(data);
        $log.info(data);
        doneWorking();
      })
      .error( function () {
        $log.info('Search error');
      });
    }

    $scope.launch = function (id, title) {
      VideosService.launchPlayer(id, title);
      VideosService.archiveVideo(id, title);
      VideosService.deleteVideo('upcoming', id);
      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.queue = function (id, title) {
      VideosService.queueVideo(id, title);
      VideosService.deleteVideo('history', id);
      $log.info('Queued id:' + id + ' and title:' + title);
    };

    $scope.delete = function (list, id) {
      //console.log("in delete with " + list +  " " + id);
      VideosService.deleteVideo(list, id);
    };

    $scope.changed = function (event) {
      //console.log("haha");
    };

    $scope.search = function (keyword) {
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyBLetBQN3JhsaMmtErnf_brKYevhp2n9Kc',
          type: 'video',
          maxResults: '8',
          part: 'id,snippet',
          fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
          q: keyword
        }
      })
      .success( function (data) {
        VideosService.listResults(data);
        $log.info(data);
        doneWorking();
      })
      .error( function () {
        $log.info('Search error');
      });
    }

    $scope.tabulate = function (state) {
      $scope.playlist = state;
    }
});