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
		
		for layer,layerIndex in @level.layers
			fgc = color.hexToRGB(layer.fgcolor)
			for x in [0...@level.x]
				for y in [0...@level.y]
					if @gameMode is 'play'
						if +layer.mark[y][x]
							@p.fill(100,0,0)
							@drawCell(x,y)
						if +layer.paint[y][x]
							@p.fill(fgc.r,fgc.g,fgc.b)
							@drawCell(x,y)
					else
						if layer.visible && +layer.grid.getAt(x,y)
							@p.fill(fgc.r,fgc.g,fgc.b)
							@drawCell(x,y)
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
						@isErasing = +@level.currentLayer.marks.getAt(gridX,gridY)
					if @dragMode is 'mark'
						@level.currentLayer.mark.setAt(gridX, gridY, !@isErasing,'paint')
					else
						@level.currentLayer.paint.setAt(gridX, gridY, "1",'paint')
					#TODO break the cell
				else
					cell = +@level.currentLayer.grid.getAt(gridX, gridY)
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
		
		if @gameMode is 'play'
			@score = 0;
			$('#title').html @level.title
			$('#par').text("Par: "+@level.par)
			@updateHints()
			@renderHints()
	
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
		#hide layers ontop of the selected one
		@$gridCell.find('ul').removeClass('on')
		@getGrid().addClass('on')
		if @gameMode is 'play'
			@renderHints()

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


