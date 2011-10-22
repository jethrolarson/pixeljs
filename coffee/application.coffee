#compile and watch command: coffee -o public/js/ -w -c coffee/
Level = (level)->
	return $.extend {
		getRow: (y)-> 
			return @game[(@x*y)...(@x*y + @x)]
		getCol: (x)-> 
			ar = []
			for i in [0...@y]
				ar.push @game[i*@x + x]
			return ar

		getRowHints: ->
			hints = []
			for row in [0...@y]
				hints.push @getLineHints @getRow row
			return hints

		getColHints: ->
			hints= []
			for i in [0...@x]
				hints.push @getLineHints @getCol i
			return hints

		getLineHints: (row)->
			hints= []
			hint= 0
			pushHint = (force)->
				force ||= false
				if hint > 0 or force
					hints.push(hint)
				hint= 0
			for cell, i in row
				if +cell
					hint += 1
					pushHint() if i is row.length - 1
				else
					pushHint()
			pushHint(true) if hints.length is 0
			return hints
		getAt: (x,y)-> 
			throw 'Invalid X' if x >= @x
			throw 'Invalid Y' if y >= @y
			return +@game[(@x*y)+x]
		
		addCols: (num)->
			newGame = ''
			for i in [0...@x]
				newGame += @game.substring(@x*i, @x*(i+1)) + multiplyString('0',num)
			@game = newGame
		addRows: (num)->
			@game += multiplyString('0',@x*num)
		subtractCols: (num)->
			newGame = ''
			for i in [0...@x]
				newGame += @game.substring(@x*i, (@x-num)*(i+1))
			@game = newGame
		subtractRows: (num)->
			@game = @game.substring(0,x*(y-num))
		title: 'untitled'
		bgcolor: '#ddd'
		fgcolor: '#00f'
		x: 10
		y: 10
		game:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
		levelSetName: 'My Levels'
		par: 3
	}, level


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
		@score = 0;
		$('#title').html("""<a href="/levelSet/#{@level.levelSet}">#{@level.levelSetName}</a> &gt; #{@level.title}""")

		# Build grid
		html= ''
		cells = level.x * level.y
		for cell in [0...cells] 
			html += '<li> </li>' 
		
		@$grid.html(html)
		@$cells= @$grid.find('li')
		if @gameMode is 'play'
			@renderHints()
		else
			for cell,i in @$cells
				$(cell).toggleClass('paint',+@level.game[i] is 1)
		
		@colWidth = Math.floor(@$gridCell.width() / level.x)
		@$colorSheet = $(document.createElement 'style').prependTo(@$grid)
		@updateStyles()
		@updateHints()
		@$gridCell.append(@$grid)
		
	updateStyles: ->
		css = ''
		gridWidth= @colWidth * @level.x
		gridHeight= @colWidth * @level.y
		css += """
			#grid li{
				width: #{@colWidth}px;
				height: #{@colWidth}px;
			}
			#grid{
				width: #{gridWidth}px;
				height: #{gridHeight}px;
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

	timer: ->
		@$timer= $ '#timer'
		@time= 0
		@timerOn= false
		
			startTimer: =>
				@timerOn = true
				@$game.trigger 'updateTimer'
			updateTimer: =>
				if not @timerOn 
					return
				@$timer.text @time
				@time += 1000
				interval= =>
					@$game.trigger 'updateTimer'
				setTimeout(interval, 1000)
			stopTimer: =>
				@timerOn
			

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
	
		$(document).bind 'mouseup', => 
			@isDragging= false
			
	eBreak: (e, el)->
		$el= $(el)
		return if @gameMode is 'edit' or $el.hasClass 'mark'
		
		coord= @getCoord(el)
		if @level.getAt(coord.x,coord.y)
			$el.addClass('on')
			@updateHints()
			@isGameComplete() and @$game.trigger('win')
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
		$(el).toggleClass('mark', not @isErasing)
	ePaint: (e,el)->
		$(el).toggleClass('paint', not @isErasing)
	eWin: ->
		@dragMode= null	
		@$win.show()
		localStorage[@title] = true

	eGridMouseover: (e)->
		$el= $ e.target
		coord= @getCoord e.target
		if @isDragging
			@$game.trigger(@dragMode, e.target)

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
