
  window.Level = function(level) {
    level.layers = level.game.split(',');
    level.currentLayer = level.layers.length - 1;
    return $.extend({
      getRow: function(y) {
        return this.layers[this.currentLayer].slice(this.x * y, (this.x * y + this.x));
      },
      getCol: function(x) {
        var ar, i, _ref;
        ar = [];
        for (i = 0, _ref = this.y; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          ar.push(this.layers[this.currentLayer][i * this.x + x]);
        }
        return ar;
      },
      getRowHints: function() {
        var hints, row, _ref;
        hints = [];
        for (row = 0, _ref = this.y; 0 <= _ref ? row < _ref : row > _ref; 0 <= _ref ? row++ : row--) {
          hints.push(this.getLineHints(this.getRow(row)));
        }
        return hints;
      },
      getColHints: function() {
        var hints, i, _ref;
        hints = [];
        for (i = 0, _ref = this.x; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          hints.push(this.getLineHints(this.getCol(i)));
        }
        return hints;
      },
      getLineHints: function(row) {
        var cell, hint, hints, i, pushHint, _len;
        hints = [];
        hint = 0;
        pushHint = function(force) {
          force || (force = false);
          if (hint > 0 || force) hints.push(hint);
          return hint = 0;
        };
        for (i = 0, _len = row.length; i < _len; i++) {
          cell = row[i];
          if (+cell) {
            hint += 1;
            if (i === row.length - 1) pushHint();
          } else {
            pushHint();
          }
        }
        if (hints.length === 0) pushHint(true);
        return hints;
      },
      getAt: function(x, y, layerIndex) {
        if (layerIndex == null) layerIndex = this.currentLayer;
        return +this.layers[layerIndex][(this.x * y) + x];
      },
      addCols: function(num) {
        var i, j, layer, newLayer, _len, _ref, _ref2;
        _ref = this.layers;
        for (j = 0, _len = _ref.length; j < _len; j++) {
          layer = _ref[j];
          newLayer = '';
          for (i = 0, _ref2 = this.y; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
            newLayer += layer.substring(this.x * i, this.x * (i + 1)) + String.times('0', num);
          }
          this.layers[j] = newLayer;
        }
        return this.x += num;
      },
      addRows: function(num) {
        var layer, _i, _len, _ref;
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer += String.times('0', this.x * num);
        }
        return this.y += num;
      },
      subtractCols: function(num) {
        var i, j, layer, newGame, _len, _ref, _ref2;
        _ref = this.layers;
        for (j = 0, _len = _ref.length; j < _len; j++) {
          layer = _ref[j];
          newGame = '';
          for (i = 0, _ref2 = this.x; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
            newGame += layer.substring(this.x * i, (this.x * (i + 1)) - num);
          }
          this.layers[j] = newGame;
        }
        return this.x -= num;
      },
      subtractRows: function(num) {
        return this.y -= num;
      },
      updateCell: function(i, v, layerIndex) {
        if (layerIndex == null) layerIndex = this.currentLayer;
        return this.layers[layerIndex] = this.layers[layerIndex].replaceAt(i, v);
      },
      addLayer: function() {
        return this.layers.push(String.times('0', this.x * this.y));
      },
      getLayerColor: function(layerIndex) {
        if (layerIndex == null) layerIndex = this.currentLayer;
        return this.fgcolor.split(',')[layerIndex];
      },
      setLayerColor: function(color, layerIndex) {
        var colors;
        if (layerIndex == null) layerIndex = this.currentLayer;
        colors = this.fgcolor.split(',');
        colors[layerIndex] = color;
        return this.fgcolor = colors.join(',');
      },
      getGame: function() {
        return this.layers.join(',');
      },
      currentLayer: 0,
      title: 'untitled',
      bgcolor: '#ddd',
      fgcolor: '#00f',
      x: 10,
      y: 10,
      game: '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      levelSetName: 'My Levels',
      par: 3
    }, level);
  };
