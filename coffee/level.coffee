createArray = (len,initialValues="0")->
	ar = new Array(len)
	for el in ar
		el = initialValues
	ar
#creates 2d array with 0s as
createMatrix = (x, y, initialValues, defaultValue="0")->
	ar = []
	for i in [0...x]
		ar2 = []
		for j in [0...y]
			ar2.push if initialValues then initialValues.shift() else defaultValue
		ar.push ar2
	ar

#TODO Add Marks for each layer
window.Level = (level)->
	($.extend {
		init: ->
			_layers = @game.split ','
			@layers = []
			_fgcolors = @fgcolor.split(',')
			for l, i in _layers
				@layers.push
					grid:  createMatrix @x, @y, l.split('')
					mark:  createMatrix @x, @y
					paint: createMatrix @x, @y
					fgcolor: if _fgcolors.length > i then _fgcolors[i] else _fgcolors[0]

			@currentLayerIndex = @layers.length - 1
			@currentLayer = @layers[@currentLayerIndex]
			@layerVisibility = []
			return this
		getRow: (y)-> 
			return @currentLayer.grid[y]
		getCol: (x)-> 
			ar = []
			for i in [0...@y]
				ar.push @currentLayer.grid[i][x]
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
			pushHint = (force=false)->
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
		getAt: (x,y, type="grid")-> +@currentLayer[type][y][x]
		setAt: (x,y, val, type="grid")-> @currentLayer[type][y][x] = val
		setLayer: (layerIndex)->
			@currentLayerIndex = layerIndex
			@currentLayer = @layers[@currentLayerIndex]
		addCols: (num)->
			i=0
			while i<num
				for layer in @layers
					for n,j in layer.grid
						layer.grid[j].push('0')
						layer.mark[j].push('0')
						layer.paint[j].push('0')
				i+=1
			@x += num
		addRows: (num)->#FIXME
			i=0
			while i<num
				for layer in @layers
					layer.grid.push(createArray(@y))
					layer.mark.push(createArray(@y))
					layer.paint.push(createArray(@y))
				i+=1
			@y+=num
		subtractCols: (num)->#FIXME
			@x -= num
			i=0
			while i<num
				for layer in @layers
					for n,j in layer.grid
						layer.grid[j]=layer.grid[j].slice(0,@x)
						layer.mark[j]=layer.mark[j].slice(0,@x)
						layer.paint[j]=layer.paint[j].slice(0,@x)
				i+=1
			
		subtractRows: (num)->#FIXME
			@y -= num
			i=0
			while i<num
				for layer in @layers
					layer.grid=layer.grid.slice(0,@y)
					layer.mark=layer.mark.slice(0,@y)
					layer.paint=layer.paint.slice(0,@y)
				i+=1
			
		updateCell: (i, v,layerIndex = @currentLayerIndex)->
			@layers[layerIndex] = @layers[layerIndex].replaceAt(i,v)
		addLayer: ->
			@layers.push 
				grid:  createMatrix @x, @y
				mark:  createMatrix @x, @y
				paint: createMatrix @x, @y
			@layers
		getLayerColor: (layerIndex = @currentLayerIndex)-> @layers[layerIndex].fgcolor
		setLayerColor: (color, layerIndex = @currentLayerIndex)->
			colors = @fgcolor.split ','
			colors[layerIndex] = color
			@fgcolor = colors.join ','
		getLayerVisibility: (layerIndex = @currentLayerIndex)->
			#if undefined assume true
			@layerVisibility[layerIndex] is undefined or @layerVisibility[layerIndex]
		setLayerVisibility: (layerIndex, visibility)->
			@layerVisibility[layerIndex] = !!visibility #forcing boolean
		getGame: ->
			fgcolor = []
			layers = ''
			for l in @layers
				fgcolor.push(l.fgcolor)
				for y in l.grid
					for x in y
						layers += x
			layers
		currentLayerIndex: 0
		title: 'untitled'
		bgcolor: '#ddd'
		fgcolor: '#00f'
		x: 10
		y: 10
		game:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
		levelSetName: 'My Levels'
		par: 3
	}, level ).init()
