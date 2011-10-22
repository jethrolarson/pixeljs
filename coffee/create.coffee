$ ->
	game = Game.init $('#game')
	Game.edit()
	
	$('form').submit ->
		gamebits = ''
		$('#grid li').each ->
			gamebits += if $(this).hasClass('paint') then '1' else '0'
		@game.value = gamebits

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
		
	$('.slider').change(->
		if this.name is 'cols'
			game.updateCols @value
		else
			game.updateRows @value
	).each ->
		that = this
		$that = $(this)
		$slider = $('<div class="sliderWidget"/>').insertAfter(this)
		$slider.slider
			step: 1
			value: that.value
			min: 1
			max: 32
			slide: (e, ui)->
				that.value = ui.value
				$that.change()