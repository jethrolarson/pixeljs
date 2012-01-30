# coffee -o public/js/ -w -c coffee/

window.Game =
	gameMode: 'play'
	dragMode: 'break'
	isDragging: false
	isErasing:	false
	mute: false
	#constants
	colWidth: 40
	MAX_CELL_WIDTH: 60
	init: ($game)->
		@$game= $game
		@$gridCell= @$game.find '#gridCell'
		@$win=      @$game.find '#win'
		@$lose=     @$game.find '#lose'
		@$score=    @$game.find '#score'
		@$games=    @$game.find '#games'
		@$colHints= @$game.find '#colHints'
		@$rowHints= @$game.find '#rowHints'
		@$layers=   @$game.find '#layers'
		@$colorSheet = $(document.createElement 'style').prependTo(@$game)
		@$game.trigger 'init'
		@loadAssets()
		@bindEvents()
		this
	start: ->
		#load game data
		@loadGame window.level
	edit: ->
		@gameMode = 'edit'
		@$gridCell.enableContext()
		@assets.paint = new SoundGroup 'paint.wav'
		@start()
	getCol: (x)-> 
		@getGrid().find("li:nth-child(#{@level.x}n+#{x+2})") #isn't nth-child confusing?
	getRow: (y)-> 
		@getGrid().find('li').slice(y * @level.x, (y + 1) * @level.x)

	getCoord: (el)->
		index = $(el).parent().children('li').index(el)
		return {
			x: index % @level.x
			y: Math.floor(index / @level.x)
		}

	isGameComplete: ->
		for i in [0...@level.y]
			if not @isLineComplete(@getRow(i))
				return false
		return true

	isLineComplete: ($line)->
		for cell in $line
			coord = @getCoord cell
			if @level.getAt(coord.x,coord.y) and not $(cell).hasClass('on')
				return false
		return true
	updateCols: (cols)->
		delta = cols - @level.x
		if delta > 0
			@level.addCols delta
		else if delta < 0
			@level.subtractCols Math.abs delta
		@renderLevel()
	updateRows: (cols)->
		delta = cols - @level.y
		if delta > 0
			@level.addRows delta
		else if delta < 0
			@level.subtractRows Math.abs delta
		@renderLevel()
	renderHints: ->
		html= ''
		for hintGroup in @level.getColHints()
			html += '<li>'
			for hint in hintGroup
				html += '<div>'+hint+'</div>'
			html += '</li>'
		@$colHints.html(html)
		html= ''
		for hintGroup in @level.getRowHints()
			html += '<li>'
			for hint in hintGroup
				html += '<div>'+hint+'</div>'
			html += '</li>'
		@$rowHints.html(html)
	renderLayerUI: ->
		layerUI = ''
		for layer,i in @level.layers
			layerUI += """<div>
				<a href="#layer#{i}" class="changeLayer layer#{i} #{if i is @level.currentLayer then 'on' else ''}">&nbsp;</a>
				<input type="color" name="fgcolor#{i}" value="#{@level.getLayerColor(i)}" style="background-color:#{@level.getLayerColor(i)}"/> 
				</div>
			"""
		if @gameMode isnt 'play'
			layerUI += '<button id="addLayer" type="button">+</button>'
		@$layers.html layerUI
	loadGame: (level)->
		@level = Level level
		
		@renderLevel()
		@renderLayerUI()
		@updateScore()
	getGrid: (layerIndex = @level.currentLayer)->
		$('#layer_'+layerIndex)
	renderLevel: ->
		
		# Build grid
		html= ''
		cells = @level.x * @level.y
		for layer,i in @level.layers
			layerhtml = ''
			for cell in [0...cells]
				if @gameMode isnt 'play' and +layer[cell]
					paint = ' class="paint"'
				else
					paint = ''
				layerhtml += "<li#{paint}> </li>"
			isOn = if i is @level.currentLayer then 'on' else ''
			html += "<ul id='layer_#{i}' class='#{isOn}'>#{layerhtml}</ul>"
		@$gridCell.html html
		
		if @gameMode is 'play'
			@score = 0;
			$('#title').html @level.title
			$('#par').text("Par: "+@level.par)
			@renderHints()

		@updateStyles()
		@updateHints()
		@$gridCell.append(@getGrid())
	updateStyles: ->
		css = ''
		@colWidth = Math.min(Math.floor(@$gridCell.width() / @level.x), this.MAX_CELL_WIDTH)
		gridWidth= @colWidth * @level.x
		gridHeight= @colWidth * @level.y
		fontSize = Math.min(@colWidth * .7, 20)
		css += """
			#gridCell ul li{
				width: #{@colWidth}px;
				height: #{@colWidth}px;
			}
			#gridCell ul{
				width: #{gridWidth}px;
			}
			#win,#lose{
				width: #{gridWidth}px;
				height: #{gridHeight}px;
				line-height: #{gridHeight}px;
			}
			#rowHints,
			#colHints{
				font-size: #{fontSize}px;
			}
			#rowHints li,
			#rowHints li div{
				height: #{@colWidth}px;
				line-height: #{@colWidth}px;
			}
			#colHints li div{
				width: #{@colWidth}px;
			}
		"""
		for layer,i in @level.layers
			css += """
				#gridCell ul#layer_#{i} .paint, 
				#gridCell ul#layer_#{i} .on,
				#game .changeLayer.layer#{i}{
					background-color:#{@level.getLayerColor(i)}
			}"""
		if @level.bgcolor
			css += "#gridCell ul:first-child{background-color: #{@level.bgcolor}}"
		@$colorSheet.html('').html(css)
			
	loadAssets: ->
		@assets = {
			hoverSound: new SoundGroup 'grid_hover.wav'
			boom: new SoundGroup 'boom.wav'
			bing: new SoundGroup 'bing.wav'
			mark: new SoundGroup 'mark.wav'
			win: new Audio 'win.wav'
		}
	addLayer: ->
		@level.addLayer()
		@renderLayerUI()
		@renderLevel()
	changeLayer: (layer)->
		@level.currentLayer = layer
		#hide layers ontop of the selected one
		@$gridCell.find('ul').removeClass('on')
		@getGrid().addClass('on')
		

	# ======== #	
	#	 Events	 #
	# ======== #
	bindEvents: ->
		@$gridCell.disableContext().delegate('li', {
			'mouseover': $.proxy(@eGridMouseover, this)
			'touchmove': $.proxy(@eGridTouchmove, this)
			'mousedown touchstart': $.proxy(@eGridMousedown, this)
		})
		@$game.bind
			break: $.proxy(@eBreak, this)
			mark:  $.proxy(@eMark, this)
			lose:  $.proxy(@eLose, this)
			win:   $.proxy(@eWin, this)
			paint: $.proxy(@ePaint, this)
			erase: $.proxy(@eErase, this)
			die: =>
				@score += 1
				@$game.addClass('shake')
				@assets.boom.play() unless @mute
				@updateScore()
				setTimeout( =>
					@$game.removeClass('shake')
				, 300)
		$('#mute').bind 'change',(e)=>
			@mute = e.target.checked
			true
	
		$(document).bind 
			mouseup: => 
				@isDragging= false
			#deal with layer switching
		$(window).bind
			hashchange: =>
				layerRE = /^#layer(\d)+/.exec location.hash
				if layerRE.length
					@changeLayer +layerRE[1]

	getGolfScore: ->
		par =  @score - @level.par
		label = ''
		if @score is 0
			label = 'Ace!'
		else if par <= -3
			label = 'Albatross!'
		else if par is -2
			label = 'Eagle!'
		else if par is -1
			label = 'Birdie'
		else if par is 0
			label = 'Par'
		else if par is 1
			label = "Bogey"
		else if par is 2
			label = "Double Bogey"
		else if par is 3
			label = "Tripple Bogey"
		else if par > 3
			label = @score+" over par"
	
	updateScore: ->
		if @gameMode is 'play'
			@$score.text "Faults: " + @score
	eBreak: (e, el)->
		$el= $(el)
		return if @gameMode is 'edit' or $el.hasClass 'mark'
		
		coord= @getCoord(el)
		if @level.getAt(coord.x,coord.y)
			$el.addClass('on')
			@updateHints()
			if @isGameComplete() 
				@$game.trigger('win')
			else
				@assets.bing.play() unless @mute
		else if not $el.hasClass('error')
			$el.addClass('error')
			@$game.trigger('die', el)
	updateHints: ->
		for y in [0...@level.y]
			@isLineComplete(
				@getRow(y)
			) and $('#rowHints li').eq(y).addClass('done')
		for x in [0...@level.x]
			@isLineComplete(
				@getCol(x)
			) and $('#colHints li').eq(x).addClass('done')
		return
	eMark: (e,el)->
		return unless @gameMode is 'play'
		@assets.mark.play() unless @mute
		$(el).toggleClass('mark', not @isErasing)
	ePaint: (e,el)->
		$el = $(el)
		@level.updateCell(@getGrid().find('li').index(el), if @isErasing then '0' else '1')
		$(el).toggleClass('paint', not @isErasing)
	eWin: ->
		@dragMode= null	
		@assets.win.play() unless @mute
		@$win.text(@getGolfScore())
		@$win.show()
		localStorage[@title] = true

	eGridTouchmove: (e)->
		e.preventDefault()
		$el= $ e.target
		@$game.trigger(@dragMode, e.target)
		@assets.hoverSound.play()
	eGridMouseover: (e)->
		if @isDragging
			@$game.trigger(@dragMode, e.target)
		@assets.hoverSound.play() unless @mute

	eGridMousedown: (e)->
		e.preventDefault()
		$el = $(e.target)
		if @gameMode is 'play'
			@dragMode = if e.which isnt 1 then 'mark' else 'break'
			@isErasing = $el.hasClass('mark') if @dragMode is 'mark'
		else
			@dragMode = 'paint'
			@isErasing = $el.hasClass('paint')
		@isDragging = true
		@$game.trigger @dragMode, e.target
