(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $(function() {
    var $picker, FARBTASTIC_WIDTH, fb;
    Game.init($('#game'));
    Game.edit();
    $('form').submit(function() {
      return this.game.value = Game.level.game;
    });
    FARBTASTIC_WIDTH = 195;
    $('<div id="picker"></div>').appendTo('body');
    $picker = $('#picker').hide();
    fb = $.farbtastic('#picker');
    $('input[type=color]').focus(function() {
      var pos;
      fb.linkTo(this);
      pos = $(this).offset();
      return $picker.css({
        top: pos.top - (FARBTASTIC_WIDTH / 2) + 8,
        left: pos.left + $(this).outerWidth()
      }).show();
    }).blur(function() {
      return $picker.hide();
    }).change(function() {
      if (this.name === 'fgcolor') {
        Game.level.fgcolor = this.value;
      } else {
        Game.level.bgcolor = this.value;
      }
      return Game.renderLevel();
    });
    $('#x').appendTo('#colHints').each(function() {
      return $('<div class="sliderWidget" id="xSlider"/>').insertBefore(this).slider({
        step: 1,
        value: this.value,
        min: 1,
        max: 32,
        slide: __bind(function(e, ui) {
          this.value = ui.value;
          return Game.updateCols(this.value);
        }, this)
      });
    });
    return $('#y').appendTo('#rowHints').each(function() {
      var max;
      max = 32;
      return $('<div class="sliderWidget" id="ySlider" style="height:400px"/>').insertBefore(this).slider({
        orientation: 'vertical',
        step: 1,
        value: max - this.value,
        min: 1,
        max: max,
        height: 400,
        slide: __bind(function(e, ui) {
          this.value = max - ui.value;
          return Game.updateRows(this.value);
        }, this)
      });
    });
  });
}).call(this);
