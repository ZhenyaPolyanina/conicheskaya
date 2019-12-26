  // TODO: leaves must be alive
    // TODO: add live stars
    // TODO: make live grass

    var startLength = (window.innerHeight/10);
    var startWeight = (startLength/5);
    var branchSteps = 10;
//    var branchColor = "#180c09";
    var branchColor = "#383838";
    var branchColors = [
        "#341b0a",
        "#100805",
        "#000000",
        "#291900",
        "#161a00",
    ];
    var angle = 0;
    var randomAngle = 20;

    var iSrandomAngle = true;
    var growAngle = true;
    var angleGrowSpeed = 3;
    var randomPoint = false;

    var leafColor = "#4dc332";
    var leafMaxSize = (startLength/4);
    var leafMinSize = (startLength/4);
    var leafGrowing = true;

    var lastPoints = [];
    var finalBranchesCount = 1;
	var starsCount = 300;
	var stars = [];

	var grass_lenght = 30;
	var grass_cout = 200;
	var grass_color = "#304d3b";
	var grass_angle = -80;
	var grass_angle_direction = false;
	var grass = [];

  var leafcolor = [87,174,8];
	
    for(var i=0;i<starsCount;i++) stars.push({
		size: (Math.random()*10)%3+1,
		currenSize: (Math.random()*10)%3+1,
		x: window.innerWidth*Math.random(),
		y: (window.innerHeight-90)*Math.random(),
		growing: false
	});


    var canvas = document.getElementById("myCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context = canvas.getContext('2d');

    var canvas2 = document.getElementById("leaves");
    canvas2.width = window.innerWidth;
    canvas2.height = window.innerHeight;
    context2 = canvas2.getContext('2d');
	
	var canvas3 = document.getElementById("stars");
    canvas3.width = window.innerWidth;
    canvas3.height = window.innerHeight;
    context3 = canvas3.getContext('2d');

	var canvas4 = document.getElementById("grass");
    canvas4.width = window.innerWidth;
    canvas4.height = window.innerHeight;
    context4 = canvas4.getContext('2d');

	makeStars();
	setInterval(animateStar,400);
	setInterval(animateStar,400);
    setInterval(animateStar,400);
    setInterval(animateStar,400);
    init_grass();
    draw();


    function draw(branches = []){

        if(branches.length == 0){
            branches = [{
                x: window.innerWidth/2,
                y: window.innerHeight-50,
                angle: -90,
                length: startLength,
                currentLength: 0,
                currentX: 0,
                currentY: 0,
                weight: startWeight,
                step: 1
            }];
        }

        var newBranches = [];
        var finished = false;

        for(var i in branches){

            if(branches[i].currentLength >= branches[i].length){

                if(branches[i].step >= branchSteps){ finished = true; break;}

                var Cangle1 = 0;
                var Cangle2 = 0;

                if(iSrandomAngle){
                    Cangle1 = angle+parseInt(Math.random()*1000%randomAngle);
                    Cangle2 = angle+parseInt(Math.random()*1000%randomAngle);  
                }else{
                    Cangle1 = angle;
                    Cangle2 = angle;
                }
                    

                if(growAngle){
                    Cangle1 += branches[i].step * angleGrowSpeed;
                    Cangle2 += branches[i].step * angleGrowSpeed; 
                }
                    

                newBranches.push({
                    x: branches[i].currentX,
                    y: branches[i].currentY,
                    angle: (branches[i].angle-Cangle1),
                    length: parseInt((startLength/branchSteps)*(branchSteps-branches[i].step+3)),
                    currentLength: 0,
                    currentX: 0,
                    currentY: 0,
                    weight: branches[i].weight,
                    step: (branches[i].step+1)
                });
                newBranches.push({
                    x: branches[i].currentX,
                    y: branches[i].currentY,
                    angle: branches[i].angle+Cangle2,
                    length: parseInt((startLength/branchSteps)*(branchSteps-branches[i].step+3)),
                    currentLength: 0,
                    currentX: 0,
                    currentY: 0,
                    weight: branches[i].weight,
                    step: (branches[i].step+1)
                });
            }

            if(newBranches.length == 0){
                branches[i] = makePoint(branches[i]);
                branches[i].currentLength += 1;
                branches[i].currentX = branches[i].x + (cos(branches[i].angle) * branches[i].currentLength);
                branches[i].currentY = branches[i].y + (sin(branches[i].angle) * branches[i].currentLength);
            }

        }

        if(finished)
            return drawLeaf(branches,0);

        if(newBranches.length > 0)
            requestAnimationFrame(function(){draw(newBranches)});
        else
            requestAnimationFrame(function(){draw(branches)});
    }


    function drawLeaf(branches,size){

        context2.clearRect(0, 0, canvas2.width, canvas2.height);
      
      // console.log('rgba('+leafcolor[0]+','+leafcolor[1]+','+leafcolor[2]+',.8)');
      
        for(var i in branches){

            var branch = branches[i];
            var radgrad =       context2.createRadialGradient(branch.currentX,branch.currentY,0,branch.currentX,branch.currentY,size);
            radgrad.addColorStop(0, 'rgba('+leafcolor[0]+','+leafcolor[1]+','+leafcolor[2]+',.8)');
            radgrad.addColorStop(1, 'rgba('+leafcolor[0]+','+leafcolor[1]+','+leafcolor[2]+',0)');

            context2.beginPath();
            context2.arc(branch.currentX, branch.currentY, size, 0, 2 * Math.PI, false);
            context2.fillStyle = radgrad;
            context2.fill();

        }

        if(size < leafMaxSize && leafGrowing)
            size += 0.1;
        else if(size > leafMinSize && !leafGrowing)
            size -= 0.1;
        else if((size >= leafMaxSize && leafGrowing) || (size <= leafMinSize && !leafGrowing)){
          if(leafcolor[0] < 237)
            leafcolor[0]=leafcolor[0]+1;
          if(leafcolor[1] > 117)
              leafcolor[1]=leafcolor[1]-1;
          if(leafcolor[2] < 31)
              leafcolor[2]=leafcolor[2]+1;
            leafGrowing = !leafGrowing;
        }

        requestAnimationFrame(function(){drawLeaf(branches,size);});
    }


    function makePoint(branch){

//        var color = branchColors[ parseInt((Math.random()*100)%(branchColors.length-1)) ];
        var color = branchColor;
//        console.log((Math.random()*100)%(branchColors.length-1));
//        console.log(color);
//        return;

        var weight = startWeight - (startWeight/branchSteps*branch.step) + 1;
        var minWeight = weight - (startWeight - (startWeight/branchSteps*(branch.step+1)) + 1);
        weight = weight - (minWeight/branch.length*branch.currentLength)+1;

        context.beginPath();
        if(randomPoint)
			context.arc(branch.currentX+(Math.random()*(branchSteps-branch.step)), branch.currentY+(Math.random()*(branchSteps-branch.step)), weight, 0, 2 * Math.PI, false);
        else
            context.arc(branch.currentX, branch.currentY, weight, 0, 2 * Math.PI, false);
        context.fillStyle = color;
//        context.fillStyle = branchColor;
        context.fill();

        if(branch.weight > 1)
            branch.weight--;

        return branch;
    }

	
	function makeStars(){
	
		context3.clearRect(0, 0, canvas3.width, canvas3.height);
		for(var i in stars){
			if(stars[i].currenSize > stars[i].size && !stars[i].growing) 
			stars[i].currenSize -= 0.05;
			var radgrad = context3.createRadialGradient(stars[i].x, stars[i].y,0,stars[i].x, stars[i].y,stars[i].currenSize);
            radgrad.addColorStop(0, 'rgba(255, 255, 255,1)');
            radgrad.addColorStop(0.6, 'rgba(255, 255, 255,0)');
			
			context3.beginPath();
			context3.arc(stars[i].x, stars[i].y, stars[i].currenSize, 0, 2 * Math.PI, false);
			//context.fillStyle = "#cccccc";
			context3.fillStyle = radgrad;
			context3.fill();
		}
		
		requestAnimationFrame(function(){makeStars();});
	}
    
	function animateStar(star = false,size = 0){
		if(size > 20 || star.currenSize > 6){
			star.growing = false;
			return;
		}
		if(!star){
			var s = parseInt(starsCount*Math.random());
			star = stars[s];
			star.growing = true;
		}
		star.currenSize += 0.3;
		size++;
		requestAnimationFrame(function(){animateStar(star,size);});
	}

	function init_grass() {
	    if(grass.length == 0)
            for (var i = 0; i < grass_cout; i++)
                grass.push({
                    x : window.innerWidth*Math.random(),
                    y : window.innerHeight-70,
                    angle: -70 - (Math.random()*40),
                    direction: true,
                    x2 : this.x + (cos(this.angle) * grass_lenght),
                    y2 : this.y + (sin(this.angle) * grass_lenght),
                });

        context4.clearRect(0, 0, canvas4.width, canvas4.height);

        context4.beginPath();
        context4.moveTo(0, window.innerHeight-70);
        context4.lineTo(window.innerWidth, window.innerHeight-70);
        context4.lineWidth = 3;

        context4.strokeStyle = grass_color;
        context4.stroke();

        for (var i = 0; i < grass.length; i++){

            if(grass[i].direction)
                grass[i].angle -= 0.4;
            else
                grass[i].angle += 0.4;

            if((grass[i].direction && grass[i].angle < -110) || (!grass[i].direction && grass[i].angle > -70))
                grass[i].direction = !grass[i].direction;

            grass[i].x2 = grass[i].x + (cos(grass[i].angle) * grass_lenght);
            grass[i].y2 = grass[i].y + (sin(grass[i].angle) * grass_lenght);

            context4.beginPath();
            context4.moveTo(grass[i].x, grass[i].y);
            context4.lineTo(grass[i].x2, grass[i].y2);
            context4.lineWidth = 2;

            context4.strokeStyle = grass_color;
            context4.stroke();
        }

        requestAnimationFrame(init_grass);
    }


	
	function cos (angle) {
        return Math.cos(deg_to_rad(angle));
    }
    function sin (angle) {
        return Math.sin(deg_to_rad(angle));
    }
    function deg_to_rad(angle){
        return angle*(Math.PI/180.0);
    }
    function random(min, max){
        return min + Math.round(Math.random()*(max+1-min));

    }
