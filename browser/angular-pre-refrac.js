var jukeApp = angular.module('juke', []);

jukeApp.filter('join', function() {
    return function (item) {
        return item.join(', ');
    }
})

jukeApp.controller('albumCtrl', function ($scope, $http, $rootScope) {
    
    var audio;
    var songId;

    $scope.albumData;

    // AJAX request

    $http.get('/api/albums')
    .then(function (response) {
        return response.data
    })
    .then(function (albums) {
        var listOfIds = albums.map( (album) => {return album.id });
        var albumId = listOfIds[Math.floor(Math.random()*listOfIds.length)];
        return $http.get('/api/albums/' + albumId);
    })
    .then(function (response) {
        return response.data
    })
    .then(function (album) {
        album.imageUrl = 'api/albums/' + album.id + '/image';
        $scope.albumData = album;
        $rootScope.$broadcast("albumDataAcrossTheBorder", $scope.albumData);
    })
    .catch(console.error.bind(console));
    
    $rootScope.$on('playNext', function (event, data){
        $scope.play(data.next, data.index)
    })

    function playAudio (songId) {
        audio.src = '/api/songs/' + songId + '/audio';
        audio.load();
        audio.play();
    }

    $scope.play = function(song, $index){
        songId = song.id;
        
        $rootScope.$broadcast("setIsPausedToFalse");
        $rootScope.$broadcast("currSongIndex", $index);

        if ($scope.currentSong) {
            $scope.currentSong = song;
            audio.pause();
            playAudio(songId);
            $rootScope.$broadcast("updateAudio", audio);
        } else {
            $scope.currentSong = song;
            audio = document.createElement('audio');
            playAudio(songId);

            // Ready to Start Player Controller
            $rootScope.$broadcast("startPlayer")
            $rootScope.$broadcast("updateAudio", audio);
            $rootScope.$broadcast("addAudioEventListeners"); // only gets called once
        }

    }

})

jukeApp.controller('playerCtrl', function ($scope, $rootScope) {
    $scope.showFooter = false;
    $scope.isPaused = false;
    var currSongIndex;
    var albumData; 

    var audio;

    $rootScope.$on("albumDataAcrossTheBorder", function (event, data){
        albumData = data; 
    })

    $rootScope.$on('startPlayer', function (){
        $scope.showFooter = true; 
    })

    $rootScope.$on('addAudioEventListeners', function () {
        // Event Listeners for Audio Player
        audio.addEventListener('ended', function () {
          $scope.forwards(); // or some other way to go to the next song
          $scope.$digest();
        });

        audio.addEventListener('timeupdate', function () {
          $scope.progress = 100 * audio.currentTime / audio.duration;
          $scope.$digest();
        });
    })

    $rootScope.$on('updateAudio', function (event, data) {
        audio = data;
    })

    $rootScope.$on('setIsPausedToFalse', function() {
        $scope.isPaused = false;
    })

    $rootScope.$on("currSongIndex", function(event, data){ //ignoring the event part
        currSongIndex = data; 
    })

    $scope.pause = function () {
        if (!$scope.isPaused) {
            audio.pause();
            $scope.isPaused = true;
        } else {
            audio.play();
            $scope.isPaused = false;
        }
    }

    $scope.backwards = function () {
        if (currSongIndex === 0) {
            var endIndexOfAlbum = albumData.songs.length - 1
            var nextSong = albumData.songs[endIndexOfAlbum]
            $rootScope.$broadcast("playNext", {next: nextSong, index: endIndexOfAlbum})
        
        } else {
            var nextSong = albumData.songs[currSongIndex - 1];
            $rootScope.$broadcast("playNext", {next: nextSong, index: currSongIndex - 1})
        }
    }

    $scope.forwards = function () {
        var lengthOfAlbum = albumData.songs.length - 1
        if (currSongIndex === lengthOfAlbum) {
            console.log('Now playing ' + currSongIndex);
            var nextSong = albumData.songs[0]
            console.log(nextSong);
            $rootScope.$broadcast("playNext", {next: nextSong, index: 0})
        } else {
            var nextSong = albumData.songs[currSongIndex + 1];
            $rootScope.$broadcast("playNext", {next: nextSong, index: currSongIndex + 1})
        }
    }

})