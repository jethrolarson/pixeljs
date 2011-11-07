(function() {
  var AUDIOPATH, Audio, SoundGroup, limit, _;
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
  window.color = {
    hexToRGB: function(hex) {
      return {
        r: parseInt(hex.substr(1, 2), 16),
        g: parseInt(hex.substr(3, 2), 16),
        b: parseInt(hex.substr(5, 2), 16)
      };
    }
  };
  window.levelToDataURL = function(level) {
    var bg, c, ctx, fg, i, idx, imageData, one, size;
    fg = color.hexToRGB(level.fgcolor);
    bg = color.hexToRGB(level.bgcolor);
    c = document.createElement('canvas');
    c.width = level.x;
    c.height = level.y;
    ctx = c.getContext('2d');
    imageData = ctx.createImageData(level.x, level.y);
    size = level.x * level.y;
    for (i = 0; 0 <= size ? i <= size : i >= size; 0 <= size ? i++ : i--) {
      one = +level.game.charAt(i);
      idx = i * 4;
      imageData.data[idx + 0] = one ? fg.r : bg.r;
      imageData.data[idx + 1] = one ? fg.g : bg.g;
      imageData.data[idx + 2] = one ? fg.b : bg.b;
      imageData.data[idx + 3] = 0xff;
    }
    ctx.putImageData(imageData, 0, 0);
    return c.toDataURL();
  };
  window.multiplyString = function(str, times) {
    var i, s;
    s = '';
    for (i = 0; 0 <= times ? i < times : i > times; 0 <= times ? i++ : i--) {
      s += str;
    }
    return s;
  };
  window.$(window).mousedown(function(e) {
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
  AUDIOPATH = '/public/audio/';
  Audio = function(filename) {
    this.filename = filename;
    this.audio = document.createElement('audio');
    this.audio.autobuffer = true;
    this.audio.src = AUDIOPATH + filename;
    this.audio.load();
    this.isPlaying = false;
    return this;
  };
  Audio.prototype.isLoaded = false;
  Audio.prototype.play = function() {
    try {
      this.audio.currentTime = 0;
    } catch (_e) {}
    this.audio.play();
    return this.isPlaying = true;
  };
  Audio.prototype.stop = function() {
    this.audio.currentTime = 0;
    this.isPlaying = false;
    return this.audio.pause();
  };
  window.Audio = Audio;
  SoundGroup = function(filename, channels) {
    var i;
    channels || (channels = 1);
    this.filename = filename;
    this.channels = [];
    for (i = 0; 0 <= channels ? i < channels : i > channels; 0 <= channels ? i++ : i--) {
      this.addChannel();
    }
    return this;
  };
  SoundGroup.prototype.play = function(channel) {
    if (typeof channel !== 'undefined') {
      return this.channels[channel].play();
    } else {
      return this.getNotPlaying().play();
    }
  };
  SoundGroup.prototype.addChannel = function() {
    var newAudio;
    newAudio = new Audio(this.filename);
    this.channels.push(newAudio);
    return newAudio;
  };
  SoundGroup.prototype.stop = function(channel) {
    if (typeof channel !== 'undefined') {
      return this.channels[channel].stop();
    } else {
      return this.getNotPlaying().stop();
    }
  };
  SoundGroup.prototype.getNotPlaying = function() {
    var channel, currentTime, _i, _len, _ref;
    _ref = this.channels;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      channel = _ref[_i];
      if (currentTime = 0 || channel.audio.ended) {
        return channel;
      }
    }
    return this.addChannel();
  };
  window.SoundGroup = SoundGroup;
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
