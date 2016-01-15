import $ from 'jquery';

/**
 * Batch
 */
let Batch = (function(win, doc, body){
    let Batch = {
      url: "//batchjs",
      debug: true,
      console: true
    };

    Batch.prod || (Batch.prod = Batch.prod || !Batch.debug);
    Batch.debug || (Batch.debug = !Batch.prod);

    /*===================================
    =            Private API            =
    ===================================*/
    Batch._checkArgs = function(args, type){
      if(args.length === 0){
        console.warn(`BatchJS: No arguments were given to Batch.${type}()`);
        return {
          _sendError: function(){}
        }
      }
      return this;
    };

    Batch._stackTrace = function(e) {
        var err = new Error(e);
        if(err.stack){
          var str = err.stack.replace(/\n/, '')
          // .replace(/.*/, '')
          // .replace(/\n/, '')
          // .replace(/^\s*at\s/gm, '')

          console.log(str);
        }
        else{
          return "no stacktrace found";
        }
    }

    /**
     * Generates error string for Window Error
     * @param  {object} err {type, line}
     * @return {string}     query string
     */
    Batch._generateWindowErrorString = function(e){
      let str = this.url + '?';
      str += 'type=' + e.type;
      str += '&col=' + e.colno;
      str += '&line=' + e.lineno;
      str += "&filename=" + e.filename;
      str += "&target=" + e.currentTarget;
      str += "&details=" + e.error;
      return str;
    }

    /**
     * Sends error string to server
     * @param  {string} str
     * @return {void}
     */
    Batch._sendError = function(args, type, parse){
      let script = document.createElement('script');
      var str = "";
      if(typeof type === "boolean"){
        parse = type;
      }

      if(typeof args === "object" && args.length === undefined){
        str = JSON.stringify(str);
      }
      else{
        str = args;
      }

      if(parse){
        str = this.url + `?${type}=` + args;
      }

      if(this.prod){
        script.src = str;
        body.appendChild(script);
        body.removeChild(script);        
      }
      else{
        console.batchLog(str);
      }
    };

    Batch._track = function(str, type){
      this._sendError(str, type, true);
    }

    /*==================================
    =            Public API            =
    ==================================*/
    Batch.windowError = function(e){
      let str = this._generateWindowErrorString(e);
      this._sendError(str);
    }

    Batch.error = function(str){
      this
      ._checkArgs(arguments, 'error')
      ._sendError(str, 'error', true);
    };

    Batch.warn = function(str){
      this
      ._checkArgs(arguments, 'warn')
      ._sendError(str, 'warn', true);
    };

    Batch.log = function(str){
      this
      ._checkArgs(arguments, 'log')
      ._sendError(str, 'log', true)
    };

    return Batch;
})(window, document, document.body);




/**
 * Native hooks
 */
if(window.console && Batch.console){
  let log = console.log;
  let warn = console.warn;
  let error = console.error;

  console.batchLog = function(){
    log.apply(this, Array.prototype.slice.call(arguments));
  };

  console.log = function(){
    var arr = Array.prototype.slice.call(arguments);
    log.apply(this, arr);
    Batch._track(JSON.stringify(arr), 'clog');
  };
  console.warn = function(){
    warn.apply(this, Array.prototype.slice.call(arguments));
    Batch._track(arguments[0], 'cwarn');
  };
  console.error = function(){
    error.apply(this, Array.prototype.slice.call(arguments));
    Batch._track(arguments[0], 'cerror');
  };
}


XMLHttpRequest.prototype.reallySend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
  if(Batch.console){
      console.batchLog('BatchJS: ajax request sent');
  }
  this.addEventListener('load', function(d, a){
    if (this.status >= 200 && this.status < 400){
      // @todo: track this ajax request
    }
  });
  this.reallySend(body);
};

XMLHttpRequest.prototype.reallyOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(type, url) {
  if(Batch.console){
      console.batchLog('BatchJS: ajax started:', type + ',', 'url:', url);
  }
  this.reallyOpen(type, url);
};








/**
 * Testing
 */
function gup(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  if(match){
      var result = decodeURIComponent(match[1].replace(/\+/g, ' ')).toLowerCase();
      return result === "true" || result === "false" ? /^true$/i.test(result) : result;
  }
}

function ajaxCall(api, data){
  $.ajax({
      type: 'POST',
      url: '//localhost:8001/api/' + api,
      data: data,
      dataType: 'json',
      success: function(res, text, jqXHR) {
          console.log(res);
      },
      error: function (res, text, errorThrown) {
        // console.log(errorThrown);
        console.log('POST failed');
        console.log(res);
      }
  });
}


if(gup('ajax') === 'create'){
  ajaxCall('create', {
    "name": "bro",
    "msg" : "yolo"
  });
}

if(gup('ajax') === 'read'){
  ajaxCall('read', {
  });
}

if(gup('ajax') === 'update'){
  ajaxCall('update', {
    id: '568ad159e40f2a96173af5d5',
    update:{
      "name": "heyyy"
    }
  });
}

if(gup('ajax') === 'delete'){
  ajaxCall('delete', {
  });
}



if(gup('remove')){
  $.ajax({
    type: 'POST',
    url: '//localhost:8001/api/delete',
    success: function(res, text, jqXHR) {
        console.log(res);
    },
    error: function (res, text, errorThrown) {
      // console.log(errorThrown);
      console.log('POST failed');
      console.log(res);
    }
  })
}


if(gup('geo')){
  $.getJSON("http://freegeoip.net/json/", function(data) {
    console.log(data);
  });
}

if(gup('mongo')){
  $.getJSON('//localhost:8001/people', function(data){
    console.log(data);
  });
}

if(gup('test')){
  window.addEventListener('error', function(e){
    Batch.windowError(e);
  });
  function init(){
    Batch.error('asdf');
    Batch.warn('yolo');
    Batch.log('logmeup');
    console.log('testlog');
    console.warn('testwarn');
    console.error('testerror');
    var req = new XMLHttpRequest();
    req.open("GET", "notfound.html");
    req.send(null);
  }
  function causeError(){
    is_not_defined;
  }
  init();
  causeError();
}

export default Batch;
