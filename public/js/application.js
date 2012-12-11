// Generated by CoffeeScript 1.3.3
(function() {

  window.Game = {
    gameMode: 'play',
    dragMode: 'break',
    isDragging: false,
    isErasing: false,
    mute: false,
    colWidth: 40,
    MAX_CELL_WIDTH: 60,
    lastCell: '',
    showAll: false,
    init: function($game) {
      var canvas;
      this.$game = $game;
      this.$gridCell = this.$game.find('#gridCell');
      this.$win = this.$game.find('#win');
      this.$lose = this.$game.find('#lose');
      this.$score = this.$game.find('#score');
      this.$games = this.$game.find('#games');
      this.$colHints = this.$game.find('#colHints');
      this.$rowHints = this.$game.find('#rowHints');
      this.$layers = $('#layers');
      this.$canvas = $('#canvas');
      this.$colorSheet = $(document.createElement('style')).prependTo(this.$game);
      this.$game.trigger('init');
      canvas = document.getElementById('canvas');
      this.loadAssets();
      this.bindEvents();
      return this;
    },
    start: function() {
      return this.loadGame(window.level);
    },
    blip: 0,
    drawGrid: function() {
      var i, _i, _j, _ref, _ref1;
      this.p.stroke(this.p.brightness(this.bgc) > 80 ? 0 : 200);
      for (i = _i = 1, _ref = this.level.x; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
        if (i % 5) {
          this.p.strokeWeight(1);
        } else {
          this.p.strokeWeight(3);
        }
        this.p.line(i * this.cw + this.offset.x, this.offset.y, i * this.cw + this.offset.x, this.level.y * this.cw + this.offset.y);
      }
      for (i = _j = 1, _ref1 = this.level.y; 1 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 1 <= _ref1 ? ++_j : --_j) {
        if (i % 5) {
          this.p.strokeWeight(1);
        } else {
          this.p.strokeWeight(3);
        }
        this.p.line(this.offset.x, i * this.cw + this.offset.y, this.level.x * this.cw + this.offset.x, i * this.cw + this.offset.y);
      }
      return this.p.fill(0, 102, 153);
    },
    drawCell: function(x, y) {
      var cellMargin;
      cellMargin = 0;
      return this.p.rect(x * this.cw + this.offset.x + cellMargin, y * this.cw + this.offset.y + cellMargin, this.cw - cellMargin * 2, this.cw - cellMargin * 2);
    },
    drawMark: function(x, y, color) {
      if (color == null) {
        color = this.p.color(0, 0, 0);
      }
      this.p.stroke(color);
      this.p.line(x * this.cw + this.offset.x, y * this.cw + this.offset.y, (x + 1) * this.cw + this.offset.x, (y + 1) * this.cw + this.offset.y);
      this.p.line(x * this.cw + this.offset.x, (y + 1) * this.cw + this.offset.y, (x + 1) * this.cw + this.offset.x, y * this.cw + this.offset.y);
      return this.p.noStroke();
    },
    drawCells: function() {
      var fgc, layer, layerIndex, x, y, _i, _j, _k, _len, _ref, _ref1, _ref2;
      this.p.noStroke();
      this.score = 0;
      _ref = this.level.layers;
      for (layerIndex = _i = 0, _len = _ref.length; _i < _len; layerIndex = ++_i) {
        layer = _ref[layerIndex];
        if (!this.showAll && layerIndex !== this.level.currentLayerIndex) {
          continue;
        }
        fgc = color.hexToRGB(layer.fgcolor);
        for (x = _j = 0, _ref1 = this.level.x; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          for (y = _k = 0, _ref2 = this.level.y; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; y = 0 <= _ref2 ? ++_k : --_k) {
            if (this.gameMode === 'play') {
              if (+layer.paint.getAt(x, y)) {
                if (+layer.grid.getAt(x, y)) {
                  this.p.fill(fgc.r, fgc.g, fgc.b);
                  this.drawCell(x, y);
                } else if (layer === this.level.currentLayer) {
                  this.score += 1;
                  this.drawMark(x, y, this.p.color(180, 30, 30));
                }
              } else if (+layer.mark.getAt(x, y)) {
                this.p.fill(0, 200, 0);
                this.drawMark(x, y);
              }
            } else {
              if (+layer.grid.getAt(x, y)) {
                this.p.fill(fgc.r, fgc.g, fgc.b);
                this.drawCell(x, y);
              }
            }
          }
        }
      }
      return this;
    },
    draw: function() {
      var biggestColHints, biggestRowHints, cell, col, colComplete, colHints, curCell, gridH, gridW, gridX, gridY, hint, hintGroup, i, level, pos, prev, row, rowComplete, rowHints, x, xw, y, yw, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _ref;
      this.p.background(80);
      biggestRowHints = 0;
      biggestColHints = 0;
      if (this.gameMode === 'play') {
        biggestRowHints = 3;
        biggestColHints = 3;
        rowHints = this.level.currentLayer.getRowHints();
        for (_i = 0, _len = rowHints.length; _i < _len; _i++) {
          row = rowHints[_i];
          if (row.length > biggestRowHints) {
            biggestRowHints = row.length;
          }
        }
        colHints = this.level.currentLayer.getColHints();
        for (_j = 0, _len1 = colHints.length; _j < _len1; _j++) {
          col = colHints[_j];
          if (col.length > biggestColHints) {
            biggestColHints = col.length;
          }
        }
        colHints = this.level.currentLayer.getColHints();
      }
      gridW = this.w - this.gridBounds.x1 - (this.w - this.gridBounds.x2);
      xw = Math.floor(gridW / (this.level.x + biggestRowHints));
      gridH = this.h - this.gridBounds.y1 - (this.h - this.gridBounds.y2);
      yw = Math.floor(gridH / (this.level.y + biggestColHints));
      this.cw = Math.min(xw, yw);
      this.p.textSize(Math.floor(this.cw / 3));
      this.offset = {
        x: this.gridBounds.x1 + (biggestRowHints * this.cw),
        y: this.gridBounds.y1 + (biggestColHints * this.cw)
      };
      gridW = this.cw * this.level.x;
      gridH = this.cw * this.level.y;
      this.bgc = color.hexToRGB(this.level.bgcolor);
      this.bgc = this.p.color(this.bgc.r, this.bgc.g, this.bgc.b);
      this.p.fill(this.bgc);
      this.p.rect(this.offset.x, this.offset.y, gridW, gridH);
      gridX = Math.floor((this.p.mouseX - this.offset.x) / this.cw);
      gridY = Math.floor((this.p.mouseY - this.offset.y) / this.cw);
      curCell = gridX + ',' + gridY;
      x = gridX * this.cw;
      y = gridY * this.cw;
      if (this.p.mouseX > this.offset.x && this.p.mouseY > this.offset.y && gridX < this.level.x && gridY < this.level.y) {
        if (this.p.mouseIsPressed) {
          cell = +this.level.currentLayer.grid.getAt(gridX, gridY);
          if (this.gameMode === 'play') {
            this.dragMode = this.p.mouseButton === this.p.RIGHT ? 'mark' : 'grid';
            if (this.newlyPressed && this.dragMode === 'mark') {
              this.isErasing = +this.level.currentLayer.mark.getAt(gridX, gridY);
            }
            if (this.dragMode === 'mark') {
              this.level.currentLayer.mark.setAt(gridX, gridY, !this.isErasing, 'paint');
            } else {
              prev = +this.level.currentLayer.paint.getAt(gridX, gridY);
              if (!+this.level.currentLayer.mark.getAt(gridX, gridY)) {
                this.level.currentLayer.paint.setAt(gridX, gridY, "1", 'paint');
                if (!prev) {
                  if (cell) {
                    this.assets.bing.play();
                  } else {
                    this.assets.boom.play();
                  }
                }
              }
            }
          } else {
            if (this.newlyPressed) {
              this.isErasing = !!cell;
            }
            if (!!cell !== !this.isErasing) {
              this.level.currentLayer.grid.setAt(gridX, gridY, (+(!this.isErasing)).toString());
              _ref = this.level.layers;
              for (i = _k = 0, _len2 = _ref.length; _k < _len2; i = ++_k) {
                level = _ref[i];
                if (i !== this.level.currentLayerIndex) {
                  level.grid.setAt(gridX, gridY, "0");
                }
              }
              if (this.lastCell !== curCell || this.newlyPressed) {
                this.assets.bing.play();
              }
            }
          }
        }
        /*
        			else
        				if @lastCell isnt curCell
        					@assets.hoverSound.play()
        */

      }
      this.newlyPressed = false;
      this.drawCells();
      if (this.gameMode === 'play') {
        for (y = _l = 0, _len3 = rowHints.length; _l < _len3; y = ++_l) {
          hintGroup = rowHints[y];
          rowComplete = this.level.currentLayer.isRowComplete(y);
          for (x = _m = 0, _len4 = hintGroup.length; _m < _len4; x = ++_m) {
            hint = hintGroup[x];
            pos = {
              x: this.cw * x + this.gridBounds.x1,
              y: this.cw * y + this.offset.y
            };
            this.p.fill(255);
            this.p.rect(pos.x, pos.y, this.cw, this.cw);
            if (rowComplete) {
              this.p.fill(200);
            } else {
              this.p.fill(0);
            }
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.text(hint, pos.x + this.cw / 2, pos.y + this.cw / 2);
          }
        }
        for (x = _n = 0, _len5 = colHints.length; _n < _len5; x = ++_n) {
          hintGroup = colHints[x];
          colComplete = this.level.currentLayer.isColComplete(x);
          for (y = _o = 0, _len6 = hintGroup.length; _o < _len6; y = ++_o) {
            hint = hintGroup[y];
            pos = {
              x: this.cw * x + this.offset.x,
              y: this.cw * y + this.gridBounds.y1
            };
            this.p.fill(255);
            this.p.rect(pos.x, pos.y, this.cw, this.cw);
            if (colComplete) {
              this.p.fill(200);
            } else {
              this.p.fill(0);
            }
            this.p.text(hint, pos.x + this.cw / 2, pos.y + this.cw / 2);
          }
        }
      }
      this.drawGrid();
      this.p.fill(255);
      this.p.textAlign(this.p.LEFT);
      this.p.text("Faults: " + this.score + "/" + this.level.par, 10, 40);
      this.lastCell = curCell;
      return this;
    },
    edit: function() {
      this.showAll = this.gameMode = 'edit';
      this.$gridCell.enableContext();
      return this.start();
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
      var i, _i, _ref;
      for (i = _i = 0, _ref = this.level.y; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (!this.isLineComplete(this.getRow(i))) {
          return false;
        }
      }
      return true;
    },
    renderLayerUI: function() {
      var i, layer, layerUI, _i, _len, _ref;
      if (this.gameMode === 'play' && this.level.layers.length === 1) {
        return;
      }
      layerUI = '';
      _ref = this.level.layers;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        layer = _ref[i];
        layerUI += "<div>\n	<input \n		class=\"changeLayer layer" + i + " " + (i === this.level.currentLayerIndex ? 'on' : '') + "\"\n		type=\"color\" name=\"fgcolor" + i + "\" value=\"" + layer.fgcolor + "\" style=\"background-color:" + layer.fgcolor + "\"/>\n</div>";
      }
      if (this.gameMode !== 'play') {
        layerUI += '<button id="addLayer" type="button">+</button>';
      }
      return this.$layers.html(layerUI + "<a class=\"showAll\" href=\"\">&#9635;</a>");
    },
    loadGame: function(level) {
      this.level = Level(level);
      if (this.gameMode === 'play') {
        this.changeLayer(0);
      }
      this.renderLevel();
      this.renderLayerUI();
      return this.updateScore();
    },
    renderLevel: function() {
      var _this = this;
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.gridBounds = {
        x1: 10,
        y1: 10,
        x2: this.w - 80,
        y2: this.h - 30
      };
      if (this.gameMode !== 'play') {
        this.gridBounds.x1 = 140;
      }
      new Processing(canvas, function(p) {
        _this.p = p;
        _this.p.width = _this.w;
        _this.p.height = _this.h;
        _this.p.draw = _this.draw.bind(_this);
        _this.p.frameRate(24);
        _this.p.mousePressed = function() {
          _this.newlyPressed = true;
          return _this.p.mouseIsPressed = true;
        };
        return _this.p.mouseReleased = function() {
          return _this.p.mouseIsPressed = false;
        };
      });
      if (this.gameMode === 'play') {
        this.score = 0;
        return $('#title').html(this.level.title);
      }
    },
    loadAssets: function() {
      return this.assets = {
        hoverSound: new SoundGroup('grid_hover.wav'),
        boom: new SoundGroup('boom.wav'),
        bing: new SoundGroup('bing.wav'),
        mark: new SoundGroup('mark.wav'),
        win: new Audio('win.wav')
      };
    },
    addLayer: function() {
      this.level.addLayer();
      this.renderLayerUI();
      return this.renderLevel();
    },
    changeLayer: function(layerIndex) {
      var i, layer, _i, _len, _ref;
      if (this.gameMode === 'play') {
        _ref = this.level.layers;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          layer = _ref[i];
          if (i !== layerIndex) {
            layer.visible = false;
          }
        }
      }
      return this.level.setLayer(layerIndex);
    },
    bindEvents: function() {
      var that,
        _this = this;
      this.$game.bind({
        "break": $.proxy(this.eBreak, this),
        mark: $.proxy(this.eMark, this),
        lose: $.proxy(this.eLose, this),
        win: $.proxy(this.eWin, this),
        erase: $.proxy(this.eErase, this),
        die: function() {
          _this.score += 1;
          _this.$game.addClass('shake');
          if (!_this.mute) {
            _this.assets.boom.play();
          }
          _this.updateScore();
          return setTimeout(function() {
            return _this.$game.removeClass('shake');
          }, 300);
        }
      });
      $('#mute').bind('change', function(e) {
        _this.mute = e.target.checked;
        return true;
      });
      that = this;
      $('.changeLayer').live('click', function(e) {
        var layerRE;
        layerRE = /layer(\d)+/.exec(this.className);
        if (layerRE.length) {
          that.changeLayer(+layerRE[1]);
          if (!$(this).hasClass('on')) {
            $('.changeLayer').removeClass('on');
            $(this).addClass('on');
            return e.preventDefault();
          }
        }
      });
      return $('.showAll').live('click', function(e) {
        var $this, isOn;
        e.preventDefault();
        $this = $(this);
        isOn = $this.hasClass('on');
        that.showAll = !isOn;
        $this.toggleClass('on', !isOn);
        return true;
      });
    },
    getGolfScore: function() {
      var label, par;
      par = this.score - this.level.par;
      label = '';
      if (this.score === 0) {
        return label = 'Ace!';
      } else if (par <= -3) {
        return label = 'Albatross!';
      } else if (par === -2) {
        return label = 'Eagle!';
      } else if (par === -1) {
        return label = 'Birdie';
      } else if (par === 0) {
        return label = 'Par';
      } else if (par === 1) {
        return label = "Bogey";
      } else if (par === 2) {
        return label = "Double Bogey";
      } else if (par === 3) {
        return label = "Tripple Bogey";
      } else if (par > 3) {
        return label = this.score + " over par";
      }
    },
    updateScore: function() {
      if (this.gameMode === 'play') {
        return this.$score.text("Faults: " + this.score);
      }
    },
    eWin: function() {
      this.dragMode = null;
      if (!this.mute) {
        this.assets.win.play();
      }
      this.$win.text(this.getGolfScore());
      this.$win.show();
      return localStorage[this.title] = true;
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
    }
  };

}).call(this);
