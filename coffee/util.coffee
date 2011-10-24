unless Function.bind?
	Function::bind = (fn, context) ->
		context ||= this
		return -> fn.apply(context, arguments)

String.prototype.replaceAt = (index, char)->
	return this.substr(0, index) + char + this.substr(index+char.length)

window.multiplyString = (str,times)->
	s = ''
	for i in [0...times]
		s+=str
	s

$(window).mousedown (e)->
	target = $ e.target
	if e.which is 1
		target.trigger 'leftdown'
	else if e.which is 2
		target.trigger 'middledown'
	else if e.which is 3
		target.trigger 'rightdown'
	true
$.fn.rightdown = (handler,disableContext)->
	@disableContext if disableContext
	@bind 'rightdown', handler
$.fn.disableContext = -> @each -> @oncontextmenu = -> false
$.fn.enableContext = -> @each -> @oncontextmenu = null

Audio = (url)->
	@url = url
	@audio = document.createElement('audio')
	@audio.autobuffer = true
	@audio.src = url
	@audio.load()
	@isPlaying = false
	return this
Audio::isLoaded = false
Audio::play = ->
	try
		@audio.currentTime = 0
	@audio.play()
	@isPlaying = true
Audio::stop = ->
	@audio.currentTime = 0
	@isPlaying = false
	@audio.pause()

window.Audio = Audio

SoundGroup = (url, channels)->
	channels ||= 1
	@url = url
	@channels = []
	for i in [0...channels]
		@addChannel()
	this
SoundGroup::play = (channel)->
	if typeof channel isnt 'undefined'
		@channels[channel].play()
	else
		@getNotPlaying().play()
SoundGroup::addChannel = ()->
	newAudio = new Audio @url
	@channels.push newAudio
	return newAudio
SoundGroup::stop = (channel)->
	if typeof channel isnt 'undefined'
		@channels[channel].stop()
	else
		@getNotPlaying().stop()
SoundGroup::getNotPlaying = ->
	for channel in @channels
		return channel if currentTime = 0 || channel.audio.ended
	return @addChannel()

window.SoundGroup = SoundGroup

_ = {}

# Internal function used to implement `_.throttle` and `_.debounce`.
limit = (func, wait, debounce)->
	timeout = undefined
	return ->
		context = this
		args = arguments
		throttler = ->
			timeout = null
			func.apply(context, args)
		if debounce then clearTimeout(timeout)
		if debounce || !timeout then timeout = setTimeout(throttler, wait)

# Returns a function, that, when invoked, will only be triggered at most once
# during a given window of time.
_.throttle = (func, wait)->
	return limit(func, wait, false);

# Returns a function, that, as long as it continues to be invoked, will not
# be triggered. The function will be called after it stops being called for
# N milliseconds.
_.debounce = (func, wait)->
	return limit(func, wait, true)


window._ = _