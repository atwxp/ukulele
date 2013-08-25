ukulele
=======

#.player()插件使用

**Description**: 提供一个简单的音频播放器界面及相应的播放功能

##自定义选项

###autoplay 

- **description**: 初始播放器时，是否自动播放歌曲

- **type**: Boolean

- **default**: false

##使用说明

###HTML结构

  	<!doctype html>	
	<html lang="en">
		<head>
			<meta charset="utf-8" />		
		  	<link rel="stylesheet" href="css/player.css">
			<script src="scripts/jquery-1.9.1.min.js"></script>
			<script src="scripts/player-plugin.js"></script>
		</head>
	
		<body>
			<-- other contents -->			
			<audio id="ukulele" controls src=""></audio>
			<-- other contents -->
		<script>
		jQuery(function($){
	
		  var listArray = [
		    {
		      title: "小手拉大手",
		      url: "audio/小手拉大手",
		      time: 18
		    },{
		      title: "张悬-宝贝",
		      url: "audio/宝贝前奏",
		      time: 17
		    }];
	
	  		$("#ukulele").player(listArray);
		});
		</script>
		</body>
	</html>

使用这个插件时，**只能引用定义一个`audio`元素，提供`id`即可，然后引入3个文件**：

- `player.css`: 定制播放器界面的样式

- `jquery.js`: jquery官方版本库，1.7版本以上

- `player-plugin.js`: 要用的player插件


此外，**必须提供一个歌曲列表数组**，如上所示，

	[{
		title: 歌曲的名称 （可选）,
		url: 歌曲的存放路径（必须）,
		time: 播放时长（可选）
	}]

**注意：**同一个页面内只能引用一个audio，即下面的情况可能会导致插件失效（暂时不支持，可能以后会添加多播放器支持）： 

2. 通过 `$("audio").player(listArr)` ,只会初始化一个播放器。
3. 初始化`$("#audio").player(listArr)` ，又初始化`$("#audio1").player(listArr)`会出错

###自动播放

如果想自动播放，可以这样使用：
	
	$("selector").player(listArr,{ autoplay: true })
