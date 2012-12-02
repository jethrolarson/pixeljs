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
	lastCell: ''
	init: ($game)->
		@$game= $game
		@$gridCell= @$game.find('#gridCell')
		@$win=      @$game.find('#win')
		@$lose=     @$game.find('#lose')
		@$score=    @$game.find('#score')
		@$games=    @$game.find('#games')
		@$colHints= @$game.find('#colHints')
		@$rowHints= @$game.find('#rowHints')
		@$layers=   @$game.find('#layers')
		@$canvas= $('#canvas')
		@$colorSheet = $(document.createElement 'style').prependTo(@$game)
		@$game.trigger 'init'
		

		canvas = document.getElementById('canvas')
		
		@loadAssets()
		@bindEvents()
		this
	start: ->
		#load game data
		@loadGame window.level
	blip: 0
	drawGrid: ->
		#adjusts the color of the lines based on the background #HACKY
		@p.stroke(if @p.brightness(@bgc) > 80 then 0 else 200)
		#draw gridlines
		for i in [1...@level.x]
			if i % 5
				@p.strokeWeight(1)
			else
				@p.strokeWeight(3)
			@p.line(i * @cw + @gridBounds.x1, @gridBounds.y1, i * @cw + @gridBounds.x1, @level.y * @cw + @gridBounds.y1)
		for i in [1...@level.y]
			if i % 5
				@p.strokeWeight(1)
			else
				@p.strokeWeight(3)
			@p.line(@gridBounds.x1, i * @cw + @gridBounds.y1, @level.x * @cw + @gridBounds.x1, i * @cw + @gridBounds.y1)
		@p.fill(0, 102, 153)
	drawCell: (x,y)->
		cellMargin = 0
		@p.rect(
			x * @cw + @gridBounds.x1 + cellMargin,
			y * @cw + @gridBounds.y1 + cellMargin,
			@cw - cellMargin*2,
			@cw - cellMargin*2
		)
	drawCells: ->
		@p.noStroke()
		
		for layer in @level.layers
			fgc = color.hexToRGB(@level.getLayerColor());
			@p.fill(fgc.r,fgc.g,fgc.b)

			if @gameMode is 'play'
				for col,celly in layer.paint
					for cell,cellx in col
						if +cell
							@drawCell(cellx,celly)
				for col,celly in layer.mark
					for cell,cellx in col
						if +cell
							@p.fill(100,0,0)
							@drawCell(cellx,celly)
			else
				for col,celly in layer.grid
					for cell,cellx in col
						if +cell
							@drawCell(cellx,celly)
		@
	draw: ->
		@p.background 80
		
		gridW = (@w - @gridBounds.x1 - (@w - @gridBounds.x2))
		xw =  Math.floor(gridW / @level.x)
		gridH = (@h - @gridBounds.y1 - (@h - @gridBounds.y2))
		yw = Math.floor(gridH / @level.y)
		@cw = Math.min(xw, yw) #cell size
		gridW = @cw * @level.x
		gridH = @cw * @level.y
		@bgc = color.hexToRGB(@level.bgcolor)
		@bgc = @p.color(@bgc.r,@bgc.g,@bgc.b)
		@p.fill(@bgc)
		@p.rect(@gridBounds.x1,@gridBounds.y1,gridW,gridH)
		#current cell
		gridX = Math.floor((@p.mouseX - @gridBounds.x1)/ @cw)
		gridY = Math.floor((@p.mouseY - @gridBounds.y1)/ @cw)
		curCell = gridX+','+gridY

		
		x = gridX * @cw
		y = gridY * @cw
		@p.text(gridX+','+gridY,10,10)
		#if mouse in grid
		if @p.mouseX > @gridBounds.x1 and @p.mouseY > @gridBounds.y1 and gridX < @level.x and gridY < @level.y
			
			if @p.mouseIsPressed
				
				if @gameMode is 'play'
					@dragMode = if @p.mouseButton is @p.RIGHT then 'mark' else 'grid'
					if @newlyPressed and @dragMode is 'mark'
						@isErasing = @level.currentLayer.marks[gridX][gridY]
					@level.setAt(gridX, gridY, +!@isErasing,'paint')
				else
					@dragMode = 'paint'
					if @newlyPressed
						@isErasing = @level.getAt(gridX, gridY)
					@level.setAt(gridX, gridY, +!@isErasing)
				if @lastCell isnt curCell
					@assets.bing.play()
			else
				if @lastCell isnt curCell
					@assets.hoverSound.play()

		@newlyPressed = false
		
		#draw the cells
		@drawCells()

		@drawGrid()
		
		
		@p.fill(20,80,200,50)
		#hover effects
		
		# 	#paint row highlight
		# 	@p.rect(@gridBounds.x1, y+@gridBounds.y1, gridW, @cw)
		# 	#paint col highlight
		# 	@p.rect(x+@gridBounds.x1, @gridBounds.y1, @cw, gridH)
		@lastCell = curCell
		this
	edit: ->
		@gameMode = 'edit'
		@$gridCell.enableContext()
		
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
				<a href="#layer#{i}" class="changeLayer layer#{i} #{if i is @level.currentLayerIndex then 'on' else ''}">&nbsp;</a>
				<input type="color" name="fgcolor#{i}" value="#{@level.getLayerColor(i)}" style="background-color:#{@level.getLayerColor(i)}"/>
				<a class="layerVisibility" href="#layer#{i}">|</a>
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
	getGrid: (layerIndex = @level.currentLayerIndex)-> $('#layer_'+layerIndex)
	renderLevel: ->
		@w = window.innerWidth
		@h = window.innerHeight
		@gridBounds = # this is the rectangle that the grid gets drawn in
			x1:10
			y1:10
			x2: @w-20
			y2: @h-30

		new Processing(canvas, (p)=>
			@p = p
			@p.width = @w
			@p.height = @h
			@p.draw = @draw.bind(this)
			@p.frameRate(24)
			@p.mousePressed = =>
				@newlyPressed = true
				@p.mouseIsPressed = true
			@p.mouseReleased = =>
				@p.mouseIsPressed = false
		)
		
		

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
			isOn = if i is @level.currentLayerIndex then 'on' else ''
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
		soundManager.setup(
			# where to find flash audio SWFs, as needed
			url: '/public/js/soundmanager/swf/'
			onready: =>
				@assets = {
					hoverSound: soundManager.createSound({
						id: 'hoverSound'
						url: '/public/audio/grid_hover.wav'
					})
					boom: soundManager.createSound({
						id: 'boom'
						url: '/public/audio/boom.wav'
					})

					bing: soundManager.createSound({
						id: 'bing'
						url: '/public/audio/bing.wav'
					})
					mark: soundManager.createSound({
						id: 'mark'
						url: '/public/audio/mark.wav'
					})

					win: soundManager.createSound({
						id: 'win'
						url: '/public/audio/win.wav'
					})
					paint: soundManager.createSound({
						id: 'paint'
						url: '/public/audio/paint.wav'
					})
				}
		)
		

		# ...and play it
		
		
	addLayer: ->
		@level.addLayer()
		@renderLayerUI()
		@renderLevel()
	changeLayer: (layer)->
		@level.setLayer(layer)
		#hide layers ontop of the selected one
		@$gridCell.find('ul').removeClass('on')
		@getGrid().addClass('on')
		if @gameMode is 'play'
			@renderHints()
		

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
		that = this
		$('.changeLayer').live 'click',->
			layerRE = /^#layer(\d)+/.exec this.hash
			if layerRE.length
				that.changeLayer +layerRE[1]
				$('.changeLayer').removeClass 'on'
				$(this).addClass 'on'
		$('.layerVisibility').live 'click',(e)->
			e.preventDefault()
			layerRE = /^#layer(\d)+/.exec this.hash
			if layerRE.length
				layer = +layerRE[i]
				layerVisibility = @level.getLayerVisibility layer
				@level.setLayerVisibility layer, !layerVisibility
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
		# FIXME
		# for y in [0...@level.y]
		# 	@isLineComplete(
		# 		@getRow(y)
		# 	) and $('#rowHints li').eq(y).addClass('done')
		# for x in [0...@level.x]
		# 	@isLineComplete(
		# 		@getCol(x)
		# 	) and $('#colHints li').eq(x).addClass('done')
		# return
	eMark: (e,el)->
		return unless @gameMode is 'play'
		@assets.mark.play() unless @mute
		$(el).toggleClass('mark', not @isErasing)
	ePaint: (e,el)->
		$el = $(el)
		#@level.updateCell(@getGrid().find('li').index(el), if @isErasing then '0' else '1')
		$(el).toggleClass('paint', not @isErasing)
	eWin: ->
		@dragMode= null	
		@assets.win.play() unless @mute
		@$win.text @getGolfScore()
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
			@isErasing = $el.hasClass 'paint'
		@isDragging = true
		@$game.trigger @dragMode, e.target


