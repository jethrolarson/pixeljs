window.Level = (level)->
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
			return +@game[(@x*y)+x]
		
		addCols: (num)->
			newGame = ''
			for i in [0...@x]
				newGame += @game.substring(@x * i, (@x * (i + 1))) + multiplyString('0', num)
			@game = newGame
			@x+=num
		addRows: (num)->
			@game += multiplyString('0',@x*num)
			@y+=num
		subtractCols: (num)->
			newGame = ''
			for i in [0...@x]
				newGame += @game.substring(@x * i, (@x * (i + 1)) - num)
			@x -= num
			@game = newGame
		subtractRows: (num)->
			@y -= num
			@game = @game.substring(0,@x*@y)
		updateCell: (i, v)->
			@game = @game.replaceAt(i,v)
		title: 'untitled'
		bgcolor: '#ddd'
		fgcolor: '#00f'
		x: 10
		y: 10
		game:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
		levelSetName: 'My Levels'
		par: 3
	}, level