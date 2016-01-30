import $ from 'jquery';


//-- Defaults
var api = '//localhost:8001/api/';
let options = {
  type: 'GET',
  // dataType: 'json',
  success: function(res, text, jqXHR) {
      // console.log(res);
  },
  error: function (res, text, errorThrown) {
    // console.log(errorThrown);
    console.log('Request failed');
    console.log(res);
  }
};

let ajaxCall = function(url){
  options.url = api + url;
  return $.ajax(options);
};

let ajax = {
  get: function(url){
    return ajaxCall(url);
  },
  post: function(url, data){
    options.data = data || "";
    options.type = "POST";

    return ajaxCall(url);
  }
};

export default ajax;