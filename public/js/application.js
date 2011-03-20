(function() {
  var Game, timer;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Game = {
    dragMode: "paint",
    isDragging: false,
    isErasing: false,
    COLWIDTH: 40,
    BORDERWIDTH: 1,
    grid: [],
    title: "",
    data: {},
    init: function($el) {
      this.$el = $el;
      this.$grid = this.$el.find("#grid");
      this.$win = this.$el.find("#win");
      this.$lose = this.$el.find("#lose");
      this.$games = this.$el.find("#games");
      this.$colHints = this.$el.find("#colHints");
      this.$rowHints = this.$el.find("#rowHints");
      this.$el.trigger("init");
      this.bindEvents();
      return this;
    },
    start: function() {
      return $.getJSON("/public/js/games.json", __bind(function(data) {
        this.data = data;
        return this.$el.trigger("gamesLoaded");
      }, this));
    },
    getCol: function(x) {
      return this.$grid.find("li:nth-child(" + this.rows + "n+" + (x + 1) + ")");
    },
    getRow: function(y) {
      return this.$grid.find("li").slice(y * this.cols, (y + 1) * this.cols);
    },
    getCoord: function(el) {
      var index;
      index = $(el).parent().children().index(el);
      return {
        x: index % this.cols,
        y: Math.floor(index / this.cols)
      };
    },
    getRowHints: function() {
      var hints, row, _i, _len, _ref;
      hints = [];
      _ref = this.grid;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        hints.push(this.getLineHints(row));
      }
      return hints;
    },
    getColHints: function() {
      var col, hints, i, row, _i, _len, _ref, _ref2;
      hints = [];
      for (i = 0, _ref = this.cols; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        col = [];
        _ref2 = this.grid;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          row = _ref2[_i];
          col.push(row[i]);
        }
        hints.push(this.getLineHints(col));
      }
      return hints;
    },
    getLineHints: function(row) {
      var cell, hint, hints, i, pushHint, _len;
      hints = [];
      hint = 0;
      pushHint = function(force) {
        force || (force = false);
        if (hint > 0 || force) {
          hints.push(hint);
        }
        return hint = 0;
      };
      for (i = 0, _len = row.length; i < _len; i++) {
        cell = row[i];
        if (cell === 'X') {
          hint += 1;
          if (i === (row.length - 1)) {
            pushHint();
          }
        } else {
          pushHint();
        }
      }
      if (hints.length === 0) {
        pushHint(true);
      }
      return hints;
    },
    isGameComplete: function() {
      var i, _ref;
      for (i = 0, _ref = this.rows; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!this.isLineComplete(this.getRow(i))) {
          return false;
        }
      }
      return true;
    },
    isLineComplete: function($line) {
      var cell, coord, i, _ref;
      for (i = 0, _ref = $line.length; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        cell = $line[i];
        coord = this.getCoord(cell);
        if (this.grid[coord.y][coord.x] === "X" && !$(cell).hasClass("on")) {
          return false;
        }
      }
      return true;
    },
    renderLives: function() {
      var html, life, _ref;
      this.$lives.empty().removeClass("fail");
      html = "";
      if (this.lives < 1) {
        this.$el.trigger("lose");
      } else {
        for (life = 0, _ref = this.lives; (0 <= _ref ? life < _ref : life > _ref); (0 <= _ref ? life += 1 : life -= 1)) {
          html += "[^_^] ";
        }
      }
      return this.$lives.html(html);
    },
    renderHints: function() {
      var hint, hintGroup, html, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2;
      html = "";
      _ref = this.getColHints();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        hintGroup = _ref[_i];
        html += "<li>";
        for (_j = 0, _len2 = hintGroup.length; _j < _len2; _j++) {
          hint = hintGroup[_j];
          html += "<div>" + hint + "</div>";
        }
        html += "</li>";
      }
      this.$colHints.html(html);
      html = "";
      _ref2 = this.getRowHints();
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        hintGroup = _ref2[_k];
        html += "<li>";
        for (_l = 0, _len4 = hintGroup.length; _l < _len4; _l++) {
          hint = hintGroup[_l];
          html += "<div>" + hint + "</div>";
        }
        html += "</li>";
      }
      return this.$rowHints.html(html);
    },
    loadGame: function(key) {
      var cell, gridHeight, gridWidth, html, row, _i, _j, _len, _len2, _ref;
      this.grid = this.data[key];
      this.title = key;
      this.lives = this.LIVES;
      $("#title").text(this.title);
      html = "";
      this.cols = this.grid[0].length;
      this.rows = this.grid.length;
      _ref = this.grid;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          cell = row[_j];
          html += "<li> </li>";
        }
      }
      gridWidth = (this.COLWIDTH + this.BORDERWIDTH) * this.cols;
      gridHeight = (this.COLWIDTH + this.BORDERWIDTH) * this.rows;
      this.$grid.html(html).width(gridWidth);
      this.renderHints();
      this.$win.add(this.$lose).hide().width(gridWidth).height(gridHeight).css("line-height", gridHeight + "px");
      this.$cells = this.$grid.find("li");
      this.$el.find("[name='dragMode']:checked").triggerHandler("click");
      return this.$el.trigger("gameStart");
    },
    timer: function() {
      var that;
      this.$timer = $("#timer");
      this.time = 0;
      this.timerOn = false;
      that = this;
      return this.$el.bind({
        "start": function() {
          return that.$el.trigger("startTimer");
        },
        "die": function() {
          return that.time += 2 * 60 * 1000;
        },
        "startTimer": function() {
          that.timerOn = true;
          return that.$el.trigger("updateTimer");
        },
        "updateTimer": function() {
          var interval;
          if (!that.timerOn) {
            return;
          }
          that.$timer.text(that.time);
          that.time += 1000;
          interval = function() {
            return that.$el.trigger("updateTimer");
          };
          return setTimeout(interval, 1000);
        },
        "stopTimer": function() {
          return that.timerOn;
        }
      }).bind("win lose", function() {
        return that.$el.trigger("stopTimer");
      });
    },
    bindEvents: function() {
      this.$grid.disableContext().delegate("li", "mouseover", this.eGridMouseover.bind(this)).delegate("li", "mousedown", this.eGridMousedown.bind(this)).mouseout(__bind(function() {
        return this.$cells.removeClass("hilight");
      }, this));
      this.$el.bind({
        "gamesLoaded": this.eGamesLoaded.bind(this),
        "paint": this.ePaint.bind(this),
        "mark": this.eMark.bind(this),
        "lose": this.eLose.bind(this),
        "win": this.eWin.bind(this)
      });
      $(document).bind("mouseup", __bind(function() {
        this.isDragging = false;
        return this.$grid.removeClass("dragging");
      }, this));
      return this.$games.delegate("a", "click", __bind(function(e) {
        return this.loadGame(e.target.hash.slice(1));
      }, this));
    },
    eGamesLoaded: function(e) {
      var html, index, key, won;
      index = location.hash.length > 1 ? location.hash.slice(1) : "House";
      this.loadGame(index);
      html = "";
      for (key in this.data) {
        if (localStorage[this.title]) {
          won = 'won';
        }
        html += "<li class=\"" + won + "\"><a href=\"#" + key + "\">" + key + "</li>";
      }
      return this.$games.html(html);
    },
    ePaint: function(e, el) {
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
    eMark: function(e, el) {
      return $(el).toggleClass("mark", !this.isErasing);
    },
    eWin: function() {
      this.dragMode = null;
      this.$win.show();
      return localStorage[this.title] = true;
    },
    eLose: function() {
      this.dragMode = null;
      this.$grid.addClass("lose");
      this.$lose.show();
      return this.$lives.text("Game Over [X_X]").addClass('fail');
    },
    eGridMouseover: function(e) {
      var $el, coord;
      $el = $(e.target);
      coord = this.getCoord(e.target);
      if (this.isDragging) {
        return this.$el.trigger(this.dragMode, e.target);
      }
    },
    eGridMousedown: function(e) {
      var $el;
      $el = $(e.target);
      this.isDragging = true;
      this.$grid.addClass("dragging");
      this.dragMode = e.which === 1 ? 'paint' : 'mark';
      if (this.dragMode === "mark") {
        this.isErasing = $el.hasClass("mark");
      }
      return this.$el.trigger(this.dragMode, e.target);
    }
  };
  Game.achievements = {
    list: {},
    $achievements: void 0,
    init: function() {
      this.achievements = $("#achievements");
      this.bindEvents();
      return this;
    },
    bindEvents: function() {
      var that;
      that = this;
      return this.$game.bind("achieve", function(e, name, Label, icon) {
        var achievment;
        if (that.list.hasOwnProperty(name)) {
          return e.preventPropagation().preventDefault();
        } else {
          achievment = that.list[name] = {
            "name": name,
            "label": label,
            "icon": icon
          };
          return that.$game.trigger("achieved", achievment);
        }
      });
    }
  };
  timer = function(game) {
    return this;
  };
  $.fn.pixeljs = function() {
    return this.each(function() {
      var $game, game;
      $game = $(this);
      game = Game.init($game);
      $game.data("pixeljs", game);
      return game.start();
    });
  };
  $(function() {
    return $("#game").pixeljs();
  });
}).call(this);
