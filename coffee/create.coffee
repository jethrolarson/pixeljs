$ ->
	Game.init $('#game')
	Game.edit()
	
	$('form').submit ->
		$('#gametxt').val Game.level.getGame()
		true

	FARBTASTIC_WIDTH = 195
	$('<div id="picker"></div>').appendTo 'body'
	$picker = $('#picker').hide()
	fb = $.farbtastic('#picker')
	
	$('input[type=color]').live 
		focus: ->
			fb.linkTo(this)
			pos = $(this).position()
			$picker.css(
				top: pos.top - (FARBTASTIC_WIDTH / 2) + 8, 
				left: pos.left - FARBTASTIC_WIDTH
			).show()
		blur: ->
			$picker.hide()
		change: ->
			if this.name is 'bgcolor'
				Game.level.bgcolor = this.value
			else
				layerRE = /fgcolor(\d)/.exec this.name
				if layerRE and layerRE.length
					Game.level.setLayerColor this.value, +layerRE[1]
					$('#fgcolor').val Game.level.fgcolor
			_.debounce(Game.renderLevel(),200)
	$x = $('#x').appendTo('#colHints')
	$('<div class="sliderWidget" id="xSlider"/>').insertBefore($x).slider
		step: 1
		value: $x.val()
		min: 1
		max: 32
		slide: (e, ui)->
			$x.val ui.value
			Game.updateCols $x.val()
	
	$y = $('#y').appendTo '#rowHints'
	max = 32
	$('<div class="sliderWidget" style="height:532px"/>').insertBefore($y).slider
		orientation: 'vertical'
		step: 1
		value: max - $y.val()
		min: 1
		max: max
		height: 532
		slide: (e, ui)=>
			$y.val max - ui.value
			Game.updateRows $y.val()
	
	$('#addLayer').live 'click', ->
		#duplicate field, switch type to hidden. 
		Game.addLayer()
	$('.changeLayer').live 'click', (e)->
		$('.changeLayer').removeClass 'on'
		$(this).addClass 'on'


	
