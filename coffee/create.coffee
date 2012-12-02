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
	$('#x').change ->
		Game.updateCols this.value
	
	$('#y').change ->
		Game.updateRows this.value
	
	$('#addLayer').live 'click', ->
		#duplicate field, switch type to hidden. 
		Game.addLayer()
		


	
