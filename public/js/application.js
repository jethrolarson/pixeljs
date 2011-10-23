(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.Game = {
    gameMode: 'play',
    dragMode: 'break',
    isDragging: false,
    isErasing: false,
    colWidth: 40,
    init: function($game) {
      this.$game = $game;
      this.$gridCell = this.$game.find('#gridCell');
      this.$grid = this.$game.find('#grid').remove();
      this.$win = this.$game.find('#win');
      this.$lose = this.$game.find('#lose');
      this.$games = this.$game.find('#games');
      this.$colHints = this.$game.find('#colHints');
      this.$rowHints = this.$game.find('#rowHints');
      this.$game.trigger('init');
      this.loadAssets();
      this.bindEvents();
      return this;
    },
    start: function() {
      return this.loadGame(window.level);
    },
    edit: function() {
      this.gameMode = 'edit';
      this.$grid.enableContext();
      return this.start();
    },
    getCol: function(x) {
      return this.$grid.find("li:nth-child(" + this.level.y + "n+" + (x + 2) + ")");
    },
    getRow: function(y) {
      return this.$grid.find('li').slice(y * this.level.x, (y + 1) * this.level.x);
    },
    getCoord: function(el) {
      var index;
      index = $(el).parent().children('li').index(el);
      return {
        x: index % this.level.x,
        y: Math.floor(index / this.level.x)
      };
    },
    isGameComplete: function() {
      var i, _ref;
      for (i = 0, _ref = this.level.y; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        if (!this.isLineComplete(this.getRow(i))) {
          return false;
        }
      }
      return true;
    },
    isLineComplete: function($line) {
      var cell, coord, _i, _len;
      for (_i = 0, _len = $line.length; _i < _len; _i++) {
        cell = $line[_i];
        coord = this.getCoord(cell);
        if (this.level.getAt(coord.x, coord.y) && !$(cell).hasClass('on')) {
          return false;
        }
      }
      return true;
    },
    updateCols: function(cols) {
      var delta;
      delta = cols - this.level.x;
      if (delta > 0) {
        this.level.addCols(delta);
      } else if (delta < 0) {
        this.level.subtractCols(Math.abs(delta));
      }
      return this.renderLevel();
    },
    updateRows: function(cols) {
      var delta;
      delta = cols - this.level.y;
      if (delta > 0) {
        this.level.addRows(delta);
      } else if (delta < 0) {
        this.level.subtractRows(Math.abs(delta));
      }
      return this.renderLevel();
    },
    renderHints: function() {
      var hint, hintGroup, html, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2;
      html = '';
      _ref = this.level.getColHints();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        hintGroup = _ref[_i];
        html += '<li>';
        for (_j = 0, _len2 = hintGroup.length; _j < _len2; _j++) {
          hint = hintGroup[_j];
          html += '<div>' + hint + '</div>';
        }
        html += '</li>';
      }
      this.$colHints.html(html);
      html = '';
      _ref2 = this.level.getRowHints();
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        hintGroup = _ref2[_k];
        html += '<li>';
        for (_l = 0, _len4 = hintGroup.length; _l < _len4; _l++) {
          hint = hintGroup[_l];
          html += '<div>' + hint + '</div>';
        }
        html += '</li>';
      }
      return this.$rowHints.html(html);
    },
    loadGame: function(level) {
      this.level = Level(level);
      return this.renderLevel();
    },
    renderLevel: function() {
      var cell, cells, html, i, _len, _ref;
      this.score = 0;
      $('#title').html("<a href=\"/levelSet/" + this.level.levelSet + "\">" + this.level.levelSetName + "</a> &gt; " + this.level.title);
      html = '';
      cells = this.level.x * this.level.y;
      for (cell = 0; 0 <= cells ? cell < cells : cell > cells; 0 <= cells ? cell++ : cell--) {
        html += '<li> </li>';
      }
      this.$grid.html(html);
      this.$cells = this.$grid.find('li');
      if (this.gameMode === 'play') {
        this.renderHints();
      } else {
        _ref = this.$cells;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          cell = _ref[i];
          $(cell).toggleClass('paint', +this.level.game[i] === 1);
        }
      }
      this.$colorSheet = $(document.createElement('style')).prependTo(this.$grid);
      this.updateStyles();
      this.updateHints();
      return this.$gridCell.append(this.$grid);
    },
    updateStyles: function() {
      var css, gridHeight, gridWidth;
      css = '';
      this.colWidth = Math.floor(this.$gridCell.width() / this.level.x);
      gridWidth = this.colWidth * this.level.x;
      gridHeight = this.colWidth * this.level.y;
      css += "#grid li{\n	width: " + this.colWidth + "px;\n	height: " + this.colWidth + "px;\n}\n#grid{\n	width: " + gridWidth + "px;\n}\n#win,#lose{\n	width: " + gridWidth + "px;\n	height: " + gridHeight + "px;\n	line-height: " + gridHeight + "px;\n}\n\n#rowHints li div{\n	height: " + this.colWidth + "px;\n	line-height: " + this.colWidth + "px;\n}\n#colHints li div{\n	width: " + this.colWidth + "px;\n}";
      if (this.level.fgcolor) {
        css += "	#grid .paint, \n	#grid .on{\n		background-color:" + this.level.fgcolor + "\n}";
      }
      if (this.level.bgcolor) {
        css += "#grid{background-color:" + this.level.bgcolor + "}";
      }
      return this.$colorSheet.html(css);
    },
    loadAssets: function() {
      return this.assets = {
        hoverSound: new Audio('/public/audio/grid_hover.wav'),
        boom: new Audio('/public/audio/boom.wav'),
        bing: new Audio('/public/audio/bing.wav'),
        mark: new Audio('/public/audio/mark.wav'),
        win: new Audio('/public/audio/win.wav')
      };
    },
    bindEvents: function() {
      this.$grid.disableContext().delegate('li', {
        mouseover: $.proxy(this.eGridMouseover, this),
        mousedown: $.proxy(this.eGridMousedown, this)
      }).mouseout(__bind(function() {
        return this.$cells.removeClass('hilight');
      }, this));
      this.$game.bind({
        "break": $.proxy(this.eBreak, this),
        mark: $.proxy(this.eMark, this),
        lose: $.proxy(this.eLose, this),
        win: $.proxy(this.eWin, this),
        paint: $.proxy(this.ePaint, this),
        erase: $.proxy(this.eErase, this),
        die: __bind(function() {
          this.score += 1;
          this.$game.addClass('shake');
          this.assets.boom.play();
          return setTimeout(__bind(function() {
            return this.$game.removeClass('shake');
          }, this), 300);
        }, this)
      });
      return $(document).bind('mouseup', __bind(function() {
        return this.isDragging = false;
      }, this));
    },
    eBreak: function(e, el) {
      var $el, coord;
      $el = $(el);
      if (this.gameMode === 'edit' || $el.hasClass('mark')) {
        return;
      }
      coord = this.getCoord(el);
      if (this.level.getAt(coord.x, coord.y)) {
        $el.addClass('on');
        this.updateHints();
        if (this.isGameComplete()) {
          return this.$game.trigger('win');
        } else {
          return this.assets.bing.play();
        }
      } else if (!$el.hasClass('error')) {
        $el.addClass('error');
        return this.$game.trigger('die', el);
      }
    },
    updateHints: function() {
      var x, y, _ref, _ref2;
      for (y = 0, _ref = this.level.y; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
        this.isLineComplete(this.getRow(y)) && $('#rowHints li').eq(y).addClass('done');
      }
      for (x = 0, _ref2 = this.level.x; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
        this.isLineComplete(this.getCol(x)) && $('#colHints li').eq(x).addClass('done');
      }
    },
    eMark: function(e, el) {
      if (this.gameMode !== 'play') {
        return;
      }
      this.assets.mark.play();
      return $(el).toggleClass('mark', !this.isErasing);
    },
    ePaint: function(e, el) {
      var $el;
      $el = $(el);
      this.level.updateCell(this.$grid.find('li').index(el), this.isErasing ? '0' : '1');
      return $(el).toggleClass('paint', !this.isErasing);
    },
    eWin: function() {
      this.dragMode = null;
      this.assets.win.play();
      this.$win.show();
      return localStorage[this.title] = true;
    },
    eGridMouseover: function(e) {
      var $el, coord;
      $el = $(e.target);
      coord = this.getCoord(e.target);
      if (this.isDragging) {
        this.$game.trigger(this.dragMode, e.target);
      }
      return this.assets.hoverSound.play();
    },
    eGridMousedown: function(e) {
      var $el;
      $el = $(e.target);
      if (this.gameMode === 'play') {
        this.dragMode = e.which === 1 ? 'break' : 'mark';
        if (this.dragMode === 'mark') {
          this.isErasing = $el.hasClass('mark');
        }
      } else {
        if (e.which !== 1) {
          return true;
        }
        this.dragMode = 'paint';
        this.isErasing = $el.hasClass('paint');
      }
      this.isDragging = true;
      return this.$game.trigger(this.dragMode, e.target);
    }
  };
}).call(this);
