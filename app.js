var app = angular.module('QueueTube', []);

Ladda.bind( 'button', {
   callback: function( instance ) {
      setTimeout(function() {
          instance.stop();
      },6000)
      var videos = angular.element(document.getElementById('query')).scope().upcoming;
      var history = angular.element(document.getElementById('query')).scope().history;
      if(history.length >= 1){
        videos.unshift(history[0]);
      }
      var apiUrl = "https://z3ahb3w7kb.execute-api.us-east-1.amazonaws.com/dev/queuetube";
      var saveData = $.ajax({
            type: 'POST',
            url: apiUrl,
            data: JSON.stringify(videos),
            dataType: "json",
            headers: { 'MY_CUSTOM_HEADER': 'MY_CUSTOM_HEADER_VALUE' },
            success: function(resultData) {
              instance.stop();
              console.log(resultData.playlistURL);
              var finalURL = window.location.href.split('#')[0]+"#"+resultData.playlistURL;
              vex.dialog.open({
                  message: 'Share your playlist using the below link:',
                  input: [
                      '<input name="url" type="text" placeholder="URL" value="'+finalURL+'"/>',
                  ].join(''),
                  buttons: [
                      $.extend({}, vex.dialog.buttons.NO, { text: 'Back' })
                  ],
                  callback: function (data) {
                      if (!data) {
                          console.log('Cancelled')
                      } else {
                          // console.log('Username', data.username, 'Password', data.password)
                      }
                  }
              })
            }
      });
      saveData.error(function() { alert("Something went wrong"); });
   }
});

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
  if(keyword == ''){
    console.log("Blank search");
    return;
  }
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
  tag.src = "https://www.youtube.com/iframe_api";
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
    {id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You [Official Video]'},
    {id: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk ft. Bruno Mars'},
    {id: 'bpOSxM0rNPM', title: 'Arctic Monkeys - Do I Wanna Know? (Official Video)'},
    {id: 'D5drYkLiLI8', title: "Kygo, Selena Gomez - It Ain't Me (with Selena Gomez) (Audio)"},
    {id: 'DpMfP6qUSBo', title: 'Marian Hill - Down'},
    {id: 'DQ2AJlN_ksc', title: 'Jai Wolf - Indian Summer'},
  ];
  var history = [
    
  ];

  $window.onYouTubeIframeAPIReady = function () {
    for (var i = 0; i <= upcoming.length - 1; i++) {
      console.log(upcoming[i].title);
    }
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
    if (window.location.hash) {
      var searchTerm = decodeURIComponent(window.location.hash.substring(1));
      console.log("SEARCH TERM "+searchTerm);
      var apiUrl = "https://z3ahb3w7kb.execute-api.us-east-1.amazonaws.com/dev/queuetube";
      $.ajax({
        url: apiUrl,
        type: "get", //send it through get method
        data: { 
          playlistURL: searchTerm,
        },
        success: function(response) {
          var newupcoming = JSON.parse(response[0].playlist);
          console.log("NEW");
          // console.log(newupcoming);
          var oldupcoming = service.getUpcoming().slice();
          console.log("OLD");
          console.log(oldupcoming.length);
          for (var i = 0; i <= oldupcoming.length - 1; i++) {
            console.log("Deleting ", oldupcoming[i].title);
            service.deleteVideo('upcoming', oldupcoming[i].id);
          }
          // if(newupcoming.length >= 1){
          //   console.log("Playing ", newupcoming[0].title);
          //   service.launchPlayer(newupcoming[0].id, newupcoming[0].title);
          //   service.archiveVideo(newupcoming[0].id, newupcoming[0].title);
          //   // service.deleteVideo('upcoming', firstVideo.id);
          // }
          for (var i = 1; i <= newupcoming.length - 1; i++) {
            console.log("Queueing ", newupcoming[i].title);
            service.queueVideo(newupcoming[i].id, newupcoming[i].title);
          }
          service.launchPlayer(newupcoming[0].id, newupcoming[0].title);
          service.archiveVideo(newupcoming[0].id, newupcoming[0].title);
          var el = document.getElementById('upcoming');
          var sortable = Sortable.create(el, {onEnd: function (/**Event*/evt) {
              upcoming.splice(evt.newIndex, 0, upcoming.splice(evt.oldIndex, 1)[0]);
          }});
          // service.deleteVideo('upcoming', newupcoming[0].id);
        },
        error: function(xhr) {
          alert("No playlist found");
        }
      });
    }
    else{
      var randomNumber = Math.floor(Math.random() * upcoming.length);
      var firstVideo = upcoming[randomNumber];
      service.launchPlayer(firstVideo.id, firstVideo.title);
      service.archiveVideo(firstVideo.id, firstVideo.title);
      service.deleteVideo('upcoming', firstVideo.id);
      //event.target.playVideo();
      var el = document.getElementById('upcoming');
      var sortable = Sortable.create(el, {onEnd: function (/**Event*/evt) {
          upcoming.splice(evt.newIndex, 0, upcoming.splice(evt.oldIndex, 1)[0]);
      }});
    }
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
    console.log("LAUNCH PLAYER");
    console.log(id);
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
    console.log("deleting list");
    // console.log(list);
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

  this.setUpcoming = function (newupcoming) {
    upcoming = newupcoming;
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