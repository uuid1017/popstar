/*
 * Author: Dc-Edward67 (dc@edward67.com)
 */
 
(function(){
	var loading = document.getElementById('loading'),
		timer;
	
	timer = setInterval(function(){
		if (loading.style.display == 'block'){
			loading.innerHTML = loading.innerHTML.length > 9 ? 'Loading' : loading.innerHTML + '.';
		} else {
			clearInterval(timer);
		}
	}, 500);
})();

window.onload = function(){
	"use strict";
	
	var c = document.getElementsByTagName("canvas")[0],
		ctx = c.getContext("2d"),
		div = {
			'container': null,
			'loading': null,
			'text': null,
			'highest': null,
			'stage': null,
			'scores': null,
			'target': null,
			'changeText': null,
			'starsLeftText': null,
			'bonusScoresText': null,
			'blockNums': null,
			'blockScores': null,
			'starsLeft': null,
			'bonusScores': null,
			'gameOver': null,
			'clear': null,
			'new': null,
			'applause': null
		},
		img = {
			'background': null,
			'block': null,
			'select': null,
			'flash': null,
			'star': null,
			'good': null,
			'cool': null,
			'fantastic': null
		},
		
		voice = {
			'pop': null,
			'select': null,
			'drop': null,
			'end': null,
			'clear': null,
			'target': null,
			'applause': null,
		},
		block = [], // 储存方块的数组
		
		blockSize = 50,
		offsetTop = 140,
		offsetLeft = 20,
		canvasWidth,
		canvasHeight,
		tmpBlock,
		
		blastNum = 0, // 当前消除的方块序号
		blockNums = 100, // 选中方块的数量
		
		isStart = false, // 游戏是否进行中
		isEnding = false, // 游戏结束结算中
		isStartDrop = false, // 当前是否是游戏开始时的下落
		isOperate = true, // 当前是否可以操作
		isDrop = false, // 当前是否有方块在降落
		isBlast = false, // 当前是否有星星
		isSelectMove = false, // 当前是否有选中抖动
		isLeft = false, // 当前是否左移
		isScaleText = false, // 当前是否改变选中分数的大小
		isStarsLeft = false, // 当前是否显示剩余方块数量
		isBonusScores = false, // 当前是否显示奖励分数
		isClear = false, // 当前是否显示clear动画
		isFlash = false, // 当前存在全能方块
		isApplause = false, // 是否有鼓励图标
		isTouch = document.hasOwnProperty("ontouchstart"), // 是否为触屏
		
		highestValue = 0, // 最高分
		stageValue = 0, // 关卡
		scoresValue = 0, // 当前分数
		targetValue = 0, // 目标分数
		starsLeftValue = 0, // 剩余方块
		bonusScoresValue = 0, // 奖励分数
		applauseValue = 0,
		
		scaleTimer = 0, // 选中分数变化计时
		blastTimer = 0, // 消除计时器
		endTimer = 0, // 结束方块闪烁计时
		starsLeftTimer = 0, // 剩余变化计时器
		bonusScoresTimer = 0, // 奖励分数计时器
		clearTimer = 0, // 显示clear的计时器
		applauseTimer = 0, // 显示鼓励的计时器
		
		selectMove = 0, // 选中偏移
		
		textList = [], // 飞行中的文字数组
		starList = [], // 方块消除之后的星星数组
		leftMoveList = [], // 待左移的列
		flashList = [], // 全能方块的闪光
		
		needScores = 0, // 待加入的分数
		
		dropG = 8, // 方块下落时的加速度
		times, // 用于临时计数
		i,
		j,
		k,
		l,
		x,
		y;
		
	// 简易的dom操作
	function dom(ele){
		ele.show = function(isInline){
			this.style.display = isInline ? 'inline' : 'block';
			return this;
		}
		
		ele.hide = function(){
			this.style.display = 'none';
			return this;
		}
		
		ele.set = function(attr, value){
			this.style[attr] = value;
			return this;
		}
		
		ele.html = function(value){
			ele.innerHTML = value;
		}
		
		return ele;
	}
	
	// 给数组赋值
	Array.prototype.set = function(value, iLimit, jLimit, desc){
		iLimit = iLimit == null ? 10 : iLimit;

		if (desc){
			for (i = 9; i > iLimit - 1; i--){
				
				if (jLimit != null || (this[i] instanceof Array && (jLimit = 0))){
					this[i] = this[i] || [];
					for (j = 9; j > jLimit - 1; j--){
						this[i][j] = typeof value === 'function' ? (value(i, j, this) || this[i][j]) : value;
					}
				} else {
					this[i] = typeof value === 'function' ? (value(i, this) || this[i]) : value;
				}
			}
		} else {
			for (i = 0; i < iLimit; i++){
				
				// 如果不写jLimit则判断this[i]是否为数组，是数组则jLimit的大小是数组的长度
				if (jLimit != null || (this[i] instanceof Array && (jLimit = this[i].length))){
					this[i] = this[i] || [];
					for (j = 0; j < jLimit; j++){
						this[i][j] = typeof value === 'function' ? (value(i, j, this) || this[i][j]) : value;
					}
				} else {
					this[i] = typeof value === 'function' ? (value(i, this) || this[i]) : value;
				}
			}
		}
	}
	
	window.onresize = function(){
		var scale = 640 / 540;
		
		i = 0;
		j = 0;
		while (true){
			i += 1;
			j += scale;
			if (i > window.innerWidth){
				canvasWidth = window.innerWidth;
				// canvasHeight = j;
				canvasHeight = window.innerHeight;
				break;
			} else if (j > window.innerHeight){
				canvasWidth = i;
				canvasHeight = window.innerHeight;
				break;
			}
		}
		
		offsetLeft = 0.037 * canvasWidth;
		blockSize = (canvasWidth - offsetLeft * 2) / 10;
		offsetTop = canvasHeight - 10 * blockSize;
		c.width = canvasWidth;
		c.height = canvasHeight;

		// 重置画面各个界面的大小
		if (isStart){
			block.set(function(i, j, self){
				self[i][j].y = i * blockSize + offsetTop;
				self[i][j].x = j * blockSize + offsetLeft;
			}, 10, 10);
		}
		
		div.container.set('width', canvasWidth + 'px').set('height', canvasHeight + 'px');
		div.text.set('height', canvasHeight - blockSize * 10 - 1 + 'px');
		div.applause.set('top', blockSize * 2 + 'px');
		div.changeText.set('top', blockSize * 2 + 'px');
		dom(document.body).set('fontSize',  blockSize / 50 * 62.5 + '%');
		dom(document.getElementById('gameOver')).set('lineHeight', canvasHeight + 'px');
		
		ctx.font = blockSize * 0.6 + "px feltregular";
	};
	

	
	function playSound(v){
		
		// 移动端网页无法用代码控制播放声音
		try{
			v.currentTime = 0;
			v.play();
		} catch(e){
		}
	}
	
	block.setSelect = function(list){

		this.set(function(i, j, self){
			self[i][j].isSelect = false;
		});
	
		
		if (! list || list.length < 2) {
			return false;
		}
		
		playSound(voice.select);
		
		for(i = 0; i < list.length; i++){
			block[list[i].row][list[i].col].isSelect = true;
		}
	}
	
	// 检测是还能继续消除
	block.checkBlast = function(){
	
		// 是否可以继续消除
		block.canBlast = false;
		this.set(function(i, j, self){
			if ((self[i][j].type === 6) || 
				((self[i][j].type !== -1) && 
					(i + 1 < 10 && self[i][j].type === self[i + 1][j].type ||
					j + 1 < 10 && self[i][j].type === self[i][j + 1].type
					))){
				self.canBlast = true;
			}
		});
		
		return block.canBlast;
	}
	
	

	init();
	
	function init(){
		var loadBlock,
			isLoad = false;
			
		block.needDrop = []; // 每个方块待下落的距离
		block.needList = []; // 每列当前需要下落的距离
		block.displayList = []; // 待消失的方块数组
		block.lineDisplayList = []; // 每列待消失的方块数量

		for (i in div){
			if (div.hasOwnProperty(i)){
				div[i] = dom(document.getElementById(i));
			}
		}
		for (i in img){
			if (img.hasOwnProperty(i)){
				img[i] = dom(document.getElementById(i));
			}
		}
		for (i in voice){
			if (voice.hasOwnProperty(i)){
				voice[i] = document.getElementById(i + 'Voice');
			}
		}
		
		div.container.show();
		div.loading.hide();
		
		if(window.localStorage.block){
			stageValue = parseInt(localStorage.stageValue);
			targetValue = parseInt(localStorage.targetValue);
			highestValue = parseInt(localStorage.highestValue);
			scoresValue = parseInt(localStorage.scoresValue);
			loadBlock = JSON.parse(localStorage.block);
			block.set(function(i, j){
				return loadBlock[i][j];
			}, 10, 10);
			
			
			div.stage.html(stageValue);
			div.target.html(targetValue);
			div.highest.html(highestValue);
			div.scores.html(scoresValue);
			
			isFlash = localStorage.isFlash;
			
			if (localStorage.clearDisplay == 'block'){
				div.clear.set('transform', 'scale(1,1)').show();
				clearTimer = 30;
			}
			localStorage.clear();
			localStorage.highestValue = highestValue;
			isLoad = true;
		}
		
		block.needDrop.set(0, 10, 10);
		window.onresize();
		
		
		start(true, isLoad);
	}
	
	function start(isFirst, isLoad){
		if (isFirst && ! isLoad || ! isFirst){
			block.set(function(i, j, self){
				self.needDrop[i][j] = blockSize * 30 - i * blockSize * 1.8 - parseInt(Math.random() * blockSize);
				return {
						type: 1 + parseInt(Math.random() * 5),
						y: i * blockSize + offsetTop - self.needDrop[i][j],
						x: j * blockSize + offsetLeft,
						offsetY : 0,
						offsetX : 0,
						isSelect : false,
					};
			}, 10, 10);
			
			// 如果当前关卡是5的倍数，那么随机一个全能方块
			div.stage.html(++stageValue);
			if (stageValue % 5 == 0){
				block[parseInt(Math.random() * 10)][parseInt(Math.random() * 10)].type = 6;
				isFlash = true;
			} else {
				isFlash = false;
			}
			
			
			switch (stageValue){
				case 1:
					targetValue = 1000;
					break;
				case 2:
				case 3:
				case 4:
					targetValue += 2000;
					break;
				default:
					targetValue += 3000;
			}
			div.target.html(targetValue);
		}
		dropG = blockSize * 0.26;
		
		isStart = true;
		isStartDrop = true;
		isDrop = true;
		isOperate = false;
		
		isFirst && draw();
	}
	
	function blast(){
		block.set(function(i, j, self){
			self[i][j].isSelect && self.displayList.push({i: i, j: j});
		});
		
		if (! isEnding){
			needScores = blockNums * blockNums * 5;
		}
		
		isOperate = false;
		isBlast = true;
	}
	
	function drop(){
		block.needList.set(0, 10);
		block.needDrop.set(0, 10, 10);
		
		// 判断每个方块
		block.set(function(i, j, self){
			self[i][j].type > 0 ? self.needDrop[i][j] = self.needList[j] : self.needList[j] += blockSize;
		}, 0, 0, true);
		
		isDrop = true;
	}
	
	function continueOperate(){
		isOperate = true;
		
		// 检测是否全图为空
		l = true;
		block.set(function(i, j, self){
			if (self[i][j].type !== -1) {
				l = false;
			}
		});
		
		if (l || ! block.checkBlast()){
			playSound(voice.end);
			
			block.displayList = [];
			block.set(function(i, j, self){
				(self[i][j].type !== -1) && self.displayList.push({i: i, j: j});
			});
			
			if (! isEnding){
				blockNums = block.displayList.length;
				div.starsLeft.html(blockNums);
				div.bonusScores.html(Math.max(2000 - blockNums * blockNums * 20, 0));
			}
			
			isEnding = true;
			isStarsLeft = true;
			
			starsLeftTimer = 0;
		};
		
	}
	
	
	// 判断计算部分
	function calculate(){
		var turn, // 开关
			tmpScore;
		
		// 是否需要涨分数
		if (needScores > 0) {
			tmpScore = Math.max(parseInt(needScores * 0.03), 5);
			if (needScores > tmpScore){
				scoresValue += tmpScore;
				needScores -= tmpScore;
			} else {
				scoresValue += parseInt(needScores);
				needScores = 0;
			}
			
			if (scoresValue >= targetValue){
				if (clearTimer == 0){
					playSound(voice.target);
					isClear = true;
				}
			}
		}
		
		// 是否开始显示clear动画
		if (isClear){
			div.clear.show();
			if (++clearTimer < 11){
				div.clear.set('transform', 'scale(' + (3 - clearTimer * 0.2) + ', ' + ( 3 - clearTimer * 0.2) + ')');
				// div.clear.set('width', 20 - clearTimer + 'em');
			} else if (clearTimer > 30){
				isClear = false;
			}
		}
		
		// 是否有选中方块显示分数
		if (isScaleText){
			if (scaleTimer++ < 50){
				if (scaleTimer == 1){
					div.changeText.show().set('opacity', '1');
				}
				
				if (scaleTimer < 11){
					div.changeText.set('fontSize', scaleTimer * 0.3 + 'em');
				} else if (scaleTimer > 39){
					div.changeText.set('opacity', (50 - scaleTimer) * 0.1);
				}
			
			} else {
				div.changeText.hide();
				scaleTimer = 0;
				isScaleText = false;
			}
		}
		
		// 判断是否有选中抖动
		if (isSelectMove){
			if (selectMove < Math.PI){
				
				block.set(function(i, j, self){
					self[i][j].isSelect && (self[i][j].offsetY = -Math.sin(selectMove) * blockSize * 0.06);
				});
				
				selectMove += 1 / 6 * Math.PI;
			}else{
				selectMove = 0;
				isSelectMove = false;
			}
		}
		
		// 如果有特殊方块
		if (isFlash || (flashList.length > 0)) {
			flashList = flashList.filter(function(p){
				return p.size < blockSize * 0.1  || p.time > blockSize ?  false :  true;
			});
			
			block.set(function(i, j, self){
				self[i][j].type == 6 && (tmpBlock = self[i][j]);
			});
			
			if (tmpBlock && isFlash && Math.random() < 0.35){
				flashList.push({
					x: tmpBlock.x - blockSize * 0.2 + Math.random() * blockSize,
					y: tmpBlock.y - blockSize * 0.2 + Math.random() * blockSize,
					a: 2 * Math.PI * Math.random(),
					size: blockSize * 0.3 + blockSize * 0.4 * Math.random(),
					speed:  blockSize * 0.034 * Math.random(),
					time: 0,
				});
			}
			
			flashList.forEach(function(p){
				p.x += p.speed * Math.cos(p.a);
				p.y += p.speed * Math.sin(p.a);
				p.size -= blockSize * 0.002;
				p.time++;
			});
		}
		
		// 如果是下落状态，那么执行下落动画
		times = 0;
		if (isDrop) {
			block.set(function(i, j, self){
				if (self.needDrop[i][j] > 0){
					if (dropG >= self.needDrop[i][j]){
						self[i][j].y += self.needDrop[i][j];
						self.needDrop[i][j] = 0;
						if ((isStartDrop && j == 0) || ! isStartDrop){
							playSound(voice.drop);
						}
					} else {
						self[i][j].y += dropG;
						self.needDrop[i][j] -= dropG;
					}
					times++;
				}
			});
			if (! isStartDrop){
				dropG += blockSize * 0.016;
			}
		}
		
		// 如果有飞行的数字
		if (textList.length > 0) {
			textList = textList.filter(function(p){
				if (p.x - canvasWidth * 0.342 > 2 || p.x - canvasWidth * 0.342 < -2 || p.y - blockSize * 1.5 > 2 || p.y -blockSize * 1.5 < -2){
					p.x -= (p.startX - canvasWidth * 0.342) * 0.05;
					p.y -= (p.startY - blockSize * 1.5 ) * 0.05;
					return true;
				} else {
					return false;
				}
			});
		}
		
		// 下落完毕，重置信息
		if (times === 0 && ! isBlast && isDrop) {
			
			isStartDrop = false;
			block.lineDisplayList.set(0, 10);
			
			// 方块位置复原 并计数
			block.set(function(i, j, self){
				self[i][j].y = i * blockSize + offsetTop;
				self[i][j].offsetY = 0;
				self[i][j].type < 0 && self.lineDisplayList[j]++;
			}, 0, 0, true);
			
			// 交换方块类型
			block.set(function(i, j, self){
				if (self[i][j].type < 0){
					l = 1;
					while(i - l > 0 && self[i - l][j].type < 0){
						l++;
					}
					
					for (k = i; k > l - 1; k--){
						self[k][j].type = self[k - l][j].type;
					}
				}
			}, 0, 0, true);
			
			// 将多余的方块消失
			block.set(function(i, j, self){
				i < self.lineDisplayList[j] && (self[i][j].type = -1);
			});
			
			// 判断是否出现空白列 并初始化leftMoveList
			times = 0;
			
			for (j = 0; j < 10; j++){
				leftMoveList[j] = times * blockSize;
				turn = true;
				for (k = 0; k < 10; k++){
					block[k][j].type > 0 && (turn = false);
				}
				
				turn && ++times && (isLeft = true);
			}
			
			dropG = blockSize * 0.16;
			isDrop = false;
			
			! isLeft && ! isEnding && continueOperate();
		}
		
		// 如果当前是左移状态
		if (isLeft) {
			turn = true;
			for (j = 0; j < 10; j++){
				if (leftMoveList[j] > 0){
					turn = false;
					for (k = 0; k < 10; k++){
						block[k][j].x -= Math.min(blockSize * 0.2, leftMoveList[j]);
					}
					leftMoveList[j] -= Math.min(blockSize * 0.2, leftMoveList[j]);
				}
			}
			
			// 移动完成
			if (turn){
			
				// 转移js数据 此时的leftMoveList储存的是boolean 而不是之前的待移动距离
				
				// 方块位置复原 并记录消失列 和 消失列的列数
				times = 0;
				for (j = 0; j < 10; j++){
					turn = true;
					
					for (k = 0; k < 10; k++){
						block[k][j].x = j * blockSize + offsetLeft; 
						turn = block[k][j].type > 0 ? false : true;
					}
					leftMoveList[j] = turn;
					turn && times++;
				}
				
				// 交换方块类型
				for (j = 0; j < 10 - times; j++){
					if (leftMoveList[j]){
						l = 1;
						while (j + l < 10 && leftMoveList[j + l]){
							l++;
						}
						
						leftMoveList[j + l] = true;
						for (k = 0; k < 10; k++){
							block[k][j].type = block[k][j + l].type;
							block[k][j + l].type = -1;
						}
					}
				}
				
				// 将多余方块消失
				block.set(function(i, j, self){
					self[i][j].type = -1;
				}, 0, 10 - times, true);
				
				isLeft = false;
				
				! isEnding && continueOperate();
			}
		}
		
		// 判断是否可以消除下一个方块
		if (isBlast) {
			// 每刷新5次消除一个方块
			if (blastTimer++ % 5 == 0) {
				if (block.displayList.length > 0 ||  blockNums === 0){
					if (blockNums !== 0){
						playSound(voice.pop);
					}
					
					do{
						if (blockNums === 0) {
							break;
						}
						tmpBlock = block.displayList.shift();
					
						// 消失之后生成15个爆炸星星
						for (i = 0; i < 15; i++){
							starList.push({
								x: tmpBlock.j * blockSize + offsetLeft + blockSize * 0.5,
								y: tmpBlock.i * blockSize + offsetTop + blockSize * 0.5,
								type: block[tmpBlock.i][tmpBlock.j].type,
								a: Math.PI + Math.random() * Math.PI,
								size: blockSize * 0.2 + Math.random() * blockSize * 0.5,
								speed: blockSize * 0.1 + Math.random() * blockSize * 0.1,
								g: 0
							});
						}
						
						// 特殊方块消除则开始停止新增闪烁的星星
						if (block[tmpBlock.i][tmpBlock.j].type === 6){
							isFlash = false;
						}
						block[tmpBlock.i][tmpBlock.j].isSelect = false;
						block[tmpBlock.i][tmpBlock.j].type = -1;
						
					// 如果是结束阶段已经消除了10个方块还没消除结束，那么剩余的一次性消除
					} while (isEnding && blastTimer > 50 && block.displayList.length > 0);
					
					// 如果是最后一次全部消除，那么爆炸的可以再酷炫一点
					if (isEnding && blastTimer > 50){
						starList.forEach(function(p){
							p.a = 1.25 * Math.PI + 0.5 * Math.PI * Math.random();
							p.speed *= 2;
						});
					}
					
					// 结算奖励
					if ((isEnding && block.displayList.length == 0) || blockNums === 0){
						needScores += Math.max(2000 - blockNums * blockNums * 20, 0);
						isBonusScores = true;
						
						playSound(voice.clear);
						blockNums = -1;
					}
					
					// 判断是否有鼓励图标
					if (! isEnding && ! isApplause && blockNums > 7 && block.displayList.length == 0){
					
						playSound(voice.applause);
						
						l = img.good;
						applauseValue = 20;
						if (blockNums > 14){
							l = img.cool;
						}
						if (blockNums > 19){
							l = img.fantastic;
							applauseValue = 35;
						}
						
						l.show();
						isApplause = true;
					}
					
					// 生成飞向分数的字
					if (! isEnding){
						textList.push({
							startX: tmpBlock.j * blockSize + offsetLeft + blockSize * 0.5,
							startY: tmpBlock.i * blockSize + offsetTop + blockSize * 0.5,
							x: tmpBlock.j * blockSize + offsetLeft + blockSize * 0.5,
							y: tmpBlock.i * blockSize + offsetTop + blockSize * 0.5,
							num: blastNum++ * 10 + 5
						});
					}
				}else{
					blastTimer = 0;
					isBlast = false;
					drop();
				}
			}
		}
		
		// 判断是否显示鼓励图标
		if (isApplause){
			if (++applauseTimer < 70){
				if (applauseTimer == 1){
					div.applause.show();
				}
				if (applauseTimer < 11){
					div.applause.set('width', applauseValue - applauseTimer + 'em');
				} else {
					div.applause.set('opacity', applauseTimer % 8 > 4 ? 1 : 0)
				}
				
			} else {
				isApplause = false;
				div.applause.hide().set('width', '10em').set('opacity', '1');
				img.good.hide();
				img.cool.hide();
				img.fantastic.hide();
				applauseTimer = 0;
			}
		}
		
		// 判断是否有消除产生的星星
		if (starList.length > 0){
			starList = starList.filter(function(p){
				p.x += p.speed * Math.cos(p.a);
				p.y += p.speed * Math.sin(p.a) + p.g;
				p.g += blockSize * 0.008;
				
				p.size = p.size > 0.2 ? p.size - 0.2 : p.size
				
				if (p.x > canvasWidth + blockSize * 0.5 || p.x < -blockSize * 0.5 || p.y > canvasHeight + blockSize * 0.5){
					return false;
				}else{
					return true;
				}
			});
		}
		
		// 如果是结束中，那么尝试闪烁
		if (isEnding) {
			if (++endTimer < 101){
				block.set(function(i, j, self){
					self[i][j].offsetX = (endTimer % 10 > 5 ? 1 : 0) * blockSize * 200;
				});
			} else if (endTimer == 101){
					blast();
			}
		}
		
		// 检测本局是否结算完成
		if (isEnding && endTimer > 100 && block.displayList.length == 0 && starList.length == 0 && needScores == 0 && bonusScoresTimer > 10) {
			gameEnd();
		}
	
		// 检测是否显示剩余方块数量
		if (isStarsLeft) {
			if (++starsLeftTimer < 11){
				div.starsLeftText.show();
				starsLeftValue = blockSize * 2 - starsLeftTimer * blockSize * 0.14 + 'px';
			} else {
				isStarsLeft = false;
			}
		}
		
		// 检测是否显示奖励分数
		if (isBonusScores) {
			if (++bonusScoresTimer < 11){
				div.bonusScoresText.show();
				bonusScoresValue = blockSize * 1.5 - bonusScoresTimer * blockSize * 0.09 + 'px';
			} else {
				isBonusScores = false;
			}
		}
	}
	
	function gameEnd(){
		isOperate = true;
		isStart = false;
		isEnding = false;
		endTimer = 0;
		clearTimer = 0;
		applauseTimer = 0;
		bonusScoresTimer = 0;
		div.starsLeftText.hide();
		div.bonusScoresText.hide();
		div.clear.hide();
			
		if (scoresValue >= targetValue) {
			// console.log('continue game');
			start();
		} else {
			// console.log('game over');
			div.gameOver.show();
			highestValue = Math.max(highestValue, scoresValue);
			div.highest.html(highestValue);
		}
	}
	
	// 绘制部分
	function draw(){
	
		if (isStart) {
			calculate();
		}
		
		// 刷新分数
		div.scores.html(scoresValue);
		
		if (isStarsLeft){
			div.starsLeftText.set('fontSize', starsLeftValue);
		}
		if (isBonusScores){
			div.bonusScoresText.set('fontSize', bonusScoresValue);
		}
		
		ctx.drawImage(background, 0, 0, 768, 1024, 0, 0, canvasWidth, canvasHeight);
		
		// 绘制方块
		block.set(function(i, j, self){
			if (self[i][j].type > 0){
				ctx.drawImage(img.block, (self[i][j].type - 1) * 100, 0, 100, 100, self[i][j].x + self[i][j].offsetX, self[i][j].y + self[i][j].offsetY, blockSize, blockSize);
			}
		});
		
		// 绘制选择框
		block.set(function(i, j, self){
			if (self[i][j].isSelect){
				ctx.drawImage(img.select, 0, 0, 100, 100, self[i][j].x + self[i][j].offsetX, self[i][j].y + self[i][j].offsetY, blockSize, blockSize);
			}
		});
		
		// 绘制特殊方块的星星
		if (flashList.length > 0){
			flashList.forEach(function(p){
				ctx.drawImage(img.flash, 0, 0, 30, 30, p.x, p.y, p.size, p.size);
			});	
		}
		
		// 绘制飞行的数字
		if (textList.length > 0){
			ctx.fillStyle = "#ffffff";
			textList.forEach(function(p){
				ctx.fillText(p.num, p.x, p.y);
			});
		}
	
		// 绘制星星
		if (starList.length > 0){
			starList.forEach(function(p){
				ctx.drawImage(img.star, (p.type - 1) * 50, 0, 50, 50, p.x, p.y, p.size, p.size);
			});
		}
		
		requestAnimationFrame(draw);
	}
	
	function select(x, y){
		if (! isOperate){
			return false;
		}
		if (x < offsetLeft || x > offsetLeft + blockSize * 10 || y < offsetTop){
			return false;
		}
		
		var selectRow = parseInt((y - offsetTop) / blockSize),
			selectCol = parseInt((x - offsetLeft) / blockSize),
			selectType = block[selectRow][selectCol].type,
			selectBlockList = [], // 最终选中的方块
			isCheckedBlock = [], // 已经检查过的方块
			checkBlockList = [], // 待检查的方块数组
			tmpRow,
			tmpCol;
		
		if (block[selectRow][selectCol].isSelect){
			blast();
		} else if (block[selectRow][selectCol].type < 0 || block[selectRow][selectCol].type === 6){
			return false;
		} else {
			isCheckedBlock.set(false, 10, 10);
			
			// BFS
			checkBlockList.push({row: selectRow, col: selectCol});
			while (checkBlockList.length > 0){
			
				// 取出队列中第一个方块
				tmpBlock = checkBlockList.shift();
				tmpRow = tmpBlock.row;
				tmpCol = tmpBlock.col;
				
				if (! isCheckedBlock[tmpRow][tmpCol]){
					isCheckedBlock[tmpRow][tmpCol] = true;
					selectBlockList.push({row: tmpRow, col: tmpCol});
					
					for (i = -1; i < 2 ; i++){
						for (j = -1; j < 2; j++){
							if (((Math.abs(i) + Math.abs(j) < 2) && // 保证是上下左右
								tmpRow + i > -1 && tmpRow + i < 10 && // 保证横向不出界
								tmpCol + j > -1 && tmpCol + j < 10) && // 保证纵向不出界
								((block[tmpRow + i][tmpCol + j].type === 6) || // 万能方块直接通过
								(! isCheckedBlock[tmpRow + i][tmpCol + j] && // 还没有检查过的方块
								block[tmpRow + i][tmpCol + j].type === selectType))){ // 搜索到的方块类型与当前方块类型相同
								
								// 那么加入待选择列表
								checkBlockList.push({row: tmpRow + i, col: tmpCol + j});
							}
						}
					}
				}
			}
			
			block.setSelect(selectBlockList);
			if (selectBlockList.length > 1){
				scaleTimer = 0;
				isSelectMove = true;
				isScaleText = true;
				
				blockNums = selectBlockList.length;
				
				div.blockNums.html(blockNums);
				div.blockScores.html(blockNums * blockNums * 5);
				blastNum = 0;
			}
			
		}
	}
	
	function newGame(){
		if (confirm('您确定要开始新游戏吗?')){
			div.gameOver.onclick();
		}
	}
	
	// 绑定事件
	if (isTouch){
		c.addEventListener('touchstart', function(e){
			y = e.targetTouches[0].pageY - div.container.offsetTop;
			x = e.targetTouches[0].pageX - div.container.offsetLeft;
			select(x, y);
		});
		div.new.addEventListener('touchstart', function(e){
			newGame();
		});
	} else {
		c.addEventListener('mousedown', function(e){
			y = e.layerY;
			x = e.layerX;
			select(x, y);
		});
		div.new.addEventListener('mousedown', function(e){
			newGame();
		});
	}
	
	div.gameOver.onclick = function(){
		if (! isOperate || needScores > 0){
			return false;
		}
		gameEnd();
		needScores = 0;
		textList.length = 0;
		starList.length = 0;
		
		stageValue = 0;
		scoresValue = 0;
		this.hide();
		start();
	}
	
	window.onbeforeunload = function(){
	
		if (! isOperate || needScores > 0 || ! isStart){
			return '现在离开可能会丢失数据';
		}
		if(window.localStorage){
			localStorage.clear();
			localStorage.stageValue = stageValue;
			localStorage.targetValue = targetValue;
			localStorage.highestValue = highestValue;
			localStorage.scoresValue = scoresValue;
			localStorage.block = JSON.stringify(block);
			localStorage.clearDisplay = div.clear.style.display;
			localStorage.isFlash = isFlash;
		}
	}
	
	window.onkeydown = function(e){
		if (e.keyCode === 113) {
			div.gameOver.onclick();
		}
	}
	
	// 给外部的API
	var popstar = {
		getBlock: function(){
			var tmpBlock = [];
			tmpBlock.set(function(i, j){
				return {
					x: block[i][j].x,
					y: block[i][j].y,
					type: block[i][j].type,
					isSelect: block[i][j].isSelect
				};
			}, 10, 10);
			
			return tmpBlock;
		},
		clickBlock: function(x, y){
			select(x, y);
		}
	};
	
}