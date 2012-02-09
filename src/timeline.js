//  Timeline.js v0.1 / 2011-05-01       
//  A compact JavaScript animation library with a GUI timeline for fast editing.
//  by Marcin Ignac (http://marcinignac.com) 
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

var Timeline = function() {    
	this.name = "Global";
	this.anims = [];
	this.targets = [];   
	this.time = 0;      
	this.totalTime = 0; 
	this.loopCount = 0;	
	this.loopMode = 0;	 
	this.playing = true;
	
	var self = this;
	
	setInterval(function() { 
		self.update();
	}, 1000/30);
	
	this.draw();
}   
  
Timeline.currentInstance = null;     

Timeline.getGlobalInstance = function() {
	if (!Timeline.globalInstance) {
		Timeline.globalInstance = new Timeline();
	}                                      
	return Timeline.globalInstance;
}    

//Possible values of n:
//-1 infinite loop
//0  play forever without looping, continue increasing time even after last animation
//1  play once and stop at the time the last animation finishes
//>1 loop n-times
Timeline.prototype.loop = function(n) {
  this.loopMode = n;
} 

Timeline.prototype.draw = function(){

	if(this.playing){	
		this.updateCss();
	}
	
	requestAnimationFrame(this.draw.bind(this), document.body);	
}

Timeline.prototype.updateCss = function(){
	for (var i=0; i<this.targets.length; i++){ 

		//position styles
		this.targets[i].element.style.position = "absolute";
		this.targets[i].element.style.left = this.targets[i].x + "px";
		this.targets[i].element.style.top = this.targets[i].y + "px"; 
		
		//transform styles
		this.targets[i].element.style["-webkit-transform"] = "rotate(" + this.targets[i].rotation + "deg)"; 
		this.targets[i].element.style["-moz-transform"] = "rotate(" + this.targets[i].rotation + "deg)"; 
		this.targets[i].element.style["-o-transform"] = "rotate(" + this.targets[i].rotation + "deg)"; 
		this.targets[i].element.style["transform"] = "rotate(" + this.targets[i].rotation + "deg)"; 
		this.targets[i].element.style["MozTransform"] = "rotate(" + this.targets[i].rotation + "deg)";
		this.targets[i].element.style["WebkitTransform"] = "rotate(" + this.targets[i].rotation + "deg)";
		this.targets[i].element.style["msTransform"] = "rotate(" + this.targets[i].rotation + "deg)";
		this.targets[i].element.style.transform = "rotate(" + this.targets[i].rotation + "deg)"; 
		
		//opacity styles
		this.targets[i].element.style.opacity  = this.targets[i].opacity;
	
		//for test
		this.targets[i].element.style.background = "#FF0000";
		this.targets[i].element.style.width = this.targets[i].width + "px";
		this.targets[i].element.style.height = this.targets[i].height + "px"; 
	}
}       

Timeline.prototype.stop = function() {
  this.playing = false;  
  this.time = 0;       
  this.prevTime = this.time - 1/30; //FIXME 1/30
} 

Timeline.prototype.pause = function() {
  this.playing = false;  
} 

Timeline.prototype.play = function() {
  this.playing = true;
}         

Timeline.prototype.preUpdate = function() {
  //placeholder for hooks like GUI rendering
}

Timeline.prototype.update = function() {  
  this.preUpdate();
                   
  if (this.playing) {
    this.totalTime += 1/30;   
    this.prevTime = this.time;
    this.time += 1/30;  
  }
  
  if (this.loopMode != 0) {
    var animationEnd = this.findAnimationEnd();
    if (this.time > animationEnd) {
      this.loopCount++;
      this.time = 0;
    }
    if (this.loopMode == -1) {
      //loop infinitely
    }  
    else {
      if (this.loopCount >= this.loopMode) {
        this.playing = false;
      }
    }
  }     

  this.applyValues();             
}                                            

Timeline.prototype.findAnimationEnd = function() {
  var endTime = 0;   
  for(var i=0; i<this.anims.length; i++) {
    if (this.anims[i].endTime > endTime) {
      endTime = this.anims[i].endTime;
    }
  }             
  return endTime;
} 

Timeline.prototype.applyValues = function() {  
	for(var i=0; i<this.anims.length; i++) { 
		var propertyAnim = this.anims[i];               			
		if (this.time < propertyAnim.startTime) {
			continue;
		} 
		//if start time happened during last frame
		if (this.prevTime <= propertyAnim.startTime && propertyAnim.startTime <= this.time) {      		  
		  propertyAnim.startValue = propertyAnim.target[propertyAnim.propertyName]; 
		}                                       
		if (this.prevTime <= propertyAnim.endTime && propertyAnim.endTime <= this.time) {      		  
	    propertyAnim.target[propertyAnim.propertyName] = propertyAnim.endValue;   		  
			continue;
		}        		                                                                               
		if (propertyAnim.endTime - propertyAnim.startTime == 0) {
		  continue;
		}
		var t = (this.time - propertyAnim.startTime)/(propertyAnim.endTime - propertyAnim.startTime);					                                  			 			
		t = propertyAnim.easing(t);
		t = Math.max(0, Math.min(t, 1));                                                                          		
		propertyAnim.target[propertyAnim.propertyName] = propertyAnim.startValue + (propertyAnim.endValue - propertyAnim.startValue) * t;			
	}
}  

//--------------------------------------------------------------------
    
function Anim(name, target, timeline) {   
	this.startTime = 0;
	this.endTime = 0;   
	this.time = 0;
	this.propertyAnims = [];
	            
	this.name = name;
	this.target = target;
	this.timeline = timeline;
	
	for (var i = 0; i < timeline.targets.length; i++)
		if (timeline.targets[i] == target)
			return false;
	
	timeline.targets.push(target);
} 
                                 
//delay, properties, duration, easing
Anim.prototype.to = function() {  
  var args = [];
  for(var i=0; i<arguments.length; i++) {
    args.push(arguments[i]);
  }
  var delay;
  var properties;
  var duration;
  var easing;       
  
  if (typeof(args[0]) == "number") {    
    delay = args.shift();
  }                      
  else {
    delay = 0;
  }     
                          
  if (typeof(args[0]) == "object") {
    properties = args.shift();    
  }                   
  else {
    properties = {};
  }                  
  
  if (typeof(args[0]) == "number") {
    duration = args.shift();
  }                   
  else {
    duration = 1;
  }   
  
  if (typeof(args[0]) == "function") {
    easing = args.shift();    
  }                   
  else {
    easing = Timeline.Easing.Linear.EaseNone;
  }           
  
	for(var propertyName in properties) {	  
		this.timeline.anims.push({ 
		  timeline: this.timeline,
		  targetName: this.name,  
		  target: this.target,
			propertyName: propertyName,                   
			endValue: properties[propertyName],
			delay: delay,
			startTime: this.timeline.time + delay + this.endTime,
			endTime: this.timeline.time + delay + this.endTime + duration,
			easing: easing
		});
	}
	this.endTime += delay + duration;
	return this;
}      

function anim(targetName, targetObject, parentTimeline) { 
  var args = [];
  for(var i=0; i<arguments.length; i++) {
    args.push(arguments[i]);
  }
  var name;
  var target; 
  var timeline;   
  
  if (typeof(args[0]) == "string") {   
    name = args.shift();     
  }         
                          
  if (typeof(args[0]) == "object") {
    target = args.shift();    
  }                   
  else {
    target = {};
  } 
  
  if (typeof(args[0]) == "object") {
    timeline = args.shift();    
  }                   
  else {
    timeline = Timeline.getGlobalInstance();
  }              
  
  var anim = new Anim(name, target, timeline);
   
	return anim;
}      

//--------------------------------------------------------------------

Timeline.Easing = { Linear: {}, Quadratic: {}, Cubic: {}, Quartic: {}, Quintic: {}, Sinusoidal: {}, Exponential: {}, Circular: {}, Elastic: {}, Back: {}, Bounce: {} };

Timeline.Easing.Linear.EaseNone = function ( k ) {
	return k;
};           

Timeline.Easing.Quadratic.EaseIn = function ( k ) {
	return k * k;
};

Timeline.Easing.Quadratic.EaseOut = function ( k ) {
	return - k * ( k - 2 );
};

Timeline.Easing.Quadratic.EaseInOut = function ( k ) {
	if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
	return - 0.5 * ( --k * ( k - 2 ) - 1 );
};

Timeline.Easing.Cubic.EaseIn = function ( k ) {
	return k * k * k;
};

Timeline.Easing.Cubic.EaseOut = function ( k ) {
	return --k * k * k + 1;
};

Timeline.Easing.Cubic.EaseInOut = function ( k ) {
	if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
	return 0.5 * ( ( k -= 2 ) * k * k + 2 );
};

Timeline.Easing.Elastic.EaseIn = function( k ) {
	var s, a = 0.1, p = 0.4;
	if ( k == 0 ) return 0; if ( k == 1 ) return 1; if ( !p ) p = 0.3;
	if ( !a || a < 1 ) { a = 1; s = p / 4; }
	else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
	return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
};

Timeline.Easing.Elastic.EaseOut = function( k ) {
	var s, a = 0.1, p = 0.4;
	if ( k == 0 ) return 0; if ( k == 1 ) return 1; if ( !p ) p = 0.3;
	if ( !a || a < 1 ) { a = 1; s = p / 4; }
	else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
	return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
};

Timeline.Easing.Elastic.EaseInOut = function( k ) {
	var s, a = 0.1, p = 0.4;
	if ( k == 0 ) return 0; if ( k == 1 ) return 1; if ( !p ) p = 0.3;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
        if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
};

Timeline.Easing.Back.EaseIn = function( k ) {
	var s = 1.70158;
	return k * k * ( ( s + 1 ) * k - s );
};

Timeline.Easing.Back.EaseOut = function( k ) {
	var s = 1.70158;
	return ( k = k - 1 ) * k * ( ( s + 1 ) * k + s ) + 1;
};

Timeline.Easing.Back.EaseInOut = function( k ) {
	var s = 1.70158 * 1.525;
	if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
	return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
};

Timeline.Easing.Bounce.EaseIn = function( k ) {
	return 1 - Timeline.Easing.Bounce.EaseOut( 1 - k );
};

Timeline.Easing.Bounce.EaseOut = function( k ) {
	if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
		return 7.5625 * k * k;
	} else if ( k < ( 2 / 2.75 ) ) {
		return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
	} else if ( k < ( 2.5 / 2.75 ) ) {
		return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
	} else {
		return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
	}
};

Timeline.Easing.Bounce.EaseInOut = function( k ) {
	if ( k < 0.5 ) return Timeline.Easing.Bounce.EaseIn( k * 2 ) * 0.5;
	return Timeline.Easing.Bounce.EaseOut( k * 2 - 1 ) * 0.5 + 0.5;
};     

Timeline.easingFunctionToString = function( f ) { 
  for(var name in Timeline.easingMap) {           
    if (Timeline.easingMap[name] == f) {          
      return name;
    }
  }
}    

Timeline.stringToEasingFunction = function( name ) { 
  return Timeline.easingMap[name];
}

Timeline.easingMap = {    
}    

for(var easingFunctionFamilyName in Timeline.Easing) {
  var easingFunctionFamily = Timeline.Easing[easingFunctionFamilyName];
  for(var easingFunctionName in easingFunctionFamily) {   
    Timeline.easingMap[easingFunctionFamilyName + "." + easingFunctionName] = easingFunctionFamily[easingFunctionName];
  }  
}


/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
            
if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( function() {

		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

			window.setTimeout( callback, 1000 / 60 );

		};

	} )();

}