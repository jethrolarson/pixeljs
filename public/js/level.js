(function() {
  window.Level = function(level) {
    return $.extend({
      getRow: function(y) {
        return this.game.slice(this.x * y, this.x * y + this.x);
      },
      getCol: function(x) {
        var ar, i, _ref;
        ar = [];
        for (i = 0, _ref = this.y; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          ar.push(this.game[i * this.x + x]);
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
          if (hint > 0 || force) {
            hints.push(hint);
          }
          return hint = 0;
        };
        for (i = 0, _len = row.length; i < _len; i++) {
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
      },
      getAt: function(x, y) {
        return +this.game[(this.x * y) + x];
      },
      addCols: function(num) {
        var i, newGame, _ref;
        newGame = '';
        for (i = 0, _ref = this.x; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          newGame += this.game.substring(this.x * i, this.x * (i + 1)) + multiplyString('0', num);
        }
        this.game = newGame;
        return this.x += num;
      },
      addRows: function(num) {
        this.game += multiplyString('0', this.x * num);
        return this.y += num;
      },
      subtractCols: function(num) {
        var i, newGame, _ref;
        newGame = '';
        for (i = 0, _ref = this.x; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          newGame += this.game.substring(this.x * i, (this.x * (i + 1)) - num);
        }
        this.x -= num;
        return this.game = newGame;
      },
      subtractRows: function(num) {
        this.y -= num;
        return this.game = this.game.substring(0, this.x * this.y);
      },
      updateCell: function(i, v) {
        return this.game = this.game.replaceAt(i, v);
      },
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
}).call(this);
