(function() {
  if (Function.bind == null) {
    Function.prototype.bind = function(fn, context) {
      context || (context = this);
      return function() {
        return fn.apply(context, arguments);
      };
    };
  }
  $(window).mousedown(function(e) {
    var target;
    target = $(e.target);
    if (e.which === 1) {
      target.trigger('leftdown');
    } else if (e.which === 2) {
      target.trigger('middledown');
    } else if (e.which === 3) {
      target.trigger('rightdown');
    }
    return true;
  });
  $.fn.rightdown = function(handler, disableContext) {
    if (disableContext) {
      this.disableContext;
    }
    return this.bind('rightdown', handler);
  };
  $.fn.disableContext = function() {
    return this.each(function() {
      return this.oncontextmenu = function() {
        return false;
      };
    });
  };
}).call(this);
