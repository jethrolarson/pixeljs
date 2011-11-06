(function() {
  (function($) {
    /**
    	A simple interface for playing sounds in games.
    
    	@name Sound
    	@namespace
    	*/
    var BASE_URL, Sound, directory, format, loadSoundChannel, sounds, _ref;
    directory = (typeof App !== "undefined" && App !== null ? (_ref = App.directories) != null ? _ref.sounds : void 0 : void 0) || "sounds";
    format = "wav";
    sounds = {};
    BASE_URL = "";
    directory = '/public/audio/';
    loadSoundChannel = function(name) {
      var sound, url;
      url = "" + BASE_URL + "/" + directory + "/" + name + "." + format;
      return sound = $('<audio />', {
        autobuffer: true,
        preload: 'auto',
        src: url
      }).get(0);
    };
    Sound = function(id, maxChannels) {
      return {
        play: function() {
          return Sound.play(id, maxChannels);
        },
        stop: function() {
          return Sound.stop(id);
        }
      };
    };
    return Object.extend(Sound, {
      /**
      		Play a sound from your sounds 
      		directory with the name of `id`.
      
      		<code><pre>
      		# plays a sound called explode from your sounds directory
      		Sound.play('explode')
      		</pre></code>
      
      		@name play
      		@methodOf Sound
      
      		@param {String} id id or name of the sound file to play
      		@param {String} maxChannels max number of sounds able to be played simultaneously
      		*/
      play: function(id, maxChannels) {
        var channel, channels, freeChannels, sound;
        maxChannels || (maxChannels = 4);
        if (!sounds[id]) {
          sounds[id] = [loadSoundChannel(id)];
        }
        channels = sounds[id];
        freeChannels = $.grep(channels, function(sound) {
          return sound.currentTime === sound.duration || sound.currentTime === 0;
        });
        if (channel = freeChannels.first()) {
          try {
            channel.currentTime = 0;
          } catch (_e) {}
          return channel.play();
        } else {
          if (!maxChannels || channels.length < maxChannels) {
            sound = loadSoundChannel(id);
            channels.push(sound);
            return sound.play();
          }
        }
      },
      /**
      		Play a sound from the given
      		url with the name of `id`.
      
      		<code><pre>
      		# plays the sound at the specified url
      		Sound.playFromUrl('http://YourSoundWebsite.com/explode.wav')
      		</pre></code>
      
      		@name playFromUrl
      		@methodOf Sound
      
      		@param {String} url location of sound file to play
      
      		@returns {Sound} this sound object
      		*/
      playFromUrl: function(url) {
        var sound;
        sound = $('<audio />').get(0);
        sound.src = url;
        sound.play();
        return sound;
      },
      /**
      		Stop a sound while it is playing.
      
      		<code><pre>
      		# stops the sound 'explode' from 
      		# playing if it is currently playing 
      		Sound.stop('explode')
      		</pre></code>
      
      		@name stop
      		@methodOf Sound
      
      		@param {String} id id or name of sound to stop playing.
      		*/
      stop: function(id) {
        var _ref2;
        return (_ref2 = sounds[id]) != null ? _ref2.stop() : void 0;
      }
    }, (typeof exports !== "undefined" && exports !== null ? exports : this)["Sound"] = Sound);
  })(jQuery);
}).call(this);