
  $(function() {
    var $picker, $x, $y, FARBTASTIC_WIDTH, fb, max;
    var _this = this;
    Game.init($('#game'));
    Game.edit();
    $('form').submit(function() {
      $('#gametxt').val(Game.level.getGame());
      return true;
    });
    FARBTASTIC_WIDTH = 195;
    $('<div id="picker"></div>').appendTo('body');
    $picker = $('#picker').hide();
    fb = $.farbtastic('#picker');
    $('input[type=color]').live({
      focus: function() {
        var pos;
        fb.linkTo(this);
        pos = $(this).position();
        return $picker.css({
          top: pos.top - (FARBTASTIC_WIDTH / 2) + 8,
          left: pos.left - FARBTASTIC_WIDTH
        }).show();
      },
      blur: function() {
        return $picker.hide();
      },
      change: function() {
        var layerRE;
        if (this.name === 'bgcolor') {
          Game.level.bgcolor = this.value;
        } else {
          layerRE = /fgcolor(\d)/.exec(this.name);
          if (layerRE && layerRE.length) {
            Game.level.setLayerColor(this.value, +layerRE[1]);
            $('#fgcolor').val(Game.level.fgcolor);
          }
        }
        return _.debounce(Game.renderLevel(), 200);
      }
    });
    $x = $('#x').appendTo('#colHints');
    $('<div class="sliderWidget" id="xSlider"/>').insertBefore($x).slider({
      step: 1,
      value: $x.val(),
      min: 1,
      max: 32,
      slide: function(e, ui) {
        $x.val(ui.value);
        return Game.updateCols($x.val());
      }
    });
    $y = $('#y').appendTo('#rowHints');
    max = 32;
    $('<div class="sliderWidget" style="height:532px"/>').insertBefore($y).slider({
      orientation: 'vertical',
      step: 1,
      value: max - $y.val(),
      min: 1,
      max: max,
      height: 532,
      slide: function(e, ui) {
        $y.val(max - ui.value);
        return Game.updateRows($y.val());
      }
    });
    $('#addLayer').live('click', function() {
      return Game.addLayer();
    });
    return $('.changeLayer').live('click', function(e) {
      $('.changeLayer').removeClass('on');
      return $(this).addClass('on');
    });
  });
