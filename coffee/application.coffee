# coffee -o public/js/ -w -c coffee/

window.Game = {
	gameMode: 'play'
	dragMode: 'break'
	isDragging: false
	isErasing:	false
	
	#constants
	colWidth: 40

	init: ($game)->
		@$game= $game
		@$gridCell= @$game.find('#gridCell')
		@$grid=     @$game.find('#grid').remove()
		@$win=      @$game.find '#win'
		@$lose=     @$game.find '#lose'
		@$games=    @$game.find '#games'
		@$colHints= @$game.find '#colHints'
		@$rowHints= @$game.find '#rowHints'
		@$game.trigger 'init'
		@loadAssets()
		@bindEvents()
		this
	start: ->
		#load game data
		@loadGame window.level
	edit: ->
		@gameMode = 'edit'
		@$grid.enableContext()
		@start()
	getCol: (x)-> 
		@$grid.find("li:nth-child(#{@level.y}n+#{x+2})") #isn't nth-child confusing?
	getRow: (y)-> @$grid.find('li').slice(y * @level.x, (y + 1) * @level.x)

	getCoord: (el)->
		index = $(el).parent().children('li').index(el)
		return {
			x: (index) % @level.x
			y: Math.floor(index / @level.x)
		}

	isGameComplete: ->
		for i in [0...@level.y]
			if not @isLineComplete(@getRow(i))
				return false
		return true

	isLineComplete: ($line)->
		for cell in $line
			coord = @getCoord(cell)
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
		
	loadGame: (level)->
		@level = Level level
		@renderLevel()
	renderLevel: ->
		@score = 0;
		$('#title').html("""<a href="/levelSet/#{@level.levelSet}">#{@level.levelSetName}</a> &gt; #{@level.title}""")

		# Build grid
		html= ''
		cells = @level.x * @level.y
		for cell in [0...cells] 
			html += '<li> </li>' 
		
		@$grid.html(html)
		@$cells= @$grid.find('li')
		if @gameMode is 'play'
			@renderHints()
		else
			for cell,i in @$cells
				$(cell).toggleClass('paint',+@level.game[i] is 1)
		
		@$colorSheet = $(document.createElement 'style').prependTo(@$grid)
		@updateStyles()
		@updateHints()
		@$gridCell.append(@$grid)
	updateStyles: ->
		css = ''
		@colWidth = Math.floor(@$gridCell.width() / @level.x)
		gridWidth= @colWidth * @level.x
		gridHeight= @colWidth * @level.y
		css += """
			#grid li{
				width: #{@colWidth}px;
				height: #{@colWidth}px;
			}
			#grid{
				width: #{gridWidth}px;
			}
			#win,#lose{
				width: #{gridWidth}px;
				height: #{gridHeight}px;
				line-height: #{gridHeight}px;
			}
			
			#rowHints li div{
				height: #{@colWidth}px;
				line-height: #{@colWidth}px;
			}
			#colHints li div{
				width: #{@colWidth}px;
			}
		"""
		if @level.fgcolor
			css += """
				#grid .paint, 
				#grid .on{
					background-color:#{@level.fgcolor}
			}"""
		if @level.bgcolor
			css += "#grid{background-color:#{@level.bgcolor}}"
		@$colorSheet.html(css)
			
	loadAssets: ->
		@assets = {
			hoverSound: new Audio('/public/audio/grid_hover.wav')
			boom: new Audio('/public/audio/boom.wav')
			bing: new Audio('/public/audio/bing.wav')
			mark: new Audio('/public/audio/mark.wav')
			win: new Audio('/public/audio/win.wav')
		}
		
	# ======== #	
	#	 Events	 #
	# ======== #
	bindEvents: ->
		@$grid.disableContext().delegate('li', {
			mouseover: $.proxy(@eGridMouseover, this)
			mousedown: $.proxy(@eGridMousedown, this)
		}).mouseout =>
			@$cells.removeClass 'hilight'
			
		@$game.bind
			break: $.proxy(@eBreak, this)
			mark: $.proxy(@eMark, this)
			lose: $.proxy(@eLose, this)
			win: $.proxy(@eWin, this)
			paint: $.proxy(@ePaint, this)
			erase: $.proxy(@eErase, this)
			die: =>
				@score += 1
				@$game.addClass('shake')
				@assets.boom.play()
				setTimeout( =>
					@$game.removeClass('shake')
				, 300)
	
		$(document).bind 'mouseup', => 
			@isDragging= false
			
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
				@assets.bing.play()
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
		@assets.mark.play()
		$(el).toggleClass('mark', not @isErasing)
	ePaint: (e,el)->
		$el = $(el)
		@level.updateCell(@$grid.find('li').index(el), if @isErasing then '0' else '1')
		$(el).toggleClass('paint', not @isErasing)
	eWin: ->
		@dragMode= null	
		@assets.win.play()
		@$win.show()
		localStorage[@title] = true

	eGridMouseover: (e)->
		$el= $ e.target
		coord= @getCoord e.target
		if @isDragging
			@$game.trigger(@dragMode, e.target)
		@assets.hoverSound.play()

	eGridMousedown: (e)->
		$el = $(e.target)
		if @gameMode is 'play'
			@dragMode = if e.which is 1 then 'break' else 'mark'
			@isErasing = $el.hasClass('mark') if @dragMode is 'mark'
		else
			return true if e.which isnt 1
			@dragMode = 'paint'
			@isErasing = $el.hasClass('paint')
		@isDragging = true
		@$game.trigger @dragMode, e.target

}# end game
