import gup from './lib/gup';
import ajax from './lib/ajax';
import Store from 'store';

/**
 * Batch
 */

//== Logs all Batch.log|warn|error to console instead of sending to server
let debug = gup('debug');


let Batch = (function(win, doc, body){

    let Batch = {};

    /*===================================
    =            Private API            =
    ===================================*/

    //https://www.npmjs.com/package/stacktrace-js
    //https://www.npmjs.com/package/stacktrace-parser

    Batch._stackTrace = function(e) {
      return {
        col: e.colno,        
        file: e.filename,
        line: e.lineno,
        msg: e.message,
      }
    };

    /**
     * Sends error string to server
     * @param  {string} str
     * @return {void}
     */
    Batch._send = function(options){
      let user = Store.get('Batch');
      ajax.post('logs', {
        id: user.id,
        msg: options.msg,
        type: options.type, 
        url: window.location.href,
        stacktrace: options.stacktrace
      })
      .then(data => {
        console.log('worked', data);
      })
      .catch(err => {
        console.log(err);
      });
    };

    Batch._windowError = function(err){
      let stacktrace = this._stackTrace(err);
      this._send({
        type: 'windowError',
        msg: err.message, // @todo: get this val
        stacktrace
      })
    }


    /*==================================
    =            Public API            =
    ==================================*/
    Batch.user = {};
    Batch.error = function(msg){
      this._send({
        type: 'error',
        msg
      });
    };

    Batch.warn = function(msg){
      this._send({
        type: 'warn',
        msg
      })
    };

    Batch.log = function(msg){
      this._send({
        type: 'log',
        msg
      })
    };

    return Batch;
})(window, document, document.body);


/**
 * Native hooks
 */

 window.addEventListener('error', function(e){
   Batch._windowError(e);
 });

let log = console.log;
let warn = console.warn;
let error = console.error;

console.log = function(){
    var arr = Array.prototype.slice.call(arguments);
    log.apply(this, arr);
    // if(!debug){
    //   Batch.log(JSON.stringify(arr), 'clog');
    // }
};
console.warn = function(){
    warn.apply(this, Array.prototype.slice.call(arguments));
    // Batch.warn(arguments[0], 'cwarn');
};

console.error = function(){
    error.apply(this, Array.prototype.slice.call(arguments));
    // Batch.error(arguments[0], 'cerror');
};

XMLHttpRequest.prototype.reallySend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
  this.addEventListener('load', function(d, a){
    if (this.status >= 200 && this.status < 400){
      // Batch.log('Batch: ajax request received', this.responseText);
    }
  });
  this.reallySend(body);
};

XMLHttpRequest.prototype.reallyOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(type, url) {
  // Batch.log('Batch: ajax started:', type + ',', 'url:', url);
  this.reallyOpen(type, url);
};







/*============================
=            Init            =
============================*/

// Create/check user
//-----------------------
let user = Store.get('Batch');
if(user && user.id){
  ajax.post('user', {id: user.id})
  .then(function(data){
    if(user.id === data.id){
      Batch.user = data;
      //== Found user, no need to update user.id
      console.log('Existing user');
    }
    else if(data.id){
      Batch.user = data;
      //== Did not find/match in DB, updating
      Store.set('Batch', {id: data.id});
      console.log('Added new user/new id');
    }
    else{
      console.warn('No id returned from server');
    }
  })
  .catch(function(err){
    console.error(err);
  });
}
else{
  ajax.post('user')
  .then(function(data){
    if(data.id){
      Store.set('Batch', {id: data.id});
      console.log('Added new user');
    }
    else{
      console.warn('No id returned from server for new user');
    }
  })
  .catch(function(err){
    console.error(err);
  })
}

// Page view
//-----------------------
let url = window.location.href;
ajax.post('pageviews', {url})
.then(data =>{
  if(data){
    // data saved
  }
})
.catch(e =>{
  console.error('pagview did not save', e);
})

/*=====  End of Init  ======*/



/**
 * Testing
 */
if(gup('clean')){
  Store.remove('Batch');
}

if(gup('error')){
  setTimeout(_ => {
    causeError()
  }, 2000);
}

if(gup('test')){
  function init(){
    Batch.error('asdf');
    Batch.warn('yolo');
    Batch.log('logmeup');
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
