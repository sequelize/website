(function(){
  if (location.protocol === 'file:') {
    var elms = document.querySelectorAll('a[href="/v4/./"]');
    for (var i = 0; i < elms.length; i++) {
      elms[i].href = './index.html';
    }
  }
})();
