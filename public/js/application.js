(function(){
  var Game;
  var __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  }, __hasProp = Object.prototype.hasOwnProperty;
  //compile command: coffee -w -c coffee/* -o public/js/
  Game = {
    dragMode: "paint",
    isDragging: false,
    isErasing: false,
    //constants
    COLWIDTH: 40,
    BORDERWIDTH: 1,
    LIVES: 3,
    //set on init
    $lives: undefined,
    $grid: undefined,
    $cells: undefined,
    $win: undefined,
    $lose: undefined,
    $games: undefined,
    $this: undefined,
    $colHints: undefined,
    $rowHints: undefined,
    //set on loadGame
    grid: [],
    title: "",
    data: {},
    cols: undefined,
    rows: undefined,
    gameIndex: undefined,
    lives: undefined,
    init: function init($el) {
      this.$el = $el;
      this.$grid = this.$el.find("#grid");
      this.$win = this.$el.find("#win");
      this.$lose = this.$el.find("#lose");
      this.$games = this.$el.find("#games");
      this.$colHints = this.$el.find("#colHints");
      this.$rowHints = this.$el.find("#rowHints");
      this.bindEvents();
      //load game data
      $.getJSON("/public/js/games.json", __bind(function(data) {
          this.data = data;
          return this.$el.trigger("gamesLoaded");
        }, this));
      return this.$el.trigger("init");
    },
    getCol: function getCol(x) {
      return this.$grid.find("li:nth-child(" + this.rows + "n+" + (x + 1) + ")");
    },
    getRow: function getRow(y) {
      return this.$grid.find("li").slice(y * this.cols, (y + 1) * this.cols);
    },
    getCoord: function getCoord(el) {
      var index;
      index = $(el).parent().children().index(el);
      return {
        x: (index) % this.cols,
        y: Math.floor(index / this.cols)
      };
    },
    getRowHints: function getRowHints() {
      var _a, _b, _c, hints, row;
      hints = [];
      _b = this.grid;
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        row = _b[_a];
        hints.push(this.getLineHints(row));
      }
      return hints;
    },
    getColHints: function getColHints() {
      var _a, _b, _c, _d, _e, col, hints, i, row;
      hints = [];
      _a = 0; _b = this.cols;
      for (i = _a; (_a <= _b ? i < _b : i > _b); (_a <= _b ? i += 1 : i -= 1)) {
        col = [];
        _d = this.grid;
        for (_c = 0, _e = _d.length; _c < _e; _c++) {
          row = _d[_c];
          col.push(row[i]);
        }
        hints.push(this.getLineHints(col));
      }
      return hints;
    },
    getLineHints: function getLineHints(row) {
      var _a, _b, cell, hint, hints, i, pushHint;
      hints = [];
      hint = 0;
      pushHint = function pushHint() {
        hint > 0 ? hints.push(hint) : null;
        hint = 0;
        return hint;
      };
      _a = row;
      for (i = 0, _b = _a.length; i < _b; i++) {
        cell = _a[i];
        if (cell === 'X') {
          hint += 1;
          i === (row.length - 1) ? pushHint() : null;
        } else {
          pushHint();
        }
      }
      return hints;
    },
    isGameComplete: function isGameComplete() {
      var _a, _b, i;
      _a = 0; _b = this.rows;
      for (i = _a; (_a <= _b ? i < _b : i > _b); (_a <= _b ? i += 1 : i -= 1)) {
        if (!this.isLineComplete(this.getRow(i))) {
          return false;
        }
      }
      return true;
    },
    isLineComplete: function isLineComplete($line) {
      var _a, _b, cell, coord, i;
      _a = 0; _b = $line.length;
      for (i = _a; (_a <= _b ? i < _b : i > _b); (_a <= _b ? i += 1 : i -= 1)) {
        cell = $line[i];
        coord = this.getCoord(cell);
        if (this.grid[coord.y][coord.x] === "X" && !$(cell).hasClass("on")) {
          return false;
        }
      }
      return true;
    },
    renderLives: function renderLives() {
      var _a, _b, html, life;
      this.$lives.empty().removeClass("fail");
      html = "";
      if (this.lives < 1) {
        this.$el.trigger("lose");
      } else {
        _a = 0; _b = this.lives;
        for (life = _a; (_a <= _b ? life < _b : life > _b); (_a <= _b ? life += 1 : life -= 1)) {
          html += "[^_^] ";
        }
      }
      return this.$lives.html(html);
    },
    loadGame: function loadGame(key) {
      var _a, _b, _c, _d, _e, _f, cell, gridHeight, gridWidth, html, row;
      //TODO make sure key exists in ob
      this.grid = this.data[key];
      this.title = key;
      this.lives = this.LIVES;
      $("#title").text(this.title);
      html = "";
      this.cols = this.grid[0].length;
      this.rows = this.grid.length;
      _b = this.grid;
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        row = _b[_a];
        _e = row;
        for (_d = 0, _f = _e.length; _d < _f; _d++) {
          cell = _e[_d];
          html += "<li> </li>";
        }
      }
      gridWidth = (this.COLWIDTH + this.BORDERWIDTH) * this.cols;
      gridHeight = (this.COLWIDTH + this.BORDERWIDTH) * this.rows;
      this.$grid.html(html).width(gridWidth);
      this.$win.add(this.$lose).hide().width(gridWidth).height(gridHeight).css("line-height", gridHeight + "px");
      this.$cells = this.$grid.find("li");
      this.$el.find("[name='dragMode']:checked").triggerHandler("click");
      return this.$el.trigger("gameStart");
    },
    // ======== #
    //  Events  #
    // ======== #
    bindEvents: function bindEvents() {
      this.$grid.delegate("li", "mouseover", this.eGridMouseover.bind(this)).delegate("li", "mousedown", this.eGridMousedown.bind(this)).mouseout(__bind(function() {
          return this.$cells.removeClass("hilight");
        }, this));
      this.$el.bind({
        "gamesLoaded": this.eGamesLoaded.bind(this),
        "paint": this.ePaint.bind(this),
        "mark": this.eMark.bind(this),
        "lose": this.eLose.bind(this),
        "win": this.eWin.bind(this)
      }).find("[name='dragMode']").click(__bind(function(e) {
          this.dragMode = e.target.value;
          return this.dragMode;
        }, this)).filter(":checked").triggerHandler("click");
      $(document).bind("mouseup", __bind(function() {
          this.isDragging = false;
          return this.$grid.removeClass("dragging");
        }, this));
      return this.$games.delegate("a", "click", __bind(function(e) {
          return this.loadGame(e.target.hash.slice(1));
        }, this));
    },
    eGamesLoaded: function eGamesLoaded(e) {
      var _a, html, index, key;
      index = location.hash.length > 1 ? location.hash.slice(1) : "House";
      this.loadGame(index);
      html = "";
      _a = this.data;
      for (key in _a) { if (__hasProp.call(_a, key)) {
        html += '<li><a href="#' + key + '">' + key;
        localStorage[this.title] ? html += 'won' : null;
        html += '</li>';
      }}
      return this.$games.html(html);
    },
    ePaint: function ePaint(e, el) {
      var $el, coord;
      $el = $(el);
      coord = this.getCoord(el);
      if (this.grid[coord.y][coord.x] === "X") {
        $el.addClass("on");
        this.isLineComplete(this.getRow(coord.y)) && $("#rowHints li").eq(coord.y).addClass("done");
        this.isLineComplete(this.getCol(coord.x)) && $("#colHints li").eq(coord.x).addClass("done");
        if (this.isGameComplete()) {
          return this.$el.trigger("win");
        }
      } else if (!$el.hasClass("error")) {
        $el.addClass("error");
        return this.$el.trigger("die", el);
      }
    },
    eMark: function eMark(e, el) {
      return $(el).toggleClass("mark", !this.isErasing);
    },
    eWin: function eWin() {
      this.dragMode = null;
      this.$win.show();
      localStorage[this.title] = true;
      return localStorage[this.title];
    },
    eLose: function eLose() {
      this.dragMode = null;
      this.$grid.addClass("lose");
      this.$lose.show();
      return this.$lives.text("Game Over [X_X]").addClass('fail');
    },
    eGridMouseover: function eGridMouseover(e) {
      var $el, coord;
      $el = $(e.target);
      coord = this.getCoord(e.target);
      if (this.isDragging) {
        return this.$el.trigger(this.dragMode, e.target);
      }
    },
    eGridMousedown: function eGridMousedown(e) {
      var $el;
      $el = $(e.target);
      this.isDragging = true;
      this.$grid.addClass("dragging");
      this.dragMode === "mark" ? (this.isErasing = $el.hasClass("mark")) : null;
      return this.$el.trigger(this.dragMode, e.target);
    }
  };
  // end game
  $.fn.pixeljs = function pixeljs() {
    return this.each(function() {
      var $game;
      $game = $(this);
      return $game.data("pixeljs", Object.clone(Game).init($game));
    });
    // Game extensions
    // ===============
  };
  //timer
  $("#game").bind({
    "init": function() {
      this.$timer = $("#timer");
      return this.$timer;
    },
    "die": function() {
      var timer;
      timer = this.$timer.data();
      return timer.time += 2 * 60 * 1000;
      // 2 minutes
    }
  }).bind("win lose", function() {
    return this.$timer.trigger("stop");
  });
  $(function() {
    return $("#game").pixeljs();
  });
})();
