#compile and watch command: coffee -w -c coffee/* -o public/js/

Game = {
  dragMode: "paint"
  isDragging: false
  isErasing: false
  
  #constants
  COLWIDTH: 40
  BORDERWIDTH:1

  #set on loadGame
  grid: []
  title: ""
  data: {}
  
  init: ($el)->
    @$el= $el
    @$grid=     @$el.find "#grid"
    @$win=      @$el.find "#win"
    @$lose=     @$el.find "#lose"
    @$games=    @$el.find "#games"
    @$colHints= @$el.find "#colHints"
    @$rowHints= @$el.find "#rowHints"
    @$el.trigger "init"
    @bindEvents()
    this
  start: ->
    #load game data
    $.getJSON "/public/js/games.json", (data)=>
      @data = data
      @$el.trigger "gamesLoaded"
  getCol: (x)-> @$grid.find "li:nth-child(" + @rows + "n+" + (x + 1) + ")"
  getRow: (y)-> @$grid.find("li").slice(y * @cols, (y + 1) * @cols)

  getCoord: (el)->
    index = $(el).parent().children().index(el)
    x: (index) % @cols
    y: Math.floor(index / @cols)

  getRowHints: ->
    hints = []
    for row in @grid
      hints.push @getLineHints row
    return hints

  getColHints: ->
    hints= []
    for i in [0...@cols]
      col= []
      for row in @grid
        col.push row[i]
      hints.push @getLineHints col
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
      if cell is 'X'
        hint += 1
        pushHint() if i is row.length - 1
      else
        pushHint()
    pushHint(true) if hints.length is 0
    return hints

  isGameComplete: ->
    for i in [0...@rows]
      if not @isLineComplete(@getRow(i))
        return false
    return true

  isLineComplete: ($line)->
    for i in [0...$line.length]
      cell = $line[i]
      coord = @getCoord(cell)
      if @grid[coord.y][coord.x] is "X" and not $(cell).hasClass("on")
        return false
    return true

  renderLives: ->
    @$lives.empty().removeClass("fail")
    html= ""
    if @lives < 1
      @$el.trigger("lose")
    else
      for life in [0...@lives]
        html += "[^_^] "
    @$lives.html(html)
    
  renderHints: ->
    html= ""
    for hintGroup in @getColHints()
      html += "<li>"
      for hint in hintGroup
        html += "<div>"+hint+"</div>"
      html += "</li>"
    @$colHints.html(html)
    html= ""
    for hintGroup in @getRowHints()
      html += "<li>"
      for hint in hintGroup
        html += "<div>"+hint+"</div>"
      html += "</li>"
    @$rowHints.html(html)
    
  loadGame: (key)->
    #TODO make sure key exists in ob
    @grid= @data[key]
    @title= key
    @lives= @LIVES
    $("#title").text(@title)
    html= ""
    @cols= @grid[0].length
    @rows= @grid.length
    for row in @grid
      for cell in row
        html += "<li> </li>"
    gridWidth= (@COLWIDTH + @BORDERWIDTH) * @cols
    gridHeight= (@COLWIDTH + @BORDERWIDTH) * @rows
    @$grid.html(html).width(gridWidth)
    @renderHints()
    @$win.add(@$lose).hide().width(gridWidth).height(gridHeight).css("line-height", gridHeight+"px")
    @$cells= @$grid.find("li")
    @$el.find("[name='dragMode']:checked").triggerHandler("click")
    @$el.trigger("gameStart")
    
  timer: ->
    @$timer= $("#timer")
    @time= 0
    @timerOn= false
    that= this
    @$el.bind({
      "start": ->
        that.$el.trigger("startTimer")
      "die": ->
        that.time += 2 * 60 * 1000 # 2 minutes
      "startTimer": ->
        that.timerOn = true
        that.$el.trigger("updateTimer")
      "updateTimer": ->
        if not that.timerOn 
          return
        that.$timer.text(that.time)
        that.time += 1000
        interval= ->
          that.$el.trigger("updateTimer")
        setTimeout(interval, 1000)
      "stopTimer": ->
        that.timerOn
    }).bind("win lose", -> that.$el.trigger("stopTimer"))

  # ======== #  
  #  Events  #
  # ======== #
  bindEvents: ->
    @$grid.disableContext().delegate("li", "mouseover", @eGridMouseover.bind(this)
    ).delegate("li", "mousedown", @eGridMousedown.bind(this)
    ).mouseout =>
      @$cells.removeClass "hilight"
    @$el.bind {
      "gamesLoaded": @eGamesLoaded.bind(this)
      "paint": @ePaint.bind(this)
      "mark": @eMark.bind(this)
      "lose": @eLose.bind(this)
      "win": @eWin.bind(this)
    }
    $(document).bind "mouseup", => 
      @isDragging= false
      @$grid.removeClass("dragging")
    @$games.delegate "a", "click", (e)=>
      @loadGame(e.target.hash.slice(1))

  eGamesLoaded: (e)->
    index= if location.hash.length>1 
      location.hash.slice(1)
    else
      "House"
    @loadGame(index)
    html= ""
    for key of @data
      if localStorage[@title] then won= 'won'
      html+= "<li class=\"#{won}\"><a href=\"##{key}\">#{key}</li>"
    @$games.html(html)

  ePaint: (e, el)->
    $el= $(el)
    coord= @getCoord(el) 
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
    @dragMode= null
    @$win.show()
    localStorage[@title] = true

  eLose: ->
    @dragMode= null
    @$grid.addClass("lose")
    @$lose.show()
    @$lives.text("Game Over [X_X]").addClass('fail')

  eGridMouseover: (e)->
    $el= $(e.target)
    coord= @getCoord(e.target)
    if @isDragging
      @$el.trigger(@dragMode, e.target)

  eGridMousedown: (e)->
    $el = $(e.target)
    @isDragging = true
    @$grid.addClass("dragging")
    @dragMode = if e.which is 1 then 'paint' else 'mark'
    @isErasing = $el.hasClass("mark") if @dragMode is "mark"
    @$el.trigger @dragMode, e.target

}# end game

# Game extensions
# ===============
Game.achievements = {
  list: {}
  $achievements: undefined
  init: ->
    #createUI
    @achievements= $("#achievements")
    @bindEvents()
    return this
  bindEvents: ->
    that= this
    @$game.bind( "achieve", (e, name, Label, icon) ->
      if that.list.hasOwnProperty(name)
        e.preventPropagation().preventDefault();
      else
        achievment= that.list[name]= {
          "name": name
          "label": label
          "icon": icon
        }
        that.$game.trigger("achieved", achievment)
    )
}
#timer
timer= (game)->
  return this

#Create game
$.fn.pixeljs= ->
  return @each( ->
    $game= $(this)
    game= Game.init($game);
    $game.data("pixeljs", game)
    game.start();
  )

$( ->
  $("#game").pixeljs()
)
    