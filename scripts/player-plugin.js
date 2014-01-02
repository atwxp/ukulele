/**
 * @file a plugin for playing music by trying audio element
 * @author wxp
 * @repo https://github.com/atwxp/ukulele
 *
 */

;(function ($) {
    /**
     * @param {Array} playList 对象数组，格式为:
     * [       
     *     {
     *          url: 歌曲路径，必选
     *          title: 歌曲名称，可选
     *          time: 歌曲时长，可选
     *     }
     * ]
     * @param {Obejct} options 自定义参数
     */
    $.fn.player = function (playList, options) {
        var params = $.extend({}, $.fn.player.defaults, options);
        
        var self = this.get(0);
        // 歌曲计数器
        var count = 0;
        var len = $.isArray(playList) ? playList.length : 0;

        var cssSelector = {
            wrap: '.playerContainer',
            loading: 'loading',

            singer: '.singer',
            mode: '.mode',
            single: '.single',
            queue: '.queue',
            random: '.random',

            time_total: '.time_tip .total',
            time_used: '.time_tip .used',
            play_total_bar: '.play_time .total_bar',
            play_load_bar: '.play_time .load_bar',
            play_progress_bar: '.play_time .progress_bar',

            prev: '.prev',
            next: '.next',
            play: '.on, .pause',
            muted: 'muted',
            volume_total: '.volume .total_bar',
            volume_progress_bar: '.volume .progress_bar',
            volume_icon: '.volume_icon',

            dictionary: '.dictionary',
            songList: '.songs_list',
            playing: 'active',
            cur: 'cur'
        };

        function playStatus() {
            $(cssSelector.play).addClass('pause').removeClass('on').attr('title', '暂停');
        }

        function pauseStatus() {
            $(cssSelector.play).addClass('on').removeClass('pause').attr('title', '播放');
        }

        function autoPlay() {
            if (params.autoplay) {
                $('.songs_list').find('li:first-child').trigger('click');
            }
        }

        function addLoading() {
            $('#' + cssSelector.loading).addClass(cssSelector.loading);
        }
        function removeLoading() {
            $('#' + cssSelector.loading).removeClass(cssSelector.loading);
        }
        /**
         * 返回当前歌曲信息，更新歌曲列表状态
         *
         * @param {Object} 返回的歌曲信息格式:
         * {        
         *      title: 歌曲名称
         *      url: 歌曲路径
         * }
         */
        function trackSong() {

            // 更新歌曲列表状态
            var songs = $(cssSelector.songList).find('li').removeClass(cssSelector.playing).
                eq(count).addClass(cssSelector.playing)
                .end();
            var link;
            
            if (len != songs.length) {
                len = songs.length;
            }

            count = $.fn.player.util.checkCount(count, len);
            link = songs.eq(count).find('a')[0];

            return {
                title: link.title != 'undefined' ? link.title : '无标题',
                url: link.href
            }
        }

        /** 切换歌曲 */
        function switchSong() {
            var cur_song = trackSong();

            self.src = cur_song.url;
            self.load();
            self.play();
        }

        /** 判断歌曲结束后的播放模式，从而更新count计数器 */
        function endedMode() {
            var self = this;
            // 顺序播放
            if ($(cssSelector.queue).hasClass(cssSelector.cur)) {
                self.loop = false;
                count++;
            }
            // 随机播放
            else if ($(cssSelector.random).hasClass(cssSelector.cur)) {
                self.loop = false;
                count = Math.floor(Math.random() * len);
            }

            switchSong();
        }

        /** 加载歌曲元信息 */
        function loadedMetaData() {
            var title = trackSong().title;
            var duration = $.fn.player.util.formatTime(this.duration);

            $(cssSelector.time_total).text(duration);
            $(cssSelector.singer).text(title).attr('title', title);
        }

        function setUsed() {
            $(cssSelector.time_used).text($.fn.player.util.formatTime(self.currentTime));
        }

        function setCurTime(value) {
            self.currentTime = value * self.duration;
            setUsed();
        }

        function togglePlay() {
            self.paused ? self.play() : self.pause();
        }

        function toggleMuted() {
            self.muted = !self.muted;
        }

        /** 更新歌曲播放进度条 */
        function timeBar() {
            var self = this;
            var percent = self.currentTime / self.duration;

            setUsed();
            $.fn.player.util.progress(cssSelector.play_progress_bar, percent, 0);
        }

        /** 更新歌曲加载进度条 */
        function loadBar () {
            var self = this;

            if (self.buffered.length === 1) {
                if (self.buffered.start(0) === 0) {
                    var buffered = self.buffered.end(0);
                    $.fn.player.util.progress(cssSelector.play_load_bar, buffered / self.duration, 0);
                }
            }
        }

        function setVolume(volume) {
            $(cssSelector.volume_icon).data('volume', volume);
            self.volume = volume;
            $.fn.player.util.progress(cssSelector.volume_progress_bar, volume, 400);

            // 静音下，点击音量条，取消静音
            if (self.muted) {
                $(cssSelector.volume_icon).trigger('click');
            }
        }
        
        /** 构建播放器界面 */
        var interfaceWrap = function () {
            var markup = [
                '<div class="playerContainer">',
                    '<div id="loading"></div>',
                    '<div class="player">',
                        '<div class="song_info">',
                            '<div class="play_mode">',
                                '<span class="mode random" data-icon="r" title="随机播放"></span>',
                                '<span class="mode queue" data-icon="q" title="顺序播放"></span>',
                                '<span class="mode single" data-icon="s" title="单曲循环"></span>',
                            '</div>',
                            '<h1 class="singer"></h1>',
                        '</div>',
                        '<div class="play_time">',
                            '<div class="total_bar" title="调整歌曲进度">',
                                '<div class="load_bar"></div>',
                                '<div class="progress_bar"></div>',
                            '</div>',
                            
                            '<p class="time_tip">',
                                '<time class="used">00 : 00</time> ',
                                '/ ',
                                '<time class="total">00 : 00</time>',
                            '</p>',
                        '</div>',

                        '<div class="controls">',
                            '<div class="action">',
                                '<span class="opts prev" title="上一首" data-icon="p"></span>',
                                '<span class="opts on" data-icon="u" title="播放"></span>',
                                '<span class="opts next" data-icon="n" title="下一首"></span>',
                            '</div>',
                            '<div class="volume">',
                                '<span title="音量" data-icon="v" class="volume_icon"></span>',
                                '<div class="total_bar" title="调节音量">',
                                    '<div class="progress_bar"></div>',
                                '</div>',
                            '</div>',
                            '<span class="dictionary" title="歌曲列表" data-icon="d"></span>',
                        '</div>',
                   '</div>',
                   '<div class="songs_list">',
                        '<ul></ul>',
                    '</div>',
                '</div>'
            ].join('');

            $(markup).insertAfter(self).css('opacity', 0).animate({ opacity: 1 }, 600);

        };

        /**
         * 注册相关事件
         * 
         */
        var initPlayer = function () {
            var $listWrap = $(cssSelector.songList);

            $.fn.player.util.buildList($listWrap.find('ul'), playList);

            // auduio元素事件绑定
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
                canplay: removeLoading
            });

            // 切换播放模式
            $(cssSelector.mode).click(function () {
                $(this).addClass(cssSelector.cur).siblings().removeClass(cssSelector.cur);
            });

            // 点击播放bar，实现快进快退
            $(cssSelector.play_total_bar).click(function (event) {
                if (self.currentSrc) {
                    var value =$.fn.player.util.getBarPosition(event, this);

                    $.fn.player.util.progress(cssSelector.play_progress_bar, value, 400);
                    setCurTime(value);
                 }
            });

            // 点击音量bar，调节音量
            $(cssSelector.volume_total).click(function (event) {
                var volume = $.fn.player.util.getBarPosition(event, this);
                setVolume(volume);
            });

            // 点击声音开关，实现静音
            $(cssSelector.volume_icon).click(function () {

                $(this).toggleClass(cssSelector.muted);
                toggleMuted();

                // 静音，音量条进度归0
                if (self.muted) {
                    $.fn.player.util.progress(cssSelector.volume_progress_bar, 0, 400);
                }
                // 不静音，回到先前的音量
                else {
                    setVolume($(this).data('volume'));
                }
            });

            // 播放暂停控制
            $(cssSelector.play).click(function () {

                // 当前audio元素src为空，用在非自动播放首次加载
                if (self.currentSrc == '') {
                    params.autoplay = true;
                    autoPlay();
                }
                else {
                    togglePlay();
                }
            });

            // 下一首上一首控制
            $(cssSelector.prev).click(function () {
                count = $(cssSelector.queue).hasClass(cssSelector.cur) ? count - 2 : count - 1;
                $(self).trigger('ended');
            });

            $(cssSelector.next).click(function () {
                count = $(cssSelector.queue).hasClass(cssSelector.cur) ? count : count + 1;
                $(self).trigger('ended');
            });

            // 歌曲列表选择
            $listWrap.on('click', 'li', function () {
                count = $listWrap.find('li').index(this);

                switchSong();
                return false;
            });

            // 歌曲目录的展开和伸缩
            $(cssSelector.dictionary).click(function () {
                $(this).toggleClass(cssSelector.cur);
                $listWrap.slideToggle();
            });
        };
        
        /**
         * 初始化player
         *
         */
        var init = function () {
            interfaceWrap();
            initPlayer();

            // 初始化配置。自动播放，音量设置，播放模式设置
            self.src = '';
            autoPlay();
            setVolume(1);
            $(cssSelector.queue).trigger('click');
        };

        init();
    };

    // player默认参数
    $.fn.player.defaults = {
        autoplay: false
    };

    /**
     * helper 辅助函数
     *
     */
    $.fn.player.util = {
        /**
         * 构建播放器歌曲列表，<ul><li><a>...<time>...</time></a></li></ul>
         *
         * @param {Object} wrap jQuery对象
         * @param {Array} listArr 对象数组，格式为
         * [       
         *     {
         *          url: 歌曲路径，必选
         *          title: 歌曲名称，可选
         *          time: 歌曲时长，可选
         *     }
         * ]
         */
        buildList: function (wrap, listArr) {
            var markup = '',
                len = $.isArray(listArr) ? listArr.length : 0,
                item;

            for (var i = 0; i < len; i++) {
                item = listArr[i];
                markup += '<li data-icon>' 
                    + '<a href="' + $.fn.player.util.checkFormat(item.url) 
                    + '" title="' + item.title + '">' + item.title 
                    + '<time>' + $.fn.player.util.formatTime(item.time) + '</time></a></li>';
            }
            wrap.append(markup);
        },
        
        /** 格式化时间
         *
         * @return {string} 形式为 19 : 10 或者 08 : 09 
         */
        formatTime: function (time) {
            var min, sec;

            time = Number( time ) || '';
            min = Math.floor(time / 60) > 9 ?  Math.floor(time / 60) : '0' +  Math.floor(time / 60);
            sec = Math.round(time % 60) > 9 ? Math.round(time % 60) : '0' + Math.round(time % 60);

            return min + ' : ' + sec;
        },

        getBarPosition: function (e, elem) {
            e = e.originalEvent || e;

            return (e.offsetX ? e.offsetX : e.layerX ) / $(elem).width();
        },
        progress: function (elem, value, duration) {
            $(elem).animate({ 'width': value * 100 + '%' }, duration);
        },
        
        /** 检测浏览器支持的audio格式
         *
         * @param {DOM} audio DOM对象audio元素
         * @return {string} 
         */
        detectFormat: function (audio) {
            var format;

            if (audio.canPlayType('audio/mp3')) {
                format = 'mp3';
            }
            else if (audio.canPlayType('audio/ogg')) {
                format = 'ogg';
            }

            return format;
        },
        /**
         * 统一歌曲路径
         *
         * @param {string} url 歌曲路径
         * @return {string} 返回形如 xxx.mp3 或者 xx.ogg 这样带有后缀的路径
         */
        checkFormat: function (url) {
            var audio = $('audio')[0];
            var format = $.fn.player.util.detectFormat(audio);

            if (url.indexOf('.mp3') != -1 || url.indexOf('.ogg') != -1 ) {
                return url;
            }
            else {
                return url + '.' + format;
            }
        },
        checkCount: function (count, val) {
            if (count >= val) {
                count = 0;
            }
            else if (count < 0 ) {
                count = val -1;
            }
            return count;
        }
    };
})(jQuery);
