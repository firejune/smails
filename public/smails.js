/**
 * Smails - Communicator
 * 
 * @author firejune <to@firejune.com>
 * @license MIT Style
 * @url http://firejune.com/1416
 * @version 0.8
 * 
 * @requires 
 *   - lib.js <http://smails.socket.io>
 *   - socket.io.js <http://socket.io>
 */

var Smails = (function($, doc, win){
  var $users = {}
    , $socket = window.socket = io.connect('http://firejune.io:8080')
    , $options = {
      timeout: 100,
      key: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".getRandomString(10),
      title: document.title,
      callback: function() {},
      color: '56789abcdef'.getRandomString(6)
    };

  return function(options) {

    $.extend($options, options);

    // subscribe socket events
    $socket.on('connect', onConnect);
    $socket.on('reconnect', function() {
      console.warn('Smails: Reconnected to the server');
    });
    $socket.on('reconnecting', function () {
      console.warn('Smails: Attempting to re-connect to the server');
    });
    $socket.on('error', function (e) {
      console.error('Smails: ' + (e ? e : 'A unknown error occurred'));
    });

    /*
    <div class="_c">
      <div class="b"><p><span><em><a></a></em></span></p></div>
      <div class="c"><p><span><em><a class="eye"></a></em></span></p></div>
      <div class="d" style="display:none"><em><a></a></em><b> name </b></div>
    </div>
    */
    var css = [
      '._c{position:absolute;width:28px;height:28px;z-index:10;opacity:0.2;filter:alpha(opacity=20)}',
      '._c.same{opacity:0.4;filter:alpha(opacity=40)}',
      '._c:hover,._c.hover{cursor:pointer;opacity:0.8 !important;filter:alpha(opacity=80) !important}',
      '._c.hover .d{display:block !important}',
      //'._c *{margin:0;padding:0;display:block;display:inline}',
      '._c div,._c p,._c span,._c em,._c a{border:2px solid #000;background-color:#ff0;position:absolute}',
      '._c>.b>p,._c>.b>p>span,._c>.b>p>span>em,._c>.b>p>span>em a,._c>.c>p>span{border-style:none solid}',
      '._c>.b{left:10px;top:0;width:4px;height:24px}',
      '._c>.b>p{left:-6px;top:0;width:8px;height:24px;border-width:4px}',
      '._c>.b>p>span{left:-6px;top:2px;width:16px;height:20px}',
      '._c>.b>p>span>em{left:-4px;top:2px;width:20px;height:16px}',
      '._c>.b>p>span>em a{left:-4px;top:4px;width:24px;height:8px}',
      '._c>.c{left:12px;top:12px;border-top:0}',
      '._c>.c>p{left:-2px;top:2px;border-bottom:0}',
      '._c>.c>p>span{top:2px;left:-8px;width:12px;height:2px}',
      '._c>.c>p>span>em{top:2px;left:0;width:12px;border-style:solid none none none}',
      '._c .eye{left:-2px;top:-12px;width:12px;height:4px;border-top:0;border-bottom:0}',
      '._c>.d{display:none;top:36px;color:#666;font-size:12px;white-space:nowrap;padding:5px;border-radius:3px}',
      '._c>.d,._c>.d b{background:#fff !important}',
      '._c>.d,._c>.d>em,._c>.d>em a{border:2px solid #ccc;position:absolute}',
      '._c>.d>em,._c>.d>em a{top:-6px;height:4px;border-style:none none none solid}',
      '._c>.d>em a{top:2px;left:0;height:2px}',
      '._c>.d form ._b{vertical-align:middle}',
      '._c>.d form ._t {border:1px solid #888;border-radius:3px}'
    ].join('');
  
    // this is required in CSS spec!
    var style = document.createElement('style');
    style.type = 'text/css';
    style.media = 'screen, projection';
    // must insert into DOM before setting cssText
    document.getElementsByTagName('head')[0].appendChild(style);
    if (style.styleSheet) style.styleSheet.cssText = css; // IE
    else style.appendChild(document.createTextNode(css)); // w3c
  };

  // subscribes
  function onConnect() {

    join(function (connected) {
      onJoin.ed = false;

      if (connected && !onConnect.ed) {
        $socket.on('message', function(action, id, data) {
          ({'join': onJoin, 'move': onMove, 'idle': onIdle,
            'chat': onChat, 'leave': onLeave
          })[action](id, data);
        });

        $(doc).mousemove(move);
        $(doc).click(close);
        $(win).bind('unload', destroy);

        new Notifier(32000, function(dist, event) {
          $socket.emit('message', {action: 'idle', data: false});
        }, function(dist, event) {
          $socket.emit('message', {action: 'idle', data: true});
        });

        onConnect.ed = true;
        console.info('Smails: Connected  ',  $options.key);
      } else console.warn('Smails: Already ', onConnect.ed ? 'event observed' : 'key in used');
    });
  }

  function onJoin(key, users) {

    $users = users;
    var count = 0;
    var idled = 0;
    for (key in users) {
      var user = users[key];
      if (user.idle) idled++;
      count++;
      if (!user || user.key == $options.key || $('_' + user.key)) continue;
      var ghost = $('<div>', {
        id: '_' + user.key, //title: 'dblcklck to go',
        'class': '_c' + (document.title.split(' - ')[0] == user.title ? ' same' : '')
      }).html([
        '<div class="b"><p><span><em><a></a></em></span></p></div>',
        '<div class="c"><p><span><em><a class="eye"></a></em></span></p></div>',
        '<div class="d" style="display:none"><em><a></a></em><b>' + user.title + '</b></div>'
      ].join('')).bind('dblclick', function() {
        location.href = user.link; 
      }).click(chat).appendTo(doc);

      if (user.color.length < 3) {
        console.warn('worn color value: ', user.color);
        user.color = 'yellow';
      }
      ghost.find('*').each(function() {
        this.css('background-color') && this.css({backgroundColor: '#' + user.color});
      });

      ghost.hide();
      user.event && !user.idle && onMove(user.key, user.event, true);
      onJoin.user = user;
    }

    console.info('Smails - onJoin: ' + idled + '/' + count + ' users', onJoin.ed ? onJoin.user : users);
    onJoin.ed = true;
  }

  function onMove(key, event, teleport) {

    var ghost = $('_' + key);
    if (!ghost || ghost.freeze) return;
    !ghost.visible() && ghost.appear({duration: 0.5, to: 0.2});

    var s = Position.getPageSize(), st = document.getScrollTop();
    var x = event.x + ((s.window.width - event.w) / 2 - 14), y = event.y - 14;

    // recovery
    if (s.window.width < x + 56) x = s.window.width - 56;
    else if (x < 0) x = 0;
    if (s.page.height < y + 56) y = s.page.height - 56;

    // has message
    if (ghost.down('.d').visible()) {
      if (x == 0) x = ghost.offsetLeft;
      if (ghost.offsetTop > st + s.window.height) y = st + s.window.height - 56;
      else if (ghost.offsetTop < st) y = st + 28;
    };

    if (ghost.offsetLeft == x && ghost.offsetTop == y) return;
    ghost.movie && ghost.movie.state == 'running' && ghost.movie.cancel();
    ghost.movie = new Effect.Morph(ghost, {
      duration: teleport ? 0 : 0.3, style: {
        left: x + 'px', top: y + 'px'
      }, afterFinish: function() {
        fix(ghost);
      }
    });

    $options.callback(event);
  }

  function onChat(key, messages) {
    console.info('Smails - onChat: ', key, messages);

    var ghost = $('_' + key);
    if (!ghost) return console.warn('Smails - onChat: We lost some messages:', messages);

    if (messages.text && (messages.to == $options.key || messages.toAll)) {
      ghost.addClassName('hover').down('b').update(messages.text);
      fix(ghost).timer && clearTimeout(ghost.timer);
      ghost.timer = setTimeout(function() {
        if (!ghost) return;
        ghost.timer = 0;
        hide(ghost) && ghost.down('b').update($users[key].title);
      }, 5000);
    };
  }

  function onIdle(key, state) {
    console.log('Smails - onIdle: ', key, state);

    var ghost = $('_' + key);
    if (!ghost) return;
    if (!state) ghost.appear({duration: 0.3, to: 0.2});
    else ghost.fade({duration: 0.3, afterFinish: ghost.hide.bind(ghost)});
  }

  function onLeave(key) {
    console.log('Smails - onLeave: ', key);

    delete $users[key];

    var ghost = $('_' + key);
    if (!ghost) return;
    ghost.movie && ghost.movie.state == 'running' && ghost.movie.cancel();
    ghost.fade({duration: 0.3, afterFinish: ghost.remove.bind(ghost)});
  }

  // actions
  function join(callback) {
    $socket.emit('message', {
      action: 'join', data: {
        title: $options.title, link: location.href,
        key: $options.key, color: $options.color
      }
    }, callback);
  }

  function chat(event) {
    var el = get(event);
    if (!el || el.down('form')) return;
    el.addClassName('hover').down('b').update(new Element('form', {
      method: 'get', action: '.'
    }).observe('submit', function(event) {
      var form = event.element();
      console.log('send chat', form.serialize().toQueryParams());
      $socket.emit('message', {
        action: 'chat', data: form.serialize().toQueryParams()
      }, function(set) {
        form.update(set ? 'Succed!' : 'Faild!');
        setTimeout(function(){
          remove(form);
        }, 1000);
      });
      event.stop();
    }).update([
      '<input type="hidden" name="to" value="' + el.id.substr(1) + '"/>',
      '<input class="_b" type="checkbox" name="toAll" title="to all"/>',
      '<input class="_t" type="text" name="text" size="16"/>'
    ].join('\n'))).down('input[type=text]').focus();

    var chkbox = el.down('input[type=checkbox]');
    chkbox.checked = chat.checked;
    chkbox.observe('click', function() {
      chat.checked = chkbox.checked;
    });

    fix(el);
  }

  function move(event) {
    var el = get(event)
      , now = new Date().getTime();

    if (el) {
      el.movie && el.movie.state == 'running' && el.movie.cancel();
      el.freeze = true;
      if (!el.hasClassName('hover')) {
        fix(el.addClassName('hover'));
      }
    } else hide();

    if (!move.timer || now - move.timer > $options.timeout) {
      $socket.emit('message', {action: 'move', data: {
        x: event.pointerX(), y: event.pointerY(), w: window.getWidth()
      }});
      if (!move.cart ||now - move.cart > $options.timeout * 10) {
        move.cart = now;
      }
      move.timer = now;
    }
  }

  function get(event) {
    var el = event.element(), up;
    if ( el.hasClassName && el.up
      && (el.hasClassName('_c') || (up = el.up('._c')))) {
      if (up) el = up;
      return el;
    } else return null;
  }

  function fix(el) {
    var d = el.down('.d'), w = window.getWidth(), x;
    x = w < (x = d.cumulativeOffset().left + d.offsetWidth + 4)? // && d.visible()
      {d: - (x - w + 8), em: x - w + 18} : {d: 6, em: 6};
    d.setStyle({left: x.d + 'px'}).down('em').setStyle({left: x.em + 'px'});
    return Prototype.Browser.IE? el.setStyle({
      width: el.scrollWidth + 'px', height: el.scrollHeight + 'px'
    }) : el;
  }

  function close(event) {
    !get(event) && $$('._c').each(function(ghost) {
      var form = ghost.down('form');
      form && remove(form);
    });
  }

  function remove(form) {
    var id = form.up('._c').id
      , user = id && $users[id.substr(1)];

    if (!user) return;
    form.replace(user.title);
    hide();
  }

  function hide(el) {
    var _hide = function(ghost) {
      ghost.freeze = false;
      return (ghost.down('form') || ghost.timer)? false : fix(ghost.removeClassName('hover'));
    };

    if (el) return _hide(el);
    $$('._c').each(_hide);
  }

  function destroy() {
    Event.stopObserving(document, 'mousemove', move);
    Event.stopObserving(document, 'click', close);
  }

})(jQuery, document, window);