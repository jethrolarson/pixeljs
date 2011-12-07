$ ->
	Game.init $('#game')
	Game.edit()
	
	$('form').submit ->
		@game.value = Game.level.game

	FARBTASTIC_WIDTH = 195
	$('<div id="picker"></div>').appendTo 'body'
	$picker = $('#picker').hide()
	fb = $.farbtastic('#picker')
	
	$('input[type=color]').focus ->
		fb.linkTo(this)
		pos = $(this).offset()
		$picker.css(
			top: pos.top - (FARBTASTIC_WIDTH / 2) + 8, 
			left: pos.left + $(this).outerWidth()
		).show()
	.blur ->
		$picker.hide()
	.change ->
		if this.name is 'fgcolor'
			Game.level.fgcolor = this.value
		else
			Game.level.bgcolor = this.value
		Game.renderLevel()
	$('#x').appendTo('#colHints').each ->
		$('<div class="sliderWidget" id="xSlider"/>').insertBefore(this).slider
			step: 1
			value: this.value
			min: 1
			max: 32
			slide: (e, ui)=>
				this.value = ui.value
				Game.updateCols @value
	$('#y').appendTo('#rowHints').each ->
		max = 32
		$('<div class="sliderWidget" id="ySlider" style="height:400px"/>').insertBefore(this).slider
			orientation: 'vertical'
			step: 1
			value: max-this.value
			min: 1
			max: max
			height: 400
			slide: (e, ui)=>
				this.value = max - ui.value
				Game.updateRows @value
	
