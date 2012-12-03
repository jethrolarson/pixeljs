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
		@$layers=   $('#layers')
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
			@p.line(i * @cw + @offset.x, @offset.y, i * @cw + @offset.x, @level.y * @cw + @offset.y)
		for i in [1...@level.y]
			if i % 5
				@p.strokeWeight(1)
			else
				@p.strokeWeight(3)
			@p.line(@offset.x, i * @cw + @offset.y, @level.x * @cw + @offset.x, i * @cw + @offset.y)
		@p.fill(0, 102, 153)
	drawCell: (x,y)->
		cellMargin = 0
		@p.rect(
			x * @cw + @offset.x + cellMargin,
			y * @cw + @offset.y + cellMargin,
			@cw - cellMargin*2,
			@cw - cellMargin*2
		)
	drawCells: ->
		@p.noStroke()
		@score = 0
		for layer,layerIndex in @level.layers
			if @gameMode is 'play' and layerIndex > @level.currentLayerIndex
				break
			fgc = color.hexToRGB(layer.fgcolor)
			for x in [0...@level.x]
				for y in [0...@level.y]
					if @gameMode is 'play'
						if +layer.paint.getAt x,y
							if +layer.grid.getAt x,y
								@p.fill(fgc.r,fgc.g,fgc.b)
							else if layer is @level.currentLayer
								@p.fill(200,0,0)
								@score += 1
							@drawCell(x,y)
						else if +layer.mark.getAt x, y
							@p.fill(0,200,0)
							@drawCell(x,y)
					else
						if layer.visible && +layer.grid.getAt x,y
							@p.fill(fgc.r,fgc.g,fgc.b)
							@drawCell(x,y)
		@
	draw: ->
		@p.background 80
		rowHints = @level.currentLayer.getRowHints()
		biggestRowHints = 1
		for row in rowHints
			biggestRowHints = row.length if row.length > biggestRowHints
		colHints = @level.currentLayer.getColHints()
		biggestColHints = 1
		for col in colHints
			biggestColHints = col.length if col.length > biggestColHints
		colHints = @level.currentLayer.getColHints()
		gridW = (@w - @gridBounds.x1 - (@w - @gridBounds.x2))
		xw =  Math.floor(gridW / (@level.x + biggestRowHints))
		gridH = (@h - @gridBounds.y1 - (@h - @gridBounds.y2))
		yw = Math.floor(gridH / (@level.y + biggestColHints))
		#cell size
		@cw = Math.min(xw, yw)
		@offset = 
			x: @gridBounds.x1 + (biggestRowHints * @cw)
			y: @gridBounds.y1 + (biggestColHints * @cw)
		gridW = @cw * @level.x
		gridH = @cw * @level.y
		@bgc = color.hexToRGB(@level.bgcolor)
		@bgc = @p.color(@bgc.r,@bgc.g,@bgc.b)
		@p.fill(@bgc)
		@p.rect(@offset.x,@offset.y,gridW,gridH)
		#current cell
		gridX = Math.floor((@p.mouseX - @offset.x)/ @cw)
		gridY = Math.floor((@p.mouseY - @offset.y)/ @cw)
		curCell = gridX+','+gridY
		
		x = gridX * @cw
		y = gridY * @cw
		@p.text(gridX+','+gridY,10,10)
		#if mouse in grid
		if @p.mouseX > @offset.x and @p.mouseY > @offset.y and gridX < @level.x and gridY < @level.y
			
			if @p.mouseIsPressed
				cell = +@level.currentLayer.grid.getAt(gridX, gridY)
				if @gameMode is 'play'
					@dragMode = if @p.mouseButton is @p.RIGHT then 'mark' else 'grid'
					if @newlyPressed and @dragMode is 'mark'
						@isErasing = +@level.currentLayer.mark.getAt(gridX,gridY)
					if @dragMode is 'mark'
						@level.currentLayer.mark.setAt(gridX, gridY, !@isErasing,'paint')
					else
						prev = +@level.currentLayer.paint.getAt gridX, gridY
						@level.currentLayer.paint.setAt(gridX, gridY, "1",'paint')
						if !prev
							if cell
								@assets.bing.play()
							else
								@assets.boom.play()

				else
					if @newlyPressed
						@isErasing = !!cell
					if !!cell isnt !@isErasing
						@level.currentLayer.grid.setAt(gridX, gridY, (+!@isErasing).toString())
						if @lastCell isnt curCell or @newlyPressed
							@assets.bing.play()
			else
				if @lastCell isnt curCell
					@assets.hoverSound.play()

		@newlyPressed = false
		
		#draw the cells
		@drawCells()

		for hintGroup,y in rowHints
			rowComplete = @level.currentLayer.isRowComplete(y)
			for hint,x in hintGroup
				pos = 
					x: @cw * x + @gridBounds.x1
					y: @cw * y + @offset.y
				@p.fill(255)
				@p.rect(pos.x, pos.y , @cw, @cw)
				if rowComplete
					@p.fill(200)
				else
					@p.fill(0)
				@p.text(hint, pos.x + @cw/2, pos.y + @cw/2)
		for hintGroup,x in colHints
			colComplete = @level.currentLayer.isColComplete(x)
			for hint,y in hintGroup
				pos =
					x: @cw * x + @offset.x
					y: @cw * y + @gridBounds.y1
				@p.fill(255)
				@p.rect(pos.x, pos.y , @cw, @cw)
				if colComplete
					@p.fill(200)
				else
					@p.fill(0)
				@p.text(hint, pos.x + @cw/2, pos.y + @cw/2)

		@drawGrid()
		
		
		@p.fill(255)

		@p.text("Faults: #{@score}/#{@level.par}", 10,40)
		#hover effects
		
		# 	#paint row highlight
		# 	@p.rect(@gridBounds.x1, y+@offset., gridW, @cw)
		# 	#paint col highlight
		# 	@p.rect(x+@gridBounds.x1, @offset., @cw, gridH)
		@lastCell = curCell
		this
	edit: ->
		@gameMode = 'edit'
		@$gridCell.enableContext()
		@start()
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
	renderLayerUI: ->
		layerUI = ''
		for layer,i in @level.layers
			layerUI += """<div>
				<input 
					class="changeLayer layer#{i} #{if i is @level.currentLayerIndex then 'on' else ''}"
					type="color" name="fgcolor#{i}" value="#{layer.fgcolor}" style="background-color:#{layer.fgcolor}"/>
				<a class="layerVisibility" href="#layer#{i}">&#9635;</a>
				</div>
			"""
		if @gameMode isnt 'play'
			layerUI += '<button id="addLayer" type="button">+</button>'
		@$layers.html layerUI
	loadGame: (level)->
		@level = Level level
		if @gameMode is 'play'
			@changeLayer(0)
		@renderLevel()
		@renderLayerUI()
		@updateScore()
	renderLevel: ->
		@w = window.innerWidth
		@h = window.innerHeight
		@gridBounds = # this is the rectangle that the grid gets drawn in
			x1:10
			y1:10
			x2: @w-80
			y2: @h-30
		if @gameMode isnt 'play'
			@gridBounds.x1 = 140
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
		
		if @gameMode is 'play'
			@score = 0;
			$('#title').html @level.title
			$('#par').text("Par: "+@level.par)
			@updateHints()
	
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
		@level.setLayer(layer)

	# =========
	#	Events
	# =========
	bindEvents: ->
		@$game.bind
			break: $.proxy(@eBreak, this)
			mark:  $.proxy(@eMark, this)
			lose:  $.proxy(@eLose, this)
			win:   $.proxy(@eWin, this)
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
		that = this
		$('.changeLayer').live 'click',(e)->
			layerRE = /layer(\d)+/.exec this.className
			if layerRE.length
				that.changeLayer +layerRE[1]
				if not $(this).hasClass('on')
					$('.changeLayer').removeClass 'on'
					$(this).addClass 'on'
					e.preventDefault()

		$('.layerVisibility').live 'click',(e)->
			e.preventDefault()
			layerRE = /^#layer(\d)+/.exec this.hash
			if layerRE.length
				layerIndex = +layerRE[1]
				that.level.layers[layerIndex].visible = !that.level.layers[layerIndex].visible
			true
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
	
	eWin: ->
		@dragMode= null	
		@assets.win.play() unless @mute
		@$win.text @getGolfScore()
		@$win.show()
		localStorage[@title] = true


