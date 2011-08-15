
String.prototype.getRandomString = function(stringLength) {
  var randomString = '';
  for (var i = 0; i < stringLength; i++) {
    var rand = Math.floor(Math.random() * this.length);
    randomString += this.substring(rand, rand + 1);
  }
  return randomString;
};

/**
 * Returns window width or height and Scroll width or height
 */
Object.extend(Position, {
  getPageSize: function() {
    var doc = window.scrollMaxX ?
      {w: window.innerWidth  + window.scrollMaxX, h: window.innerHeight + window.scrollMaxY} :
      {w: document.body.scrollWidth, h: document.body.scrollHeight};

    var win = self.innerHeight ? 
      {w: self.innerWidth, h: self.innerHeight} : // IE
      document.documentElement && document.documentElement.clientHeight ?
        {w: document.documentElement.clientWidth, h: document.documentElement.clientHeight} : {w: 0, h: 0};

    // for small pages with total size less then size of the viewport
    doc = {w: Math.max(win.w, doc.w), h: Math.max(win.h, doc.h)};

    return { page: { width: doc.w, height: doc.h }, window: { width: win.w, height: win.h } };
  }
});

/**
 * Orginal: http://yura.thinkweb2.com/playground/state-notifier/
 * prototype extension by "kangax" thinkweb2.com
 */
var Notifier = Class.create({
  initialize: function(time, onActive, onIdle) {
    this.time = time || 32000;
    this.onIdle = onIdle || Prototype.emtpyFunction;
    this.onActive = onActive || Prototype.emtpyFunction;
    this.initObservers();
    this.setTimer();
  },
  _events: [
    [window, 'scroll'],
    [window, 'resize'],
    [document, 'mousemove'],
    [document, 'keydown'],
    [document, 'click']
  ],
  _timer: null,
  _idleTime: null,
  initObservers: function() {
    this._events.each(function(e) {
      Event.observe(e[0], e[1], this.onInterrupt.bind(this));
    }.bind(this))
  },
  onInterrupt: function(e) {
    var dist = new Date() - this._idleTime;
    if (dist > this.time) this.onActive(dist, e);
    this.setTimer();
  },
  setTimer: function() {
    clearTimeout(this._timer);
    this._idleTime = new Date();
    this._timer = setTimeout(this.onIdle, this.time);
  }
});