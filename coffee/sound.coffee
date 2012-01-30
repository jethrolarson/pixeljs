# From https://github.com/STRd6/browserlib/blob/pixie/src/sound.coffee
(($) ->
	###*
	A simple interface for playing sounds in games.

	@name Sound
	@namespace
	###
	directory = App?.directories?.sounds || "sounds"
	format = "wav"
	sounds = {}
	BASE_URL = ""
	directory = '/public/audio/'

	loadSoundChannel = (name) ->
		url = "#{BASE_URL}/#{directory}/#{name}.#{format}"

		sound = $('<audio />',
			autobuffer: true
			preload: 'auto'
			src: url
		).get(0)

	Sound = (id, maxChannels) ->
		play: ->
			Sound.play(id, maxChannels)

		stop: ->
			Sound.stop(id)

	Object.extend Sound,
		###*
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
		###	 
		play: (id, maxChannels) ->
			# TODO: Too many channels crash Chrome!!!1
			maxChannels ||= 4

			unless sounds[id]
				sounds[id] = [loadSoundChannel(id)]

			channels = sounds[id]

			freeChannels = $.grep channels, (sound) ->
				sound.currentTime == sound.duration || sound.currentTime == 0

			if channel = freeChannels.first()
				try
					channel.currentTime = 0

				channel.play()
			else
				if !maxChannels || channels.length < maxChannels
					sound = loadSoundChannel(id)
					channels.push(sound)
					sound.play()

		###*
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
		### 
		playFromUrl: (url) ->
			sound = $('<audio />').get(0)
			sound.src = url

			sound.play()

			return sound

		###*
		Stop a sound while it is playing.

		<code><pre>
		# stops the sound 'explode' from 
		# playing if it is currently playing 
		Sound.stop('explode')
		</pre></code>

		@name stop
		@methodOf Sound

		@param {String} id id or name of sound to stop playing.
		### 
		stop: (id) ->
			sounds[id]?.stop()

		(exports ? this)["Sound"] = Sound
)(jQuery)
