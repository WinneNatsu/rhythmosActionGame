var rhythmosCanvas = document.getElementById("rhythmosActionGameCanvas");
var ctx = rhythmosCanvas.getContext('2d');
// autoScreenWidth&Height
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
//--------------------------------------------------
// variables
//--------------------------------------------------

// backgroundImg
var gameBackgroundImg = new Image();
gameBackgroundImg.src = "rhythmosActionGame/img/gameBackgroundImg1.jpg";
var gameBackgroundImg2 = new Image();
gameBackgroundImg2.src = "rhythmosActionGame/img/gameBackgroundImg2.jpg";

// gameTitleImg
var gameTitleImg = new Image();
gameTitleImg.src = "rhythmosActionGame/img/gameTitle.png";

/** gameBackgroundNotes imgLoad*/
var gameBackgroundNote1 = new Image();
var gameBackgroundNote2 = new Image();
var gameBackgroundNote3 = new Image();
gameBackgroundNote1.src = "rhythmosActionGame/img/backgroundNotes/test1.png";
gameBackgroundNote2.src = "rhythmosActionGame/img/backgroundNotes/test2.png";
gameBackgroundNote3.src = "rhythmosActionGame/img/backgroundNotes/test3.png";
/** 图片数组*/
var gameImages = [];
gameImages.push(gameBackgroundNote1);
gameImages.push(gameBackgroundNote2);
gameImages.push(gameBackgroundNote3);
gameImages.push(gameBackgroundImg);
gameImages.push(gameTitleImg);

var gameBackgroundNoteReady = 0;

// backgroundFocal
var focalLength = 1000,
// backNoteQuality
	backNoteN = 80,
// backNoteArray
	backNotes = [],
// the Center of the Canvas with X Position
	vpx = 0,
// the Center of the Canvas with Y Position
	vpy = 0;

// mouseMovePos
var mouseMoveX = 0;
var mouseMoveY = 0;
var mouseMoveArea_gameTitle = false;

/**
 * stateMachineSwitch -- ControFlag
 * 
 * state_universalOnceFlag
 * 		reset flag when State Changed / One State can just use once and then turn flag to true;
 * 
 * */ 
var state_universalOnceFlag = false;
var state_gameTitlePE_initFlag = false;

// universalInterval for state
var state_setUniversalInterval = null;

//
var titleParticles = []; 
//暂停
var gameTitleAnimatePause = false;
/**
 * animate flag
 * */
// gameTitleFontAnimate SwitchFlag
var direction = true;
// gameTitleInterfaceAnimate breakFlag
var gameTitleInterfaceAnimate_breakFlag = false;


var gameTitleAnimateOverCount = 0;
/**
 * TODO
 * 1.开始界面，鼠标点击声(可以是一段曲子，每点一次播放一个音符，按顺序播放) 与 开始游戏（进入选曲界面）声
 * 2.开始界面音乐 _ 钢琴曲
 * 3.选曲界面音乐（当鼠标移入曲框时，淡入切换至对应歌曲；移出时淡出回到选区界面音乐）
 * 4.选择一个歌曲后，将所选得Songbox粒子化并炸开，半径逐渐增大，最后盖住屏幕。随后切换至下一个场景时，粒子再逐渐变小组成下一个场景（其实就是新场景得粒子随机分布后进行聚合，与上个场景得粒子无关）。
 * 5.开始界面的移动音符蓝色或淡蓝色如何？现在的黑色与背景图不太搭。
 * */

//---------------------------------------------------------
// stateMachine
//---------------------------------------------------------
/**
 * 1.stateInit_loadImage 预加载图片
 * 2.state_gameTitleInterface 游戏开始界面
 * 3.state_selectSongInterface 选曲界面
 * */
var stateMachine = {
		
	currentState:1,
	
	lastState:1,
	
	// stateChange
	transition: function(){
		switch (stateMachine.currentState) {
		case 1:
			stateMachine.currentState = state_loadImage();
			break;
		case 2:
			// TODO 状态转换再了Animate函数中，在其中更改了状态码并调用了一次状态机（不主动调用，程序会直接终止）, 需要优化，尽量使状态的转换在状态机内执行，外部尽量不调用状态机。
			state_gameTitleInterface();
			break;
		case 3:
			state_selectSongInterface();
			break;
		default:
			break;
		}
		// When stateNo Change, Call stateMachine once
		if(stateMachine.lastState!=stateMachine.currentState){
			stateMachine.lastState = stateMachine.currentState;
			stateMachine.transition();
		}
	}
};

/**
 * 1.preload Images
 * */
function state_loadImage(){

	gameImages.forEach(function(){
		if(this.complete){
			gameBackgroundNoteReady++;
		}
	});
	if(gameBackgroundNoteReady == gameImages.length){
		// success & initGame & changeStateFlag to next State
		
		// clearInterval which used for Images Load Complete 
		clearInterval(state_setUniversalInterval);
		state_universalOnceFlag = false;
		/**
		 * initRhythmosGame()
		 * 
		 * First  : set canvasWidth & Height
		 * Second : create backNotes & push to array
		 * */ 
		initRhythmosGame();
		return 2;
	}else{
		// false & reset count
		gameBackgroundNoteReady = 0;
		
		if(!state_universalOnceFlag){
			// loop the state_loadImage(),until all Images loaded
			state_universalOnceFlag = true;
			state_setUniversalInterval = setInterval("stateMachine.transition()",500);
			return 1;
		}
	}
}

/**
 * 2.game start interface
 * */
function state_gameTitleInterface(){
	initGameTitlePEAnimate();
}

/**
 * 3.the interface of select song 
 * */
function state_selectSongInterface(){
	songBoxesAnimate();
}
//----------------------------------------------
// SongBox 正在开发区
//----------------------------------------------
var songBoxes = [];
// Count the song box which in the upRight Area
var songBoxesUpCount = 0;
// Count the song box which in the downLeft Area
var songBoxesDownCount = 0;

function songBoxPrototype(songNo,songName,songBoxImageUrl,audioUrl,notesJsonUrl,composer,creatTime){
	// jsonData
	this.songNo = songNo;
	this.songName = songName;
	this.songBoxImageUrl = songBoxImageUrl;
	this.audioUrl = audioUrl;
	this.notesJsonUrl = notesJsonUrl;
	this.composer = composer;
	this.creatTime = creatTime;

	// 16:10
	this.width = screenWidth/6.4;
	this.height = screenHeight/5;
	
	this.x = screenWidth + this.width;
	this.y = screenHeight/8;
	
	this.ex = 0;
	this.ey = screenHeight/8;
	/**
	 * songBox position
	 * 		true -- upRight 从上方右边向左移动
	 * 		false -- downLeft 从下方左边向右移动
	 * */
	this.upDown = true;

	
	this.songBoxImage = new Image();
	this.songBoxImage.src = songBoxImageUrl;

	// draw
	songBoxPrototype.prototype.drawSongBox = function drawSongBoxFunction(){

		/**
		 * draw song box
		 * 		--old- ctx.drawImage(this.songBoxImage,this.x,this.y,this.width,this.height);
		 * 		--now- use the ctx.clip() to limit area ,then just use drawImage();
		 * */
	    //var songBoxpattern = ctx.createPattern(this.songBoxImage, "no-repeat");
	    ctx.save();
		drawRoundRect(ctx,this.x,this.y,this.width,this.height,25);
		// 剪切区域，之后操作都会被限制此前"设置"的区域内
		ctx.clip();
		ctx.drawImage(this.songBoxImage,this.x,this.y,this.width,this.height);
		ctx.lineWidth=3;
	    ctx.fillStyle = "black";
	    ctx.stroke();
	    ctx.restore();
		/**
		 * calculate songBox position
		 * --this.ex = screenWidth - (songBoxes.length - parseInt(this.songNo) + 1)*this.width - this.width*(songBoxes.length - parseInt(this.songNo)+1)/3,
		 * 【1】(songBoxes.length - parseInt(this.songNo) + 1)*this.width
		 * 		按顺序排列，越先出现的移动的越远（因为是从右往左移动）;所以要移动box总数x个box宽度距离；
		 * 【2】this.width*(songBoxes.length - parseInt(this.songNo))/3
		 * 		为了制造box之间的间隔距离；
		 * */
	    if(this.upDown){
			 this.ex = screenWidth - (songBoxesUpCount - parseInt(this.songNo) + 1)*this.width*4/3;
			// calculate animate
			(this.x > this.ex) ? (this.x -= (this.x - this.ex) * 0.1) : this.x = this.ex;
	    }else{
	    	this.ex = (parseInt(this.songNo) - songBoxesUpCount - 1) * this.width*4/3 + this.width/3;
			// calculate animate
			(this.x < this.ex) ? (this.x += (this.ex - this.x) * 0.1) : this.x = this.ex;
	    }    
	}
	// TODO 这里出问题 移到外面声明成变量
	/*
	// Count the song box which in the upRight Area
	songBoxPrototype.prototype.songBoxesUpCount = 0;
	// Count the song box which in the downLeft Area
	songBoxPrototype.prototype.songBoxesDownCount = 0;
	*/
}

function createSongBoxes(){
	$.ajax({
		url:"rhythmosActionGame/json/songBoxes.json",
		dataType:"json",
		type:"get",
		// async. 默认是 true，即为异步方式，$.ajax执行后，会继续执行ajax后面的脚本，直到服务器端返回数据后，触发$.ajax里的success方法，这时候执行的是两个线程。
		// async 设置为 false，则所有的请求均为同步请求，在没有返回值之前，同步请求将锁住浏览器，用户其它操作必须等待请求完成才可以执行。
		async:false,
		beforeSend :function(xmlHttp){ 
			xmlHttp.setRequestHeader("If-Modified-Since","0"); 
			xmlHttp.setRequestHeader("Cache-Control","no-cache");
		},
		success:function(data){
            $.each(data,function(){
            	console.log(this.songName);
            	var theSongBox = new songBoxPrototype(this.songNo,this.songName,this.songBoxImageUrl,this.audioUrl,this.notesJsonUrl,this.composer,this.creatTime);
            	songBoxes.push(theSongBox);
            });
            
    		songBoxes.forEach(function(){
    			if(songBoxes.length < 5){
    				/** Data less then 5 */
    				
    				songBoxesUpCount = songBoxes.length;
    			}else if(songBoxes.length%2==0){
    				/** songBoxesLegth % 2 == 0 */
    				
    				if(parseInt(this.songNo) > songBoxes.length/2){
    					// init songBox which in the downRight
    					this.upDown = false;
    					this.x = 0 - this.width;
    					this.y = screenHeight*5/8;
    					this.ey = screenHeight*5/8;
    				}else{
    					// keep the init data
    				}
    				songBoxesUpCount = songBoxes.length/2;
    				songBoxesDownCount = songBoxes.length/2;		
    			}else{
    				/** songBoxesLegth % 2 == 1 */
    				
    				if(parseInt(this.songNo) > (songBoxes.length + 1)/2){
    					// init songBox which in the downRight
    					this.upDown = false;
    					this.x = 0 - this.width;
    					this.y = screenHeight*5/8;
    					this.ey = screenHeight*5/8;
    					songBoxesDownCount++;
    				}else{
    					songBoxesUpCount++;
    					// keep the other init data
    				}
    			}
    		});
		}
	});
}

function songBoxesAnimate(){
	
	// TODO 优化 放到合适的地方 还有这个tempFlag处理一下
	if(!state_universalOnceFlag){
		createSongBoxes();
		state_universalOnceFlag = true;
	}
	
	// clear canvas
	ctx.clearRect(0,0,screenWidth,screenHeight);
	
	// draw the background-image
	ctx.drawImage(gameBackgroundImg,0,0,screenWidth,screenHeight);
	
	// background notes animate
	backgroundNotesAnimate();
	
	for (var i=0; i<songBoxes.length; i++){
		songBoxes[i].drawSongBox();
	}
	
	if(true) {
	   if("requestAnimationFrame" in window){
	       requestAnimationFrame(songBoxesAnimate);
	   }
	   else if("webkitRequestAnimationFrame" in window){
	       webkitRequestAnimationFrame(songBoxesAnimate);
	   }
	   else if("msRequestAnimationFrame" in window){
	       msRequestAnimationFrame(songBoxesAnimate);
	   }
	   else if("mozRequestAnimationFrame" in window){
	       mozRequestAnimationFrame(songBoxesAnimate);
	   }
	}
}

//----------------------------------------------
// the notes move in the background
//----------------------------------------------
/**
 * initGame
 * */
function initRhythmosGame(){
	//setCanvasWidth&Height
	rhythmosCanvas.width = screenWidth;
	rhythmosCanvas.height = screenHeight;
	vpx = screenWidth/2;
	vpy = screenHeight/2;

	// create backNotes
	for (var i=0; i<backNoteN; i++) {
		var note = new gameBackgroundNotes(Math.floor(Math.random()*10%3),Math.floor(Math.random()*screenWidth),Math.floor(Math.random()*screenHeight),Math.floor(Math.random()*focalLength));				
		backNotes.push(note);
	}
}

/**
 * gameBackgroundNotes
 * 
 * To : backNotesPrototype
 * 
 * noteImgNo : ImageNumber of Note
 * noteX : X coordinates in the Canvas
 * noteY : Y coordinates in the Canvas
 * noteZ : Z coordinates in the Canvas
 * 
 * noteWidth : Width of the Note
 * noteHeight : Height of the Note
 * drawX : X coordinates in the Canvas After Calculate 3d to 2d
 * drawY : Y coordinates in the Canvas After Calculate 3d to 2d
 * drawWidth : Width of the Note After Calculate 3d to 2d
 * drawHeight : Height of the Note After Calculate 3d to 2d
 * */
function gameBackgroundNotes(noteImgNo,noteX,noteY,noteZ){
	this.noteImgNo = noteImgNo;
	this.noteX = noteX;
	this.noteY = noteY;
	this.noteZ = noteZ;
	this.scale = focalLength / (focalLength + this.noteZ);
	this.noteImgUrl = new Image();
	this.noteWidth = 80;
	this.noteHeight = 80;
	this.drawX = this.noteX * this.scale;
	this.drawY = this.noteY * this.scale;
	this.drawWidth = this.noteWidth*this.scale;
	this.drawHeight = this.noteHeight*this.scale;

	gameBackgroundNotes.prototype.drawBackNote = function drawBackNoteFunction() {
		switch (this.noteImgNo) {
		case 0:
			noteImgUrl = gameBackgroundNote1;
			break;
		case 1:
			noteImgUrl = gameBackgroundNote2;
			break;
		case 2:
			noteImgUrl = gameBackgroundNote3;
			break;
		}
		ctx.drawImage(noteImgUrl,this.drawX,this.drawY,this.drawWidth,this.drawHeight);

		// vector
		var vectorX = mouseMoveX - vpx;
		var vectorY = mouseMoveY - vpy;
		// update
		this.drawX += vectorX/100*this.scale;
		this.drawY += vectorY/100*this.scale;	
		
		// keep in view
		if(this.drawX>screenWidth){
			this.drawX = 0;
		}else if(this.drawX<0){
			this.drawX = screenWidth;
		}
		if(this.drawY>screenHeight){
			this.drawY = 0;
		}else if(this.drawY< 0){
			this.drawY = screenHeight;
		}
	}
}

//----------------------------------------------
// Animate Catalog
//----------------------------------------------
/**
 * Animate Catalog
 * 
 * 1.game title font animate
 * 		gameTitleAnimate()
 * 2.background notes animate
 * 		backgroundNotesAnimate()
 * 3.the transition of the interface
 * 		interfaceCutscenesAnimate()
 * */
function gameTitleInterfaceAnimate(){
	// clear canvas
	ctx.clearRect(0,0,screenWidth,screenHeight);
	
	// draw the background-image
	ctx.drawImage(gameBackgroundImg,0,0,screenWidth,screenHeight);
	
	// background notes animate
	backgroundNotesAnimate();
	
	// game title animate
	gameTitleAnimate();

	if(!gameTitleInterfaceAnimate_breakFlag) {
	   if("requestAnimationFrame" in window){
	       requestAnimationFrame(gameTitleInterfaceAnimate);
	   }
	   else if("webkitRequestAnimationFrame" in window){
	       webkitRequestAnimationFrame(gameTitleInterfaceAnimate);
	   }
	   else if("msRequestAnimationFrame" in window){
	       msRequestAnimationFrame(gameTitleInterfaceAnimate);
	   }
	   else if("mozRequestAnimationFrame" in window){
	       mozRequestAnimationFrame(gameTitleInterfaceAnimate);
	   }
	}else{
		stateMachine.currentState = 3;
		stateMachine.transition();
	}
}
/**
 * 1.game title font animate
 * */
function gameTitleAnimate(){
	// flag change when the animate complete
	if(gameTitleAnimateOverCount == titleParticles.length){
		// prepare the next animate & change animate flag when the current animate complete
		direction ? gameTitleAnimate_changeToDisperseAnimate() : gameTitleAnimate_changeToComposeAnimate();
	}
	// resetCount
	gameTitleAnimateOverCount = 0;
	
	titleParticles.forEach(function(){
	   var dot = this;
	   if(gameTitleAnimatePause){
		   mouseMoveArea_gameTitle ? gameTitleAnimatePause = true :gameTitleAnimatePause = false;
	   }else if(direction){
		   // compose
		   if(dot.sx == dot.x && dot.sy == dot.y){
			   // count complete animate particles
			   gameTitleAnimateOverCount++;
		   }else if (Math.abs(dot.sx - dot.x) < 0.1 && Math.abs(dot.sy - dot.y) < 0.1) {
	       		dot.x = dot.sx;
	       		dot.y = dot.sy;
	           //dot.z = dot.dz;
	       		
	       } else {
	           dot.x = dot.x + (dot.sx - dot.x) * 0.1;
	           dot.y = dot.y + (dot.sy - dot.y) * 0.1;
	           //dot.z = dot.z + (dot.dz - dot.z) * 0.1;
	       }
	   }else{
		   // disperse
		   if(dot.ex == dot.x && dot.ey == dot.y){
			   // count complete animate particles
			   gameTitleAnimateOverCount++;
		   }else if (Math.abs(dot.ex - dot.x) < 0.1 && Math.abs(dot.ey - dot.y) < 0.1) {
	           dot.x = dot.ex;
	           dot.y = dot.ey;
	           //dot.z = dot.tz;
	           gameTitleAnimateOverCount++;
	       } else {
	           dot.x = dot.x + (dot.ex - dot.x) * 0.1;
	           dot.y = dot.y + (dot.ey - dot.y) * 0.1;
	           //dot.z = dot.z + (dot.tz - dot.z) * 0.1;
	       }
	   }
	   dot.draw();
	});
	
	// random the disperse position & change animate flag(direction)
	function gameTitleAnimate_changeToDisperseAnimate(){
		// random the disperse position
		titleParticles.forEach(function(){
			this.ex = Math.random()*screenWidth;
			this.ey = Math.random()*screenHeight;
		});
		// change animate flag(direction)
		direction = false;
		// if the mouse in the area ,pause the animate when the current animate(compose animate) complete
		mouseMoveArea_gameTitle ? gameTitleAnimatePause = true :gameTitleAnimatePause = false;
	}
	
	// change animate flag(direction)
	function gameTitleAnimate_changeToComposeAnimate(){
		// change animate flag(direction)
		direction = true;
	}
}

/**
 * 2.background notes animate
 * */
function backgroundNotesAnimate(){
	for (var i=0; i<backNoteN; i++){
		backNotes[i].drawBackNote();
	}
}

/**
 * 3.the transition of the interface
 *
 * */
// TODO 过场动画实现不正确，重新考虑
var cutscenesTranslateCount = 0;
function interfaceCutscenesAnimate(){
	ctx.save();
	// clear canvas
	ctx.clearRect(0,0,2*screenWidth,2*screenHeight);
	// draw the background-image
	ctx.translate(cutscenesTranslateCount,0);
	cutscenesTranslateCount-= 10;
	ctx.drawImage(gameBackgroundImg2,0,0,screenWidth,screenHeight);
	ctx.restore();
	
	if(true) {
		   if("requestAnimationFrame" in window){
		       requestAnimationFrame(interfaceCutscenesAnimate);
		   }
		   else if("webkitRequestAnimationFrame" in window){
		       webkitRequestAnimationFrame(interfaceCutscenesAnimate);
		   }
		   else if("msRequestAnimationFrame" in window){
		       msRequestAnimationFrame(interfaceCutscenesAnimate);
		   }
		   else if("mozRequestAnimationFrame" in window){
		       mozRequestAnimationFrame(interfaceCutscenesAnimate);
		   }
	}
	
	if(cutscenesTranslateCount < -1920){
		return false;
	}else{
		return true;
	}

}
//--------------------------------------------
// 未分类 & particleAnimate of gameTitle
//--------------------------------------------

/**
 *  gameTitlePE
 *  
 *  To : Particle Effects
 * */
function titleParticle(x,y,radius,rgba){
		// start position
		this.sx = x;
		this.sy = y;
		// end position
		this.ex = 0;
		this.ey = 0;
		// draw position
		this.x = x;
		this.y = y;
		this.radius = radius;
		// rgba
		this.rgba = rgba;
		//this.rgba_aFlag = true;
		
		titleParticle.prototype.draw = function drawPar(){
			ctx.save();
			ctx.beginPath();
			// z轴扁平化
			//var scale = focallength/(focallength + this.z);
			// context.arc(x,y,r,sAngle,eAngle,counterclockwise);
			//ctx.arc(screenWidth/2 + (this.x-screenWidth/2) , screenHeight/2 + (this.y-screenHeight/2), this.radius , 0, 2*Math.PI);
			//ctx.fillStyle = "rgba("+this.rgba.r+","+this.rgba.g+","+this.rgba.b+","+this.rgba.a+")";
			ctx.arc(this.x , this.y, this.radius , 0, 2*Math.PI);
			ctx.fillStyle = "rgba(255,255,255,100)";
			
			ctx.fill();
			ctx.restore();
	}
}

// 
function drawTextOfGameTitle(){
	//var titleFontSize = 150;
	//titleFontSize = titleFontSize * 
	var fontSizeScale = (screenWidth + screenHeight)/(1920+1080);
    ctx.save()
    ctx.drawImage(gameTitleImg,screenWidth*(3/4),screenHeight*(3/4),400*fontSizeScale,100*fontSizeScale);
    ctx.restore();
    // 获取文字粒子
    titleParticles = gameTitlePE();
}

// 获取像素点并压入数组
function gameTitlePE() {
	var imageData = this.ctx.getImageData(0, 0, screenWidth, screenHeight);

	for (var x = 0; x < imageData.width; x+=2) {
	   for (var y = 0; y < imageData.height; y+=2) {

	       var i = 4*(y * imageData.width + x);
	       if (imageData.data[i] > 0) {
			titleParticles.push(new titleParticle(x-1,y-1,1,{
				r : imageData.data[i],
				g : imageData.data[i+1],
				b : imageData.data[i+2],
				a : imageData.data[i+3]
			}));
	      }
	   }
	}
	return titleParticles;
}

function initGameTitlePEAnimate(){
	// initGameTitle & get the Title's ImageData
	if(!state_gameTitlePE_initFlag){
		// draw GameTitle & get ImageData
		drawTextOfGameTitle();
		state_gameTitlePE_initFlag = true;
		
		// forEach循环,数组内每个成员都执行
		titleParticles.forEach(function(){
			this.x = Math.random()*screenWidth;
			this.y = Math.random()*screenHeight;
			//this.z = Math.random()*focallength*2 - focallength;
		   
			// 生成飞散开时得随机坐标
			this.ex = Math.random()*screenWidth;
			this.ey = Math.random()*screenHeight;
			//this.tz = Math.random()*focallength*2 - focallength;
			   
			this.draw();
		})
	}
	gameTitleInterfaceAnimate();
}

// overridingForEach
Array.prototype.forEach = function(callback){
  for(var i=0;i<this.length;i++){
      callback.call(this[i]);
  }
}

//-----------------------------------------
// eventListener
//-----------------------------------------
rhythmosCanvas.addEventListener("mousemove",function(evt){
  mouseMoveX = evt.x - rhythmosCanvas.getBoundingClientRect().left;
  mouseMoveY = evt.y - rhythmosCanvas.getBoundingClientRect().top;
  if(mouseMoveX > screenWidth*(3/4) && mouseMoveY > screenHeight*(3/4)){
	  mouseMoveArea_gameTitle = true;
  }else{
	  mouseMoveArea_gameTitle = false;
  }
})

rhythmosCanvas.addEventListener("click",function(evt){
	// gameTitleAnimatePause ? gameTitleAnimatePause = false : gameTitleAnimatePause = true;
	gameTitleInterfaceAnimate_breakFlag = true;
	stateMachine.currentState = 3;
})

//-----------------------------------------------
// Interval
//-----------------------------------------------
// cancel pause when the gameTitleAnimate paused every 2 second
/*
setInterval(function(){
	gameTitleAnimatePause && (gameTitleAnimatePause = false);
},2000);
*/
//-----------------------------------------------
// Common Function
//-----------------------------------------------
// 圆角矩形
function drawRoundRect(subAreaLEventCxt, x, y, width, height, radius){ 
	subAreaLEventCxt.beginPath(); 
	subAreaLEventCxt.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2); 
	subAreaLEventCxt.lineTo(width - radius + x, y); 
	subAreaLEventCxt.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2); 
	subAreaLEventCxt.lineTo(width + x, height + y - radius); 
	subAreaLEventCxt.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2); 
	subAreaLEventCxt.lineTo(radius + x, height +y); 
	subAreaLEventCxt.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI); 
	subAreaLEventCxt.closePath(); 
}
//-------------------------------
stateMachine.transition();


