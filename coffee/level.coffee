createArray = (len,initialValues="0")->
	ar = new Array(len)
	for el in ar
		el = initialValues
	ar

#creates 2d array with 0s as
Matrix = (x, y, initialValues, defaultValue="0")->
	@x = x
	@y = y
	@cols = []
	for i in [0...x]
		ar2 = []
		for j in [0...y]
			ar2.push if initialValues then initialValues.shift() else defaultValue
		@cols.push ar2
	@
Matrix::getAt = (x,y)-> @cols[x][y]
Matrix::setAt = (x,y,val)-> @cols[x][y] = val
Matrix::getRow = (y)->
	if y >= @y then return null
	row = []
	for col in @cols
		row.push col[y]
	return row

Matrix::getCol = (x)-> @cols[x]

Matrix::addCols = (num)->
	@x+=num
	while num>0
		@cols.push createArray @y
		num-=1
	@
Matrix::addRows= (num)->#FIXME
	@y+=num
	while num>0
		for col in @cols
			col.push '0'
		num-=1
	@
Matrix::subtractCols= (num)->#FIXME
	@x-=num
	@cols = @cols.slice(0,@x)
	
Matrix::subtractRows= (num)->#FIXME
	@y -= num
	for col in @cols
		col = col.slice(0,@y)
	@


Layer = (options)->
	options = $.extend {
		x: 3
		y: 3
		game: "000000000"
		fgcolor: "#0000ff"
		visible: true
	},options
	@complete = false
	@x = options.x
	@y = options.y
	@visible = options.visible
	@grid = new Matrix @x, @y, options.game.split('')
	@mark = new Matrix @x, @y
	@paint = new Matrix @x, @y
	@fgcolor = options.fgcolor
	@

Layer::getRowHints= ->
	hints = []
	for row in [0...@y]
		hints.push @getLineHints @grid.getRow row
	return hints

Layer::getColHints= ->
	hints= []
	for i in [0...@x]
		hints.push @getLineHints @grid.getCol i
	return hints

Layer::getLineHints= (row)->
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

Layer::isRowComplete = (y)->
	row = @grid.getRow(y)
	paintRow = @paint.getRow(y)
	complete = true
	for cell,i in row
		if +cell and !+paintRow[i]
			complete = false
	return complete

Layer::isColComplete = (x)->
	row = @grid.getCol(x)
	paintCol = @paint.getCol(x)
	complete = true
	for cell,i in row
		if +cell and !+paintCol[i]
			complete = false
	return complete

#TODO Add Marks for each layer
window.Level = (level)->
	($.extend {
		init: ->
			_layers = @game.split ','
			@layers = []
			_fgcolors = @fgcolor.split(',')
			for l, i in _layers
				@addLayer(l,_fgcolors[i])

			@currentLayerIndex = @layers.length - 1
			@currentLayer = @layers[@currentLayerIndex]
			@layerVisibility = []
			return this

		setLayer: (layerIndex)->
			@currentLayerIndex = layerIndex
			@currentLayer = @layers[@currentLayerIndex]
		addCols: (num)->
			@x += num
			for layer in @layers
				layer.grid.addCols(num)
				layer.mark.addCols()
				layer.paint.addCols()
		addRows: (num)->#FIXME
			@y+=num
			for layer in @layers
				layer.grid.addRows(num)
				layer.mark.addRows(num)
				layer.paint.addRows(num)
			
		subtractCols: (num)->#FIXME
			@x -= num
			for layer in @layers
				layer.grid.subtractCols(num)
				layer.mark.subtractCols(num)
				layer.paint.subtractCols(num)
			
		subtractRows: (num)->#FIXME
			@y -= num
			for layer in @layers
				layer.grid.subtractRows(num)
				layer.mark.subtractRows(num)
				layer.paint.subtractRows(num)
		addLayer: (game,fgcolor="#0000ff")->
			@layers.push new Layer 
				x:@x, 
				y:@y,
				game: game
				fgcolor: fgcolor
			@
		getLayerColor: (layerIndex = @currentLayerIndex)-> @layers[layerIndex].fgcolor
		setLayerColor: (color, layerIndex = @currentLayerIndex)-> @layers[layerIndex].fgcolor = color
		getLayerVisibility: (layerIndex = @currentLayerIndex)->
			#if undefined assume true
			@layerVisibility[layerIndex] is undefined or @layerVisibility[layerIndex]
		setLayerVisibility: (layerIndex, visibility)->
			@layers[layerIndex].visible = !!visibility #forcing boolean
		getLayerColors: ->
			ar = []
			for l in @layers
				ar.push l.fgcolor
			ar
		getGame: ->
			layers = ''
			for l,i in @layers
				if i > 0
					layers += ','
				for x in [0...@x] 
					for cell in l.grid.getCol(x)
						layers += +cell || 0
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
