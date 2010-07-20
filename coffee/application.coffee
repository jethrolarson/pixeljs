#compile command: coffee -w -c coffee/* -o public/js/

Game: {
  dragMode: "paint"
  isDragging: false
  isErasing: false
  
  #constants
  COLWIDTH: 40
  BORDERWIDTH:1
  LIVES: 3
  
  #set on init
  $lives: undefined
  $grid: undefined
  $cells: undefined
  $win: undefined
  $lose: undefined
  $games: undefined
  $this: undefined
  $colHints: undefined
  $rowHints: undefined
  
  #set on loadGame
  grid: []
  title: ""
  data: {}
  cols: undefined
  rows: undefined
  gameIndex: undefined
  lives: undefined
  
  init: ($el)->
    @$el: $el
    @$grid: @$el.find("#grid")
    @$win: @$el.find("#win")
    @$lose: @$el.find("#lose")
    @$games: @$el.find("#games")
    @$colHints: @$el.find("#colHints")
    @$rowHints: @$el.find("#rowHints")
    @bindEvents()
    #load game data
    $.getJSON("/public/js/games.json", (data)=>
      @data: data
      @$el.trigger("gamesLoaded")
    )
    @$el.trigger("init")
    
  getCol: (x)->
    return @$grid.find("li:nth-child(" + @rows + "n+" + (x + 1) + ")")

  getRow: (y)->
    return @$grid.find("li").slice(y * @cols, (y + 1) * @cols)

  getCoord: (el)->
    index: $(el).parent().children().index(el)
    return {
      x: (index) % @cols
      y: Math.floor(index / @cols)
    }

  getRowHints: ->
    hints: []
    for row in @grid
      hints.push(@getLineHints(row))
    return hints

  getColHints: ->
    hints: []
    for i in [0...@cols]
      col: []
      for row in @grid
        col.push(row[i])
      hints.push(@getLineHints(col))
    return hints

  getLineHints: (row)->
    hints: []
    hint: 0
    pushHint: ->
      if hint > 0
        hints.push(hint)
      hint: 0
    for cell, i in row
      if cell is 'X'
        hint += 1
        if i is (row.length-1)
          pushHint()
      else
        pushHint()
    return hints

  isGameComplete: ->
    for i in [0...@rows]
      if not @isLineComplete(@getRow(i))
        return false
    return true

  isLineComplete: ($line)->
    for i in [0...$line.length]
      cell: $line[i]
      coord: @getCoord(cell)
      if @grid[coord.y][coord.x] is "X" and not $(cell).hasClass("on")
        return false
    return true

  renderLives: ->
    @$lives.empty().removeClass("fail")
    html: ""
    if @lives < 1
      @$el.trigger("lose")
    else
      for life in [0...@lives]
        html += "[^_^] "
    @$lives.html(html)

  loadGame: (key)->
    #TODO make sure key exists in ob
    @grid: @data[key]
    @title: key
    @lives: @LIVES
    $("#title").text(@title)
    html: ""
    @cols: @grid[0].length
    @rows: @grid.length
    for row in @grid
      for cell in row
        html += "<li> </li>"
    gridWidth: (@COLWIDTH + @BORDERWIDTH) * @cols
    gridHeight: (@COLWIDTH + @BORDERWIDTH) * @rows
    @$grid.html(html).width(gridWidth)
    @$win.add(@$lose).hide().width(gridWidth).height(gridHeight).css("line-height", gridHeight+"px")
    @$cells: @$grid.find("li")
    @$el.find("[name='dragMode']:checked").triggerHandler("click")
    @$el.trigger("gameStart")

  # ======== #  
  #  Events  #
  # ======== #
  bindEvents: ->
    @$grid.delegate("li", "mouseover", @eGridMouseover.bind(this)
    ).delegate("li", "mousedown", @eGridMousedown.bind(this)
    ).mouseout(=>
      @$cells.removeClass("hilight")
    )
    @$el.bind({
      "gamesLoaded": @eGamesLoaded.bind(this)
      "paint": @ePaint.bind(this)
      "mark": @eMark.bind(this)
      "lose": @eLose.bind(this)
      "win": @eWin.bind(this)
    }).find("[name='dragMode']").click((e)=>
      @dragMode = e.target.value
    ).filter(":checked").triggerHandler("click")
    $(document).bind("mouseup", => 
      @isDragging: false
      @$grid.removeClass("dragging")
    )
    @$games.delegate("a", "click", (e)=>
      @loadGame(e.target.hash.slice(1))
    )

  eGamesLoaded: (e)->
    index: if location.hash.length>1 
      location.hash.slice(1)
    else
      "House"
    @loadGame(index)
    html: ""
    for key of @data
      html+= '<li><a href="#'+key+'">'+key
      if localStorage[@title] then html+= 'won'
      html+= '</li>'
    @$games.html(html)

  ePaint: (e, el)->
    $el: $(el)
    coord: @getCoord(el) 
    if @grid[coord.y][coord.x] is "X"
      $el.addClass("on")
      @isLineComplete(@getRow(coord.y)) and $("#rowHints li").eq(coord.y).addClass("done")
      @isLineComplete(@getCol(coord.x)) and $("#colHints li").eq(coord.x).addClass("done")
      if @isGameComplete()
        @$el.trigger("win")
    else if not $el.hasClass("error")
      $el.addClass("error")
      @$el.trigger("die", el)

  eMark: (e,el)-> 
    $(el).toggleClass("mark", not @isErasing)

  eWin: ->
    @dragMode: null
    @$win.show()
    localStorage[@title] = true

  eLose: ->
    @dragMode: null
    @$grid.addClass("lose")
    @$lose.show()
    @$lives.text("Game Over [X_X]").addClass('fail')

  eGridMouseover: (e)->
    $el: $(e.target)
    coord: @getCoord(e.target)
    if @isDragging
      @$el.trigger(@dragMode, e.target)

  eGridMousedown: (e)->
    $el: $(e.target)
    @isDragging: true
    @$grid.addClass("dragging")
    if @dragMode is "mark"
      @isErasing: $el.hasClass("mark")
    @$el.trigger(@dragMode, e.target)

}# end game

$.fn.pixeljs: ->
  return @each( ->
    $game: $(this)
    $game.data("pixeljs", Object.clone(Game).init($game))
  )
# Game extensions
# ===============

#timer
$("#game").bind({
  "init": ->
    @$timer: $("#timer")
  "die": ->
    timer: @$timer.data()
    timer.time += 2 * 60 * 1000 # 2 minutes
    
}).bind("win lose", -> @$timer.trigger("stop"))

$( ->
  $("#game").pixeljs()
)
    