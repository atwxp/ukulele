;(function($) {
  $.fn.player = function (playList, options) {
    var params = $.extend({}, $.fn.player.defaults, options);
    var self = this.get(0),
        count = 0;
        len = $.isArray(playList) ? playList.length : 0;
    
    var cssSelector = {
      wrap: ".playerContainer",
      loading: "loading",
      
      singer: ".singer",
      mode: ".mode",
      single: ".single",
      queue: ".queue",
      random: ".random",
      
      time_total: ".time_tip .total",
      time_used: ".time_tip .used",
      play_total_bar: ".play_time .total_bar",
      play_load_bar: ".play_time .load_bar",
      play_progress_bar: ".play_time .progress_bar",
      
      prev: ".prev",
      next: ".next",
      play: ".on,.pause",
      muted: "muted",
      volume_total: ".volume .total_bar",
      volume_progress_bar: ".volume .progress_bar",
      volume_icon: ".volume_icon",

      dictionary: ".dictionary",
      songList: ".songs_list",
      playing: "active",
      cur: "cur"
    };

    function playStatus(){
      $(cssSelector.play).addClass("on").removeClass("pause");
    }

    function pauseStatus(){
      $(cssSelector.play).addClass("pause").removeClass("on");
    }
    
    function autoPlay(){
      if(params.autoplay){
        $(".songs_list").find("li:first-child").trigger("click");
      }
    }

    function addLoading () {
      $("#" + cssSelector.loading).addClass(cssSelector.loading);
    }
    function removeLoading () {
      $("#" + cssSelector.loading).removeClass(cssSelector.loading);
    }

    // 返回歌曲信息
    function trackSong(){

      // 更新歌曲列表
      var songs = $(cssSelector.songList).find("li").removeClass(cssSelector.playing).eq(count).addClass(cssSelector.playing)
                  .end(),
          link;
     
      if( len != songs.length ) {
        len = songs.length;
      }
      
      count = $.fn.player.util.checkCount(count,len);
      link = songs.eq(count).find("a")[0];
      
      return {
        title: link.title != "undefined" ? link.title : "无标题",
        url: link.href
      }
    }

    // 切换歌曲
    function switchSong(){
      var cur_song = trackSong();
      
      self.pause();
      self.src = cur_song.url;
      self.load();
      self.play();
    }

    function endedMode(){
      var self = this;
      if( $( cssSelector.single ).hasClass( cssSelector.cur ) ){
        self.loop = true;
      }
      else if( $(cssSelector.queue).hasClass( cssSelector.cur ) ){
        self.loop = false;
        count++;
      }
      else if( $(cssSelector.random).hasClass( cssSelector.cur ) ){
        self.loop = false;
        count = Math.floor(Math.random() * len);
      }
      
      switchSong();
    }
    
    // 加载元信息
    function loadedMetaData(){
      var title = trackSong().title;
      var duration = $.fn.player.util.formatTime(this.duration);
      
      $(cssSelector.time_total).text(duration);
      $(cssSelector.singer).text(title).attr("title",title);
    }
    
    function setUsed(){
      $(cssSelector.time_used).text($.fn.player.util.formatTime(self.currentTime));
    }

    function setCurTime(value){
      self.currentTime = value * self.duration;
      setUsed();
    }


    function togglePlay(){
      self.paused ? self.play() : self.pause();
    }

    function toggleMuted(){
      self.muted = !self.muted;
    }
      
    // 更新时间轴
    function timeBar () {
      var self = this;
      var percent = self.currentTime / self.duration;

      setUsed();
      $.fn.player.util.progress(cssSelector.play_progress_bar,percent,0);
    }

    // 更新进度条
    function loadBar () {
      var self = this;

      if(self.buffered.length === 1){
        if(self.buffered.start(0) === 0){
          var buffered = self.buffered.end(0);
          $.fn.player.util.progress(cssSelector.play_load_bar,buffered / self.duration,0);
        }
      }
    }

    function setVolume(volume){
      $(cssSelector.volume_icon).data("volume",volume);
      self.volume = volume;
      $.fn.player.util.progress( cssSelector.volume_progress_bar,volume,400 );
      
      // 静音下，点击音量bar，取消静音
      if(self.muted){
        $(cssSelector.volume_icon).trigger("click");
      }
    }
      
    var interfaceWrap = function () {
      // + 构建播放器界面
      var markup = "<div class='playerContainer'><div id='loading'></div><div class='player'><div class='song_info'><div class='play_mode'><span class='mode random' data-icon='r' title='随机播放'></span><span class='mode queue' data-icon='q' title='顺序播放'></span><span class='mode single' data-icon='s' title='单曲循环'></span></div><h1 class='singer'></h1></div><div class='play_time'><div class='total_bar' title='调整歌曲进度'><div class='load_bar'></div><div class='progress_bar'></div></div><p class='time_tip'><time class='used'>00 : 00</time> / <time class='total'>00 : 00</time></p></div>" + "<div class='controls'><div class='action'><span class='opts prev' title='上一首' data-icon='p'></span><span class='opts pause' data-icon='u' title='播放'></span><span class='opts next' data-icon='n' title='下一首'></span></div><div class='volume'><span title='音量' data-icon='v' class='volume_icon'></span><div class='total_bar' title='调节音量'><div class='progress_bar'></div></div></div><span class='dictionary' title='歌曲列表' data-icon='d'></span></div></div><div class='songs_list'><ul></ul></div></div>";
    
      $(markup).insertAfter(self).css("opacity",0).animate({opacity: 1},600);
      
    };

    // 通过歌曲列表添加功能
    var songList = function () {
      var $listWrap = $(cssSelector.songList);
      
        $.fn.player.util.buildList($listWrap.find("ul"),playList);

        // auduio事件绑定
        $(self).on({
          play: playStatus,
          pause: pauseStatus,
          loadedmetadata: loadedMetaData,
          timeupdate: timeBar,
          progress: loadBar,
          ended: endedMode,
          seeking: addLoading,
          seeked: removeLoading,
          waiting: addLoading,
          canplaythrough: removeLoading
        });
      
        // 切换播放模式
        $( cssSelector.mode ).click(function(event) {
          $(this).addClass( cssSelector.cur ).siblings().removeClass( cssSelector.cur );
        });

        // 播放bar控制进度
        $( cssSelector.play_total_bar ).click(function(event) {
          if(self.currentSrc){
            var value =$.fn.player.util.getBarPosition(event,this);
            
            $.fn.player.util.progress( cssSelector.play_progress_bar,value,400 );
            setCurTime( value );
          }
        });

        // 音量bar控制
        $( cssSelector.volume_total ).click(function(event) {
          var volume = $.fn.player.util.getBarPosition(event,this);
          setVolume(volume);
        });

        // 音量icon控制
        $( cssSelector.volume_icon ).click(function() {

          $( this ).toggleClass( cssSelector.muted );
          toggleMuted();

          // 音量条的状态改变
          if( self.muted ){
            $.fn.player.util.progress( cssSelector.volume_progress_bar,0,400 );
          }
          else{
            setVolume($( this ).data("volume") );
          }
        });

          // 播放暂停控制
        $( cssSelector.play ).click(function() {
          togglePlay();
        });
        
        // 下一首上一首控制
        $( cssSelector.prev ).click(function () {
          count = $( cssSelector.queue ).hasClass( cssSelector.cur ) ? count - 2 : count - 1;
          $( self).trigger("ended");
        });

        $(cssSelector.next ).click(function() {
          count = $( cssSelector.queue ).hasClass( cssSelector.cur ) ? count : count +1;
          $( self).trigger("ended");
        });

        // 歌曲列表选择,使用委托
        $listWrap.on("click","li",function(){
          count = $listWrap.find("li").index(this);
          
          switchSong();
          return false;
        });

        $(cssSelector.dictionary).click(function(){
          $(this).toggleClass(cssSelector.cur);
          $listWrap.slideToggle();
        });
    };
    // end songlist

    var init = function(){

      interfaceWrap();
      songList(); 
      
      // 初始化配置
      autoPlay();
      setVolume(1);
      $(cssSelector.queue).trigger("click");
    }

    init();
  };

  // 默认选项
  $.fn.player.defaults = {
    autoplay: false
  };
  
  // S - Utility function
  $.fn.player.util = {
    buildList: function(wrap,listArr) {
      var markup = "",
          len = $.isArray(listArr) ? listArr.length : 0,
          item;
      
      for(var i=0; i < len; i++){
        item = listArr[i];
        markup += "<li data-icon>" + "<a href='" + $.fn.player.util.checkFormat(item.url) + "' title='" + item.title + "'>" + item.title + "<time>" + $.fn.player.util.formatTime(item.time) + "</time></a></li>";
      }
      wrap.append(markup);
    },

    formatTime: function(time){
      var min,sec;

      time = Number( time ) || "";
      min = Math.floor(time / 60) > 9 ?  Math.floor(time / 60) : "0" +  Math.floor(time / 60); 
      sec = Math.round(time % 60) > 9 ? Math.round(time % 60) : "0" +Math.round(time % 60);
      
      return min + " : " + sec;
    },

    getBarPosition: function(e,elem){
      e = e.originalEvent || e;
      
      return (e.offsetX ? e.offsetX : e.layerX ) / $(elem).width();
    },

    progress: function(elem,value,duration) {
      $(elem).animate({"width": value*100 + "%"},duration);
    },
    detectFormat: function(audio){
      var format;
 
      if(audio.canPlayType("audio/mp3")){
        format = "mp3";
      }
      else if(audio.canPlayType("audio/ogg")){
        format = "ogg";
      }

      return format;
    },

    checkFormat: function(url){
      var audio = $("audio")[0];
      var format = $.fn.player.util.detectFormat(audio);

      if( url.indexOf(".mp3") == -1 || url.indexOf(".ogg") == -1){
        url = url + "." + format;
      }
      
      return url;
    },

    checkCount: function(count,val) {
      if(count >= val){
        count = 0;
      }
      else if(count < 0 ){
        count = val -1;
      }
      return count;
    }
  };
  // E - Utility function

})(jQuery);