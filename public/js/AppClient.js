//add <preference name="Orientation" value="landscape" /> to the config.xml file to lock orientation to landscape
//https://cordova.apache.org/docs/en/3.1.0/config_ref/index.html
//where we store circles x,y,radius
var circles = [];//global so that the pug script can access it
var App = (function(){
	'use strict';

	var AppClient = (function(){
		var width = null;
		var height = null;
		var canvas = null;
		var ctx = null;
		function initGameMouse(){
			window.addEventListener('touchstart', inputListeners.touchStart, false);
			window.addEventListener('touchmove', inputListeners.touchMove, false);
			window.addEventListener('touchend', inputListeners.touchEnd, false);
			window.addEventListener('mousedown', inputListeners.mouseDown, false);
			window.addEventListener('mousemove', inputListeners.mouseMove, false);
			window.addEventListener('mouseup', inputListeners.mouseUp, false);
		};
		function clearGameMouse(){
			window.removeEventListener('touchstart', inputListeners.touchStart, false);
			window.removeEventListener('touchmove', inputListeners.touchMove, false);
			window.removeEventListener('touchend', inputListeners.touchEnd, false);
			window.removeEventListener('mousedown', inputListeners.mouseDown, false);
			window.removeEventListener('mousemove', inputListeners.mouseMove, false);
			window.removeEventListener('mouseup', inputListeners.mouseUp, false);
		}
		//for all circles, check if this x,y intersects a circle, return the ID of that circle, o/w -1
		function hitACircle(x, y) {
		  var hitID = -1;
		  circles.forEach(function(c, i) {
		    if (pointHitsCircle({
		        x: x,
		        y: y
		      }, c)) {
		      hitID = i
		      return;
		    }
		  });
		  return hitID;
		};
		//check if x,y point is inside a circle
		function pointHitsCircle(objPoint, objCircle) {
		  var distSq = (((objPoint.x - objCircle.x) * (objPoint.x - objCircle.x)) + ((objPoint.y - objCircle.y) * (objPoint.y - objCircle.y)));
		  var radiusSq = (objCircle.radius * objCircle.radius);
		  return (distSq < radiusSq);
		};
		//check if 2 circles intersect (if their distance is less than both their radii, they overlap)
		function circlesIntersect(circleA, circleB) {
		  var distSq = (((circleA.x - circleB.x) * (circleA.x - circleB.x)) + ((circleA.y - circleB.y) * (circleA.y - circleB.y)));
		  var radiiSq = ((circleA.radius + circleB.radius) * (circleA.radius + circleB.radius));
		  return (distSq < radiiSq);
		};
		//get angle in radians between two points
		function getAngle(pointA, pointB) {
		  return Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y);
		};
		//do collision detection and update circle positions upon this
		function updateCircles() {
		  var angle;
		  var moveDist = 1; //move 1px each step
		  var i = 0;
		  var len = Math.ceil(circles.length / 3);
		  for (i = 0; i < len; i++) {
		    circles.forEach(function(ca, i) {
		      circles.forEach(function(cb, j) {
		        if (i != j) {
		          while (circlesIntersect(ca, cb)) {
		            angle = getAngle(ca, cb);
		            ca.x -= Math.sin(angle) * moveDist;
		            ca.y -= Math.cos(angle) * moveDist;
		            cb.x += Math.sin(angle) * moveDist;
		            cb.y += Math.cos(angle) * moveDist;
		          }
		        }
		      });
		    });
		  }
		};
		//add new circle to the circles array
		function createCircle(x, y, radius) {
		  circles.push({
		    x: x,
		    y: y,
		    radius: radius
		  });
		};
		//draw a single circle
		function drawCircle(x, y, radius) {
		  ctx.moveTo(x + radius, y);
		  ctx.arc(x, y, radius, 0, Math.PI * 2);
		};
		//draw all circles
		function drawApp() {
		  ctx.clearRect(0, 0, width, height);
		  ctx.beginPath();
		  circles.forEach(function(c) {
		    drawCircle(c.x, c.y, c.radius);
		  });
		  ctx.closePath();
		  //stroke and fill once is more efficient than for each circle
		  //however, if each circle has different colours, then it is required to fill them inside the forEach loop.
		  ctx.fillStyle = 'yellow';
		  ctx.fill();
		  ctx.strokeStyle = 'black';
		  ctx.lineWidth = 5;
		  ctx.stroke();
		};
		
		//ID in circles array of clicked circle
		var circleClickedID = -1;
		//circle object clicked/dragging.
		var circle = null;
		//offset between mouse x,y and circle x,y
		var offsetX = 0;
		var offsetY = 0;
		function initGame(){
			initGameMouse();
			//create starting circle in center of canvas
			createCircle(width / 2, height / 2, 50);
			//draw it
			drawApp();
		}
		var mouse = {
			isDown: false,
			touches:[]
		};
		function onDown(e, touches){
			var x,y;
			var i = 0;
			var len, touch;
			var elAtPoint;
			mouse.isDown = true;
			if(typeof touches != 'undefined'){
				len = touches.length;
				for(i=0;i<len;i++){
					touch = touches[i];
					x = touch.pageX;
					y = touch.pageY;
					mouse.touches.push({x:x,y:y,n:i});
				}
			} else {
				mouse.touches.push({x:e.pageX,y:e.pageY,n:0});
			}
			x = mouse.touches[0].x;
			y = mouse.touches[0].y;
			elAtPoint = document.elementFromPoint(x,y);
			console.log(elAtPoint.tagName);
			if(elAtPoint.tagName == 'CANVAS'){
				circleClickedID = hitACircle(x, y);
				circle = circles[circleClickedID];
				if (circleClickedID != -1) {
					offsetX = circle.x - x;
					offsetY = circle.y - y;
				} else {
					//create a circle at mouse x,y with radius between 25 and 75.
					createCircle(x, y, Math.random()*50+25);
				}
				updateCircles();
				drawApp();
			}
		}
		function onMove(e, touches){
			var x,y;
			var i = 0;
			var len, touch;
			//if dragging
			if(mouse.isDown){
				if(typeof touches != 'undefined'){
					len = touches.length;
					for(i=0;i<len;i++){
						touch = touches[i];
						x = touch.pageX;
						y = touch.pageY;
						mouse.touches[i] = {x:x,y:y,n:i};
					}
				} else {
					mouse.touches[0] = {x:e.pageX,y:e.pageY,n:0};
				}
				x = mouse.touches[0].x;
				y = mouse.touches[0].y;
				if (circleClickedID != -1) {
					circle.x = x + offsetX;
					circle.y = y + offsetY;
					updateCircles();
					drawApp();
			    }
			}
		}
		function onUp(e, touches){
			mouse.isDown = false;
			circleClickedID = -1;
			circle = null;
			mouse.touches = [];
		}
		var inputListeners = {
			touchStart: function(e){onDown(e.touches[0], e.touches);},
			touchMove: function(e){onMove(e.touches[0], e.touches)},
			touchEnd: function(e){onUp(e.changedTouches[0], e.changedTouches)},

			mouseDown: function(e){onDown(e);},
			mouseMove: function(e){onMove(e)},
			mouseUp: function(e){onUp(e)}
		};
		function initializeApp(){			
			if(typeof window.console == 'undefined') {
			  window.console = {log: function (msg) {}, warn: function(msg){}};
			}
			window.onerror = function(msg) {
			  console.log("error message:", msg);
			};
			var onWindowResized = function(){
				width = window.innerWidth;
				height = window.innerHeight;
				canvas.width = width;
				canvas.height = height;
				drawApp();
			};
			var onWindowLoaded = function(){
				console.log("window loaded");
				canvas = document.getElementById('canvas');
				ctx = canvas.getContext('2d');
				onWindowResized();
				initGame();
				var selectEl = document.getElementById('select-load');
				$('#btn-load').on('click', function(e){
					var selVal = selectEl.value;
					$.ajax({
					  type: "GET",
					  url: '/load',
					  data: {fileName:selVal},
					  success: function(data){
					  	console.log("loaded,",data);
					  	circles = data;
					  	updateCircles();
					  	drawApp();
					  },
					  error: function(data){
					    console.log("fail");
					  }
					});
				});
			};
			//Initialize program
			//document.addEventListener("deviceready", onDeviceReady, false);
			window.addEventListener('load', onWindowLoaded, false);
			window.addEventListener('resize', onWindowResized, false);
		};
		//exports
		var AppClient = {
		};
		initializeApp();//Auto initializes self (load) if this module is in the code
		return AppClient;
	}());
	window.requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       || 
			  window.webkitRequestAnimationFrame || 
			  window.mozRequestAnimationFrame    || 
			  window.oRequestAnimationFrame      || 
			  window.msRequestAnimationFrame     || 
			  function( callback ){
				window.setTimeout(callback, 1000 / 30);//30 times per second
			  };
	})();
}());