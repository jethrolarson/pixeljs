window.Level = (level)->
	level.layers = level.game.split ','
	level.currentLayer = level.layers.length - 1
	return $.extend {
		getRow: (y)-> 
			return @layers[@currentLayer][(@x*y)...(@x*y + @x)]
		getCol: (x)-> 
			ar = []
			for i in [0...@y]
				ar.push @layers[@currentLayer][i*@x + x]
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
		getAt: (x,y, layerIndex = @currentLayer)->
			return +@layers[layerIndex][(@x*y)+x]
		
		addCols: (num)->
			for layer,j in @layers
				newLayer = ''
				for i in [0...@y]
					newLayer += layer.substring(@x * i, (@x * (i + 1))) + String.times '0', num
				@layers[j] = newLayer
			@x+=num
		addRows: (num)->
			for layer in @layers 
				layer += String.times '0', @x * num
			@y+=num
		subtractCols: (num)->
			for layer,j in @layers 
				newGame = ''
				for i in [0...@x]
					newGame += layer.substring(@x * i, (@x * (i + 1)) - num)
				@layers[j] = newGame
			@x -= num
		subtractRows: (num)->
			#for layer in @layers
			#	layer = layer.substring(0,@x*@y)
			@y -= num
		updateCell: (i, v,layerIndex = @currentLayer)->
			@layers[layerIndex] = @layers[layerIndex].replaceAt(i,v)
		addLayer: ->
			@layers.push String.times '0', @x * @y
		getLayerColor: (layerIndex = @currentLayer)-> @fgcolor.split(',')[layerIndex]
		setLayerColor: (color, layerIndex = @currentLayer)->
			colors = @fgcolor.split ','
			colors[layerIndex] = color
			@fgcolor = colors.join ','
			
		getGame: ->
			@layers.join(',')
		currentLayer: 0
		title: 'untitled'
		bgcolor: '#ddd'
		fgcolor: '#00f'
		x: 10
		y: 10
		game:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
		levelSetName: 'My Levels'
		par: 3
	}, level
