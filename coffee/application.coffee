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
	showAll: false
	init: ($game)->
		@$win=      $('#win')
		@$layers=   $('#layers')
		@$canvas= $('#canvas')
		
		@loadAssets()
		@bindEvents()
		@start()
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
	drawMark: (x,y, color=@p.color(0,0,0))->
		@p.stroke color
		@p.line(
			x * @cw + @offset.x,
			y * @cw + @offset.y,
			(x+1) * @cw + @offset.x,
			(y+1) * @cw + @offset.y
		)
		@p.line(
			x * @cw + @offset.x,
			(y+1) * @cw + @offset.y,
			(x+1) * @cw + @offset.x,
			y * @cw + @offset.y
		)
		@p.noStroke()
	drawCells: ->
		@p.noStroke()
		@score = 0
		for layer,layerIndex in @level.layers
			continue if not @showAll and layerIndex isnt @level.currentLayerIndex
			fgc = color.hexToRGB(layer.fgcolor)
			for x in [0...@level.x]
				for y in [0...@level.y]
					if @gameMode is 'play'
						if +layer.paint.getAt x,y
							#draw fills
							if +layer.grid.getAt x,y
								@p.fill(fgc.r,fgc.g,fgc.b)
								@drawCell(x,y)
							#draw faults
							else if layer is @level.currentLayer and not @level.currentLayer.complete
								@score += 1
								@drawMark x, y, @p.color(180,30,30)
						#draw marks
						else if +layer.mark.getAt x, y and not @level.currentLayer.complete
							@p.fill 0, 200, 0
							@drawMark x, y
					else
						#draw fills (edit mode)
						if +layer.grid.getAt x,y
							@p.fill(fgc.r,fgc.g,fgc.b)
							@drawCell(x,y)
		@
	draw: ->
		@p.background 80
		
		biggestRowHints = 0
		biggestColHints = 0
		if @gameMode is 'play'
			biggestRowHints = 2
			biggestColHints = 2
			rowHints = @level.currentLayer.getRowHints()
			for row in rowHints
				biggestRowHints = row.length if row.length > biggestRowHints
			colHints = @level.currentLayer.getColHints()
			
			for col in colHints
				biggestColHints = col.length if col.length > biggestColHints
			colHints = @level.currentLayer.getColHints()
		gridW = (@w - @gridBounds.x1 - (@w - @gridBounds.x2))
		xw =  Math.floor(gridW / (@level.x + biggestRowHints))
		gridH = (@h - @gridBounds.y1 - (@h - @gridBounds.y2))
		yw = Math.floor(gridH / (@level.y + biggestColHints))
		#cell size
		@cw = Math.min(xw, yw)
		@p.textSize(Math.floor(@cw/3) )
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
		
		hoverX = gridX * @cw
		hoverY = gridY * @cw
		# @p.text(gridX+','+gridY,10,10)
		#if mouse in grid
		if not @level.currentLayer.complete and @p.mouseX > @offset.x and @p.mouseY > @offset.y and gridX < @level.x and gridY < @level.y
			if @p.mouseIsPressed
				cell = +@level.currentLayer.grid.getAt(gridX, gridY)
				if @gameMode is 'play'
					@dragMode = if @p.mouseButton is @p.RIGHT then 'mark' else 'grid'
					
					if @newlyPressed and @dragMode is 'mark'
						@isErasing = +@level.currentLayer.mark.getAt(gridX,gridY)
					
					# add mark
					if @dragMode is 'mark'
						@level.currentLayer.mark.setAt(gridX, gridY, !@isErasing,'paint')
					#paint
					else
						prev = +@level.currentLayer.paint.getAt gridX, gridY
						#only paint if there's no mark on the line to prevent user error
						if !+@level.currentLayer.mark.getAt gridX, gridY
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
						for level, i in @level.layers when i isnt @level.currentLayerIndex
							level.grid.setAt(gridX,gridY,"0")
						if @lastCell isnt curCell or @newlyPressed
							@assets.bing.play()
			###
			else
				if @lastCell isnt curCell
					@assets.hoverSound.play()
			###
		@newlyPressed = false
		
		#draw the cells
		@drawCells()
		if @gameMode is 'play' and not @level.currentLayer.complete
			@level.currentLayer.complete = true
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
						@level.currentLayer.complete = false
						@p.fill(0)
					@p.textAlign(@p.CENTER,@p.CENTER);
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
		@win = true
		for layer in @level.layers
			if not layer.complete
				@win = false
				break
		# if @level.currentLayer.complete
		# 	alert()
		if @win
			@eWin()
		@p.fill(255)
		@p.textAlign(@p.LEFT)
		if @gameMode is 'play'
			@p.text("Faults: #{@score}/#{@level.par}", 10,40)
		
		#hover effects
		if not @level.currentLayer.complete and gridX >= 0 and gridX < @level.x and gridY >= 0 and gridY < @level.y
			@p.noStroke()
			@p.fill(30,30,200,90)
			#paint row highlight
			@p.rect(@offset.x, hoverY+@offset.y, gridW, @cw)
			#paint col highlight
			@p.rect(hoverX+@offset.x, @offset.y, @cw, gridH)
		@lastCell = curCell
		this
	edit: ->
		@showAll =
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
		if @gameMode is 'play' and @level.layers.length is 1
			return
		layerUI = ''
		for layer,i in @level.layers
			if @gameMode is 'play'
				layerUI += """
				<div>
					<div class="changeLayer layer#{i} #{if i is @level.currentLayerIndex then 'on'}"
						style="background-color:#{layer.fgcolor}"/>
					</div>
				</div>
				"""
			else
				layerUI += """
				<div>
					<input 
						class="changeLayer layer#{i} #{if i is @level.currentLayerIndex then 'on' else ''}"
						type="color" name="fgcolor#{i}" value="#{layer.fgcolor}" style="background-color:#{layer.fgcolor}"/>
				</div>
				"""
		if @gameMode isnt 'play'
			layerUI += '<button id="addLayer" type="button">+</button>'
		@$layers.html layerUI + """<a class="showAll" href="">&#9635;</a>"""
	loadGame: (level)->
		@level = Level level
		if @gameMode is 'play'
			@changeLayer(0)
		@renderLevel()
		@renderLayerUI()
	renderLevel: ->
		@w = window.innerWidth
		@h = window.innerHeight
		@gridBounds = # this is the rectangle that the grid gets drawn in
			x1:10
			y1:10
			x2: @w-80
			y2: @h-30
		if @gameMode is 'play'
			if @level.layers.length is 1
				@gridBounds.x2 = @w - 10
		else
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
	changeLayer: (layerIndex)->
		if @gameMode is 'play'
			for layer,i in @level.layers
				layer.visible = false if i isnt layerIndex
		@level.setLayer(layerIndex)

	# =========
	#	Events
	# =========
	bindEvents: ->
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

		$('.showAll').live 'click',(e)->
			e.preventDefault()
			$this = $(this)
			isOn = $this.hasClass('on')
			that.showAll = not isOn
			$this.toggleClass('on',not isOn)
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
	
	eWin: ->
		@$win.html """
			<h1>#{@level.title}</h1>
			<i>#{@time}</i>
			<b>#{@getGolfScore(@score)} #{@score} fault#{if @score!=1 then 's'}</b>
		"""
		@assets.win.play() unless @mute
		@$win.show()

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



