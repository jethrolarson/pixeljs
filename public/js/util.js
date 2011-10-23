(function() {
  var Audio, limit, _;
  if (Function.bind == null) {
    Function.prototype.bind = function(fn, context) {
      context || (context = this);
      return function() {
        return fn.apply(context, arguments);
      };
    };
  }
  String.prototype.replaceAt = function(index, char) {
    return this.substr(0, index) + char + this.substr(index + char.length);
  };
  window.multiplyString = function(str, times) {
    var i, s;
    s = '';
    for (i = 0; 0 <= times ? i < times : i > times; 0 <= times ? i++ : i--) {
      s += str;
    }
    return s;
  };
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
  $.fn.enableContext = function() {
    return this.each(function() {
      return this.oncontextmenu = null;
    });
  };
  Audio = function(url) {
    this.url = url;
    this.audio = document.createElement('audio');
    this.audio.autobuffer = true;
    this.audio.src = url;
    this.audio.load();
    return this;
  };
  Audio.prototype.isLoaded = false;
  Audio.prototype.play = function() {
    try {
      this.audio.currentTime = 0;
    } catch (_e) {}
    return this.audio.play();
  };
  Audio.prototype.stop = function() {
    this.audio.currentTime = 0;
    return this.audio.pause();
  };
  window.Audio = Audio;
  _ = {};
  limit = function(func, wait, debounce) {
    var timeout;
    timeout = void 0;
    return function() {
      var args, context, throttler;
      context = this;
      args = arguments;
      throttler = function() {
        timeout = null;
        return func.apply(context, args);
      };
      if (debounce) {
        clearTimeout(timeout);
      }
      if (debounce || !timeout) {
        return timeout = setTimeout(throttler, wait);
      }
    };
  };
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };
  window._ = _;
}).call(this);
