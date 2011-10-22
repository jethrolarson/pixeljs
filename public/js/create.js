(function() {
  $(function() {
    var $picker, FARBTASTIC_WIDTH, fb, game;
    game = Game.init($('#game'));
    Game.edit();
    $('form').submit(function() {
      var gamebits;
      gamebits = '';
      $('#grid li').each(function() {
        return gamebits += $(this).hasClass('paint') ? '1' : '0';
      });
      return this.game.value = gamebits;
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
    });
    return $('.slider').change(function() {
      if (this.name === 'cols') {
        return game.updateCols(this.value);
      } else {
        return game.updateRows(this.value);
      }
    }).each(function() {
      var $slider, $that, that;
      that = this;
      $that = $(this);
      $slider = $('<div class="sliderWidget"/>').insertAfter(this);
      return $slider.slider({
        step: 1,
        value: that.value,
        min: 1,
        max: 32,
        slide: function(e, ui) {
          that.value = ui.value;
          return $that.change();
        }
      });
    });
  });
}).call(this);
