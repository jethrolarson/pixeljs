unless Function.bind?
	Function::bind = (fn, context) ->
		context ||= this
		return -> fn.apply(context, arguments)

String.prototype.replaceAt = (index, char)->
	return this.substr(0, index) + char + this.substr(index+char.length)

window.color ={
	hexToRGB: (hex)->
		{
			r: parseInt(hex.substr(1,2),16)
			g: parseInt(hex.substr(3,2),16)
			b: parseInt(hex.substr(5,2),16)
		}
}
window.levelToDataURL = (level)->
		fg = color.hexToRGB(level.fgcolor)
		bg = color.hexToRGB(level.bgcolor)
		c = document.createElement 'canvas'
		c.width=level.x
		c.height=level.y
		ctx = c.getContext('2d')
		imageData = ctx.createImageData(level.x, level.y)
		size = level.x*level.y
		for i in [0..size]
			one = +level.game.charAt(i)
			idx = i * 4
			imageData.data[idx+0] = if one then fg.r else bg.r
			imageData.data[idx+1] = if one then fg.g else bg.g
			imageData.data[idx+2] = if one then fg.b else bg.b
			imageData.data[idx+3] = 0xff;
		ctx.putImageData(imageData, 0, 0)
		return c.toDataURL()
	
window.multiplyString = (str,times)->
	s = ''
	for i in [0...times]
		s+=str
	s
	
window.

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

AUDIOPATH = '/public/audio/'
Audio = (filename)->
	@filename = filename
	@audio = document.createElement('audio')
	@audio.autobuffer = true
	@audio.src = AUDIOPATH+filename
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


SoundGroup = (filename, channels)->
	channels ||= 1
	@filename = filename
	@channels = []
	for i in [0...channels]
		@addChannel()
	this
SoundGroup::play = (channel)->
	if typeof channel isnt 'undefined'
		@channels[channel].play()
	else
		@getNotPlaying().play()
SoundGroup::addChannel = ->
	newAudio = new Audio @filename
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