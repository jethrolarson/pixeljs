// Generated by CoffeeScript 1.3.3
(function() {
  var Layer, Matrix, createArray;

  createArray = function(len, initialValues) {
    var ar, el, _i, _len;
    if (initialValues == null) {
      initialValues = "0";
    }
    ar = new Array(len);
    for (_i = 0, _len = ar.length; _i < _len; _i++) {
      el = ar[_i];
      el = initialValues;
    }
    return ar;
  };

  Matrix = function(x, y, initialValues, defaultValue) {
    var ar2, i, j, _i, _j;
    if (defaultValue == null) {
      defaultValue = "0";
    }
    this.x = x;
    this.y = y;
    this.cols = [];
    for (i = _i = 0; 0 <= x ? _i < x : _i > x; i = 0 <= x ? ++_i : --_i) {
      ar2 = [];
      for (j = _j = 0; 0 <= y ? _j < y : _j > y; j = 0 <= y ? ++_j : --_j) {
        ar2.push(initialValues ? initialValues.shift() : defaultValue);
      }
      this.cols.push(ar2);
    }
    return this;
  };

  Matrix.prototype.getAt = function(x, y) {
    return this.cols[x][y];
  };

  Matrix.prototype.setAt = function(x, y, val) {
    return this.cols[x][y] = val;
  };

  Matrix.prototype.getRow = function(y) {
    var col, row, _i, _len, _ref;
    if (y >= this.y) {
      return null;
    }
    row = [];
    _ref = this.cols;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      col = _ref[_i];
      row.push(col[y]);
    }
    return row;
  };

  Matrix.prototype.getCol = function(x) {
    return this.cols[x];
  };

  Matrix.prototype.addCols = function(num) {
    this.x += num;
    while (num > 0) {
      this.cols.push(createArray(this.y));
      num -= 1;
    }
    return this;
  };

  Matrix.prototype.addRows = function(num) {
    var col, _i, _len, _ref;
    this.y += num;
    while (num > 0) {
      _ref = this.cols;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        col = _ref[_i];
        col.push('0');
      }
      num -= 1;
    }
    return this;
  };

  Matrix.prototype.subtractCols = function(num) {
    this.x -= num;
    return this.cols = this.cols.slice(0, this.x);
  };

  Matrix.prototype.subtractRows = function(num) {
    var col, _i, _len, _ref;
    this.y -= num;
    _ref = this.cols;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      col = _ref[_i];
      col = col.slice(0, this.y);
    }
    return this;
  };

  Layer = function(options) {
    options = $.extend({
      x: 3,
      y: 3,
      game: "000000000",
      fgcolor: "#0000ff",
      visible: true
    }, options);
    this.x = options.x;
    this.y = options.y;
    this.visible = options.visible;
    this.grid = new Matrix(this.x, this.y, options.game.split(''));
    this.mark = new Matrix(this.x, this.y);
    this.paint = new Matrix(this.x, this.y);
    this.fgcolor = options.fgcolor;
    return this;
  };

  Layer.prototype.getRowHints = function() {
    var hints, row, _i, _ref;
    hints = [];
    for (row = _i = 0, _ref = this.y; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
      hints.push(this.getLineHints(this.grid.getRow(row)));
    }
    return hints;
  };

  Layer.prototype.getColHints = function() {
    var hints, i, _i, _ref;
    hints = [];
    for (i = _i = 0, _ref = this.x; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      hints.push(this.getLineHints(this.grid.getCol(i)));
    }
    return hints;
  };

  Layer.prototype.getLineHints = function(row) {
    var cell, hint, hints, i, pushHint, _i, _len;
    hints = [];
    hint = 0;
    pushHint = function(force) {
      if (force == null) {
        force = false;
      }
      if (hint > 0 || force) {
        hints.push(hint);
      }
      return hint = 0;
    };
    for (i = _i = 0, _len = row.length; _i < _len; i = ++_i) {
      cell = row[i];
      if (+cell) {
        hint += 1;
        if (i === row.length - 1) {
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
  };

  window.Level = function(level) {
    return ($.extend({
      init: function() {
        var i, l, _fgcolors, _i, _layers, _len;
        _layers = this.game.split(',');
        this.layers = [];
        _fgcolors = this.fgcolor.split(',');
        for (i = _i = 0, _len = _layers.length; _i < _len; i = ++_i) {
          l = _layers[i];
          this.addLayer(l, _fgcolors[i]);
        }
        this.currentLayerIndex = this.layers.length - 1;
        this.currentLayer = this.layers[this.currentLayerIndex];
        this.layerVisibility = [];
        return this;
      },
      setLayer: function(layerIndex) {
        this.currentLayerIndex = layerIndex;
        return this.currentLayer = this.layers[this.currentLayerIndex];
      },
      addCols: function(num) {
        var layer, _i, _len, _ref;
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer.grid.addCols(num);
          layer.mark.addCols();
          layer.paint.addCols();
        }
        return this.x += num;
      },
      addRows: function(num) {
        var layer, _i, _len, _ref;
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer.grid.addRows(num);
          layer.mark.addRows(num);
          layer.paint.addRows(num);
        }
        return this.y += num;
      },
      subtractCols: function(num) {
        var layer, _i, _len, _ref, _results;
        this.x -= num;
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer.grid.subtractCols(num);
          layer.mark.subtractCols(num);
          _results.push(layer.paint.subtractCols(num));
        }
        return _results;
      },
      subtractRows: function(num) {
        var layer, _i, _len, _ref, _results;
        this.y -= num;
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer.grid.subtractRows(num);
          layer.mark.subtractRows(num);
          _results.push(layer.paint.subtractRows(num));
        }
        return _results;
      },
      addLayer: function(game, fgcolor) {
        if (fgcolor == null) {
          fgcolor = "#0000ff";
        }
        this.layers.push(new Layer({
          x: this.x,
          y: this.y,
          game: game,
          fgcolor: fgcolor
        }));
        return this;
      },
      getLayerColor: function(layerIndex) {
        if (layerIndex == null) {
          layerIndex = this.currentLayerIndex;
        }
        return this.layers[layerIndex].fgcolor;
      },
      setLayerColor: function(color, layerIndex) {
        if (layerIndex == null) {
          layerIndex = this.currentLayerIndex;
        }
        return this.layers[layerIndex].fgcolor = color;
      },
      getLayerVisibility: function(layerIndex) {
        if (layerIndex == null) {
          layerIndex = this.currentLayerIndex;
        }
        return this.layerVisibility[layerIndex] === void 0 || this.layerVisibility[layerIndex];
      },
      setLayerVisibility: function(layerIndex, visibility) {
        return this.layers[layerIndex].visible = !!visibility;
      },
      getLayerColors: function() {
        var ar, l, _i, _len, _ref;
        ar = [];
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          l = _ref[_i];
          ar.push(l.fgcolor);
        }
        return ar;
      },
      getGame: function() {
        var cell, i, l, layers, x, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
        layers = '';
        _ref = this.layers;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          l = _ref[i];
          if (i > 0) {
            layers += ',';
          }
          for (x = _j = 0, _ref1 = this.x; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
            _ref2 = l.grid.getCol(x);
            for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
              cell = _ref2[_k];
              layers += +cell || 0;
            }
          }
        }
        return layers;
      },
      currentLayerIndex: 0,
      title: 'untitled',
      bgcolor: '#ddd',
      fgcolor: '#00f',
      x: 10,
      y: 10,
      game: '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      levelSetName: 'My Levels',
      par: 3
    }, level)).init();
  };

}).call(this);
