// Generated by CoffeeScript 1.3.3
(function() {

  $(function() {
    Game.init($('#game'));
    Game.edit();
    $('form').submit(function() {
      $('#fgcolor').val(Game.level.getLayerColors());
      $('#gametxt').val(Game.level.getGame());
      return true;
    });
    $('#x').change(function() {
      return Game.updateCols(this.value);
    });
    $('#y').change(function() {
      return Game.updateRows(this.value);
    });
    $('#addLayer').live('click', function() {
      return Game.addLayer();
    });
    return $('input[type=color]').live({
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
    /*
    	FARBTASTIC_WIDTH = 195
    	$('<div id="picker"></div>').appendTo 'body'
    	$picker = $('#picker').hide()
    	fb = $.farbtastic('#picker')
    */

  });

}).call(this);
