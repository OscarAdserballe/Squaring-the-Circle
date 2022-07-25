//We declare the canvas variable and the context of the canvas
var canvas=document.getElementById("myCanvas");
var ctx=canvas.getContext("2d");

//Set a default font in case it isn't specified
ctx.font = "48px Century Gothic"

let vDivider=1;
let topV=1;

//Variable that checks which "screen" the game is currently on
let currentLevel="startScreen";

let keys; 		//this variable stores all active keys in an array
let scroll=0;	//this variable stores the position of the camera
let timer=0;	//Stores how long you use on the levels
let bestTimes=[500,500,500,500];   //Store the best times in an array so we can retrieve them



gamePaused = false
pauseCooldown = 500/40			//to ensure you can't spam the pause button and that it works properly when pressed. Often when you press a key seemingly once, computer registrates as several times, this ensures it only registers as one keypress

wonLevel = false;	//condition for win screen

let canvasW = canvas.getBoundingClientRect().width;  	//The actual size of the canvas. The height and width is declared in the html code but it isn't always that size, only when the viewport is 1920*1080. The canvas size is redefined in the css, but for clicking purposes it can't register it and doesn't scale accordingly with the position of the mouse
let canvasH = canvas.getBoundingClientRect().height;

let k_height = canvasH/canvas.height;	//Get the ratio between the actual height and the defined height in HTML
let k_width = canvasW/canvas.width;	//Same as the above but with width

let gridOn=false;	//This grid variable is only accesible through the console, and essentially helps us create the levels to align the different objects
function grid()		//Creates the grid
{
	ctx.fillStyle="#FFFFFF";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	for(let i=0;i<=11000;i+=10)
	{
		if(i%1000==0){ctx.lineWidth=5;ctx.strokeStyle="#FF0000";}
		else if(i%500==0){ctx.lineWidth=5;}
		else if(i%100==0){ctx.lineWidth=3;}
		else if(i%50==0){ctx.lineWidth=2;}
		else {ctx.lineWidth=1;}
		ctx.beginPath();
		ctx.moveTo(i-scroll,0);
		ctx.lineTo(i-scroll,canvas.height);
		ctx.stroke();
		ctx.strokeStyle="#000000";
		if(i%1000==0)
		{
			ctx.fillStyle="#0000FF";
			ctx.font = "30px Century Gothic";
			ctx.fillText(i/1000,i+10-scroll,50);
		}
	}
	for(let i=0;i<=810;i+=10)
	{
		if(i%1000==0){ctx.lineWidth=5;ctx.strokeStyle="#FF0000";}
		else if(i%500==0){ctx.lineWidth=5;}
		else if(i%100==0){ctx.lineWidth=3;}
		else if(i%50==0){ctx.lineWidth=2;}
		else {ctx.lineWidth=1;}
		ctx.beginPath();
		ctx.moveTo(0,i);
		ctx.lineTo(canvas.width,i);
		ctx.stroke();
		ctx.strokeStyle="#000000";
		
	}
};




//this part of code updates "keys" when any key is pressed
window.addEventListener('keydown',function(e){
keys=(keys||[]);
keys[e.keyCode] = true;
})
//this part of code updates "keys" when any key is released
window.addEventListener('keyup',function(e){
keys[e.keyCode] = false;
})

//Allow us to see where the player clicks in the canvas
function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
}

//Function for easily creating objects and giving them object-specific functions
let object=function(x, y, width, height, type) // type=0 solid type="death" killing block  type="enemy1" enemy1|| this is how we can add objects into the game
{
	this.vx=0;  //velocity and acceleration in both axes. Acceleration isn't really used and is kind of superfluous
	this.vy=0;
	this.ax=0;
	this.ay=0;
	this.dmg=0;	//Damage attribute
	
	this.x=x;	//positions and width and height
	this.y=y;
	this.width=width;
	this.height=height;
	
	
	this.color="#ffee05";	
	this.type=type;
	if(this.type==0){this.color="#C0C0C0";}
	if(this.type=="projectile"){this.color="#000000";}	//different colours for different things
	if(this.type=="meleeAttack"){this.color="#0000ff"}
	if(this.type=="death"){this.color="#ff0000";}
	this.onGround=false;	
	this.maxHp=0;
	this.hp=0;
	this.cooldown = 0;
	this.ranged = 0;	//if 0 melee attacks only, if more, ranged attacks
	this.projectiles=[];	//stores objects' projectiles in an array
	this.projectile=0;	
	this.currentFrame=0;
	this.facing="right";//which way object is facing
	if(this.type=="enemy1"){this.width=80;this.height=80;this.color="#F200DC";this.minX=width;this.maxX=height;this.vx=5;this.maxHp=100;this.hp=100;}
	if(this.type=="enemy2"){this.width=40;this.height=80;this.color="#30488c";this.maxHp=60;this.hp=60;}
	
	
	this.draw=function()//this function draws the object
	{
		ctx.fillStyle=this.color;
		if(this.hp<=0&&this.maxHp!=0)
		{
			ctx.fillStyle="#ff5500";
		}
		
		
		if(this.type=="player")
		{	
			//change frame
			this.currentFrame+=0.1;
			if (this.currentFrame>=3.5){this.currentFrame=0;}
			//draw player
			if(!this.vy==0)//if the player is mid-air
			{
				ctx.drawImage(this.img,72*Math.round(this.currentFrame),1*96,this.width,this.height,this.x-scroll,this.y,this.width,this.height);
			}
			
			else if(Math.abs(this.vx)<3)//if the player isn't moving
			{
				ctx.drawImage(this.img,72*Math.round(this.currentFrame),0,this.width,this.height,this.x-scroll,this.y,this.width,this.height);
			}
			
			else if(this.vx>2)//if the player is moving right
			{
				ctx.drawImage(this.img,72*Math.round(this.currentFrame),2*96,this.width,this.height,this.x-scroll,this.y,this.width,this.height);
			}
			
			else if(this.vx<-2)//if the player is moving left
			{
				ctx.drawImage(this.img,72*Math.round(this.currentFrame),3*96,this.width,this.height,this.x-scroll,this.y,this.width,this.height);
			}
		}
		else{ctx.fillRect(this.x-scroll, this.y, this.width, this.height);}
	};
	
	this.shoot=function(width, height, vx, vy)  //shoot function
	{
		if(this.ranged==0&&this.type=="player")	//check if the player has the ranged power-up, if not melee attack
		{
			if(this.facing=="right")
			{
				this.projectiles[this.projectile] = new object(this.x+this.width, this.y, 128, 72, "projectile");	//projectile type object has the special attribute where its hp is how long it survives before being cleared from the screen
			}
			else
			{
				this.projectiles[this.projectile] = new object(this.x-128, this.y, 128, 72, "projectile");
			}
			this.cooldown = 400/40  //number of milliseconds of cooldown/40
			this.projectiles[this.projectile].hp=5;
			this.projectiles[this.projectile].dmg=3;
		}
		else if(this.ranged>0||this.type=="enemy2")
		{
			if(this.facing=="right")//if you're looking the the right
			{
				this.projectiles[this.projectile] = new object(this.x+this.width, this.y+(this.height-height)/2,width,height, "projectile");
				this.projectiles[this.projectile].vx=vx;
				this.projectiles[this.projectile].vy=vy;
				this.projectiles[this.projectile].hp=100;
				
			}
			else//if you're looking to the left
			{
				this.projectiles[this.projectile] = new object(this.x-width, this.y+(this.height-height)/2,width,height, "projectile");
				this.projectiles[this.projectile].vx=-vx;
				this.projectiles[this.projectile].vy=vy;
				this.projectiles[this.projectile].hp=100;
				
			}
			if(this.type=="enemy2")
			{
			this.projectiles[this.projectile].dmg=10;
			this.cooldown = 2000/40;//number of milliseconds of cooldown/40 (number of frames in a second)
			}else
			{
			this.projectiles[this.projectile].dmg=5;
			this.cooldown = 500/40  
			}
		}
		
		else{confirm("An error has occured")}
		this.projectile += 1;
	}




	this.move=function()//this function updates the speed and position of the object
	{
		this.vx+=this.ax/vDivider;
		this.vy+=this.ay/vDivider;
		if(this.type=="player")
		{
			this.vy+=0.5/vDivider;
		}
		
		
		//check if you're colliding with anything before moving
		if(this.type=="player")
		{
			for(let i=2;i<levels[currentLevel].length;i++)//check every object of a level
			{
				if(levels[currentLevel][i].type===0&&this.collision(levels[currentLevel][i]))//if you colide with something solid
				{
						//if you collide with something solid before your move, after it's, it means that the solid object moved into you, so your x and y change accordingly
						this.x+=levels[currentLevel][i].vx/vDivider;
						this.y+=levels[currentLevel][i].vy/vDivider;
						
					
						for(let ii=2;ii<levels[currentLevel].length;ii++)//if you collide with something after being pushed, you got crushed, basically suffocation
						{
							if(levels[currentLevel][ii].type===0&&this.collision(levels[currentLevel][ii]))
							{
							this.hp-=1;
							if(this.hp<0)
								{
								this.hp=0
								}
							}	
						}				
				}
				if((levels[currentLevel][i].type=="death"||levels[currentLevel][i].type=="enemy1")&&this.collision(levels[currentLevel][i]))
				{
					this.hp-=0.3;
					
				}
				else if(levels[currentLevel][i].type==="power-up"&&this.collision(levels[currentLevel][i]))
				{
					this.ranged=99999999	//permanent power-up which enables the player to shoot for rest of the level
					levels[currentLevel].splice(i, 1)	//deletes power-up when player collides with it
				}
			}
		}
		
		
		//change x, and if you now collide with something, change your x back and set your vx to 0
		this.x+=this.vx/vDivider;			
		
		for(let j=2;j<levels[currentLevel].length;j++)
		{
			if(this.collision(levels[currentLevel][j])&&this!=levels[currentLevel][j])
			{
				if(this.type=="player"&&levels[currentLevel][j].type==0)
				{
					this.x-=this.vx/vDivider;
					this.vx=0;
				}
			
			}
		}
		if(this.type=="player"&&this.x<-50+scroll){this.x=-50+scroll;}
		
		
		//change y, and if you now collide with something, change your y back and set your vy to 0, also if you were falling, onGround=true
		this.y+=this.vy/vDivider;
		
		for(let ii=2;ii<levels[currentLevel].length;ii++)
		{
			if(this.collision(levels[currentLevel][ii])&&this!=levels[currentLevel][ii])
			{
				if(this.type=="player"&&levels[currentLevel][ii].type==0)
				{
				this.y-=this.vy/vDivider;
				if(this.vy>0){this.onGround=true;}
				this.vy=0;
				}
				if(this.type=="projectile"&&levels[currentLevel][ii].type==0){this.hp=0;}
			}
			
		}	
		if(this.type=="enemy1")
		{
			if(this.x<this.minX){this.vx=5;}
			if(this.x>this.maxX){this.vx=-5;}
		}
		////////////////////////////////////////////////////Check if you hit an enemy
		if(this.type=="enemy1"||this.type=="enemy2")
		{
			for (k=0; k<player.projectiles.length; k++)
			{
				if(this.collision(player.projectiles[k]))
				{
					player.projectiles[k].hp=0;
					this.hp-=player.projectiles[k].dmg;
				}
			}
			
		}
		if(this.type=="player")		//checks if projectile hits player
		{
			
			for(k=2; k<levels[currentLevel].length;k++)
			{
				for(l=0;l<levels[currentLevel][k].projectiles.length;l++)
				{
					if(this.collision(levels[currentLevel][k].projectiles[l]))
					{
						levels[currentLevel][k].projectiles[l].hp=0;
						player.hp-=levels[currentLevel][k].projectiles[l].dmg;
					}
					
				}
				
			}
		}
		
		
	};
	
	this.collision=function(otherObj)//this function determines if 2 objects are colliding, if they are it returns "true"
	{
		//set the edges/walls of this rectangle
		this.left=this.x;
		this.right=this.x+this.width;
		this.top=this.y;
		this.bottom=this.y+this.height;
		
		//set the edges/walls of the other rectangle
		otherObj.left=otherObj.x;
		otherObj.right=otherObj.x+otherObj.width;
		otherObj.top=otherObj.y;
		otherObj.bottom=otherObj.y+otherObj.height;
		
		//by default return "true", but if one of the rectangles is too much to the left/right/up/down, then return "false"
		if(otherObj.left>this.right||otherObj.right<this.left||otherObj.top>this.bottom||otherObj.bottom<this.top)
		{
		return(false);
		}
		else
		{
		return(true);
		}			
	};
	
	
	
	
	this.gravity=function()// this function changes the y velocity of an object, mostly player's
	{
		this.vy+=0.5;
	}
	
	this.healthBar=function(x,y,width,height)	//healthbar above the player
	{
		ctx.fillStyle="#555555";
		ctx.fillRect(x,y,width,height);
		
		ctx.fillStyle="#BBBBBB";
		ctx.fillRect(x+2,y+2,width-4,height-4);
		
		if(this.hp/this.maxHp>0.7){ctx.fillStyle="#50C878";}
		else if(this.hp/this.maxHp>0.4){ctx.fillStyle="#FFA900";}
		else if(this.hp/this.maxHp>0.1){ctx.fillStyle="#E3242B";}
		else{ctx.fillStyle="#FF0000";}
		
		ctx.fillRect(x+2,y+2,(this.hp/this.maxHp)*(width-4),height-4);
	};

	this.wonGame = function() {	//checks to see if you've won the level based on x-coordinate
		if (this.x >= 8000) {
			wonLevel = true;
		}
	}
};

var attackAttempt=function()	//when player presses key 70 (F) and shooting isn't on cooldown, player shoots
{	
	if(keys&&keys[70]&&player.cooldown<=0)
		{
			player.shoot(40,10,50,0);
		}
}

var pause = function()	//when p is pressed game pauses
{
	if(keys&&keys[80]&&pauseCooldown<=0) {
		gamePaused = !gamePaused
		pauseCooldown = 500/40
	}
	else {
		pauseCooldown -= 1
	}
}


//here we create the player
let player=new object(60,500,72,96,"player");
player.maxHp=100;
player.hp=player.maxHp;
player.img=new Image();
player.img.src="../sprites/main character/Sprite sheet 1.png";


////////////////////////////////////////////////////////////////////////////////////////////////
//Levels
let levels=[];
const setLevels=function()	//function so we can easily reinitialize them and reload the levels
{
levels[0]=[50,300]; //starting x=50 starting y=300
levels[0][2]=new object(0,600,1000,300,0);
levels[0][3]=new object(1800,600,600,300,0);
levels[0][4]=new object(2600,350,100,100,0);
levels[0][5]=new object(3250,350,800,100,0);
levels[0][6]=new object(3250,350-80,3250,3250+800-80,"enemy1");
levels[0][7]=new object(3500,0,300,200,"death");
levels[0][8]=new object(6700-30,450,60,60,"power-up");
levels[0][9]=new object(4200,800,2000,300,0);
levels[0][10]=new object(6200,600,1000,300,0);
levels[0][11]=new object(4200,800-80,4200,6200-80,"enemy1");
levels[0][12]=new object(4500,800-80,4200,6200-80,"enemy1");
levels[0][13]=new object(4800,800-80,4200,6200-80,"enemy1");
levels[0][14]=new object(5100,800-80,4200,6200-80,"enemy1");
levels[0][15]=new object(4400,450,300,50,"death");
levels[0][16]=new object(4950,450,1050,50,"death");
levels[0][17]=new object(7500,350,3000,50,0);
levels[0][18]=new object(7500,350-80,7500,8000-80,"enemy1");
levels[0][19]=new object(7950,350,2000,3000,0);
levels[0][20]=new object(0,canvas.height,9000,3000,"death");
levels[0][21]=new object(0,canvas.height,9000,3000,"death");
levels[0][22]=new object(0,canvas.height,9000,3000,"death");
///////////////////////////////////////////////////////////////////////////////////////////////////////////
levels[1]=[50,300];
levels[1][2]=new object(0,400,1000,80,0);
levels[1][3]=new object(1700,400,40,40,0);
levels[1][4]=new object(1700,320,0,0,"enemy2");
levels[1][5]=new object(1200,290,300,50,0);
levels[1][6]=new object(-50,0,50,3000,0);//a wall to break projectiles, so they don't cause lag
levels[1][7]=new object(1740,440,3000,40,0);// platform ends at 4740
levels[1][8]=new object(2000,140,50,300,"death");
levels[1][9]=new object(2400,140,50,300,"death");
levels[1][10]=new object(2800,140,50,300,"death");
levels[1][11]=new object(3100,140,50,300,"death");
levels[1][12]=new object(3500,140,50,300,0);
levels[1][13]=new object(3900,140,50,300,"death");
levels[1][14]=new object(4000,440-80,4000,4300,"enemy1");
levels[1][15]=new object(4300,440-80,4300,4600,"enemy1");
levels[1][16]=new object(5000,600,500,40,0);
levels[1][17]=new object(5750,250,80,80,0);
levels[1][18]=new object(6400,250,120,80,0);
levels[1][19]=new object(8000,250-80,0,0,"enemy2");
levels[1][20]=new object(7000,250,120,80,0);
levels[1][21]=new object(7200,600,400,300,0);
levels[1][22]=new object(7200,600-80,7200,7500-80,"enemy1");
levels[1][23]=new object(7375,0,50,300,"death");
levels[1][24]=new object(7700,250,2000,800,0);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
levels[2]=[50,300];
levels[2][2]=new object(0,600,10000,600,0);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
levels[3]=[50,300];
levels[3][2]=new object(0,600,10000,600,0);
};
setLevels();
//backgrounds for the different levels
background[0]=new Image();
	background[0].src="../sprites/levels/background 1.png";
	background[1]=new Image();
	background[1].src="../sprites/levels/background 2.png";
	background[2]=new Image();
	background[2].src="../sprites/levels/background 3.2.png";
	background[3]=new Image();
	background[3].src="../sprites/levels/background 4.png";


//resets levels, enemies, camera, timer, and all the player variables 
function doReset(currentLevel) {
	player.hp=player.maxHp;
	player.x = levels[currentLevel][0];
	player.y = levels[currentLevel][1];
	player.vx = 0;
	player.vy = 0;
	player.ranged = 0;
	setLevels();
	scroll = 0;
	timer=0;
}
////////////////////////////////////////////////////////////////////////////////////////////////

//this is the function that activates once per frame, it activates other functions
var doCycle=function()
{
	//checks if player is dead and if so makes a death screen 
	if(player.hp<=0) {
		player.hp = 0;
		ctx.fillStyle = "red"	//this lines and the lines below, are for making the death screen
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "white"
		ctx.textAlign = "center"
		ctx.font = "96px Century Gothic bold"
		ctx.fillText("You've Died", canvas.width/2, canvas.height/2)
		ctx.font = "48px Century Gothic"
		ctx.fillText("Try Again", canvas.width/2, canvas.height/2+100)
		ctx.fillText("Quit", canvas.width/2, canvas.height/2+200)
		canvas.addEventListener('click', function(evt) {
			var mousePos = getMousePos(canvas, evt);	//get the coordinates of mouse clicks on canvas but with a caveat. The canvas always perceives the bottom right pixel as (1440, 900) but the mousePos interprets it to the size the canvas has been scaled to, so if the canvas has been scaled down because of css, the mousePos might perceive the bottom right pixel as, say, (500, 310). This is where CanvasW, CanvasH, and the k factors come in so they can adjust the MousePos coordinates  
			if ((mousePos.x>=(canvasW/2)-(107*k_width)	//if statement checks if the mouse coordinates when player clicks are within the text box made by the above text. This if statement is specifically for checking if the player clicks on try again. Also checks to see if player hp is equal or lower than 0 to make sure they can't click on the buttons when the player is in the startscreen
				&&mousePos.x<=(canvasW/2)+(107*k_width))	//using canvasW instead of canvas.width because canvasW is the canvas' actual width while canvas.width is always 1440px as defined in the html code. Same goes for height. What is contained within the k_width parentheses is for the width of the text
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)	//when the player hovers over the text, it doesn't seem clickable, that can be fixed with the <area> tag but would be incredibly complicated since it requires many interactions between the HTML and JS constantly and really isn't that important. 
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))&&player.hp<=0)
				{
					console.log("clicked on Try Again")	//all console.logs in the code are just for debugging purposes, doesn't affect the player in any way, but helps us if anything goes wrong
					doReset(currentLevel)  //resets levels
					
				}
			else if ((mousePos.x>=(canvasW/2)-(80*k_width)	//check to see if player clicks on quit
				&&mousePos.x<=(canvasW/2)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(200*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(200*k_height))+(0*k_height))&&player.hp<=0)
				{
					console.log("clicked on Quit")
					doReset(currentLevel)
					currentLevel = "startScreen"	//goes back to start screen
				}
			})
		return;	//nothing after this gets executed in the code when the player is dead
	}

	//pretty much the same as the death screen
	pause()
	if (gamePaused) {	//much like the death screen, in that it also checks to see if the player has paused the game and if they have loads the pause screen and freezes the rest of the doCycle
		ctx.textAlign = "center"
		ctx.font = "96px Century Gothic";
		ctx.fillStyle = "#000000"
		ctx.fillText("Paused", canvas.width/2, canvas.height/2-100)
		ctx.font = "48px Century Gothic";
		ctx.fillText("Resume", canvas.width/2, canvas.height/2)
		ctx.fillText("Start over", canvas.width/2, canvas.height/2+100)
		ctx.fillText("Quit", canvas.width/2, canvas.height/2+200)
		canvas.addEventListener('click', function(evt) {	//also to check what text the player is clicking on, as above in the death screen
			
			var mousePos = getMousePos(canvas, evt);
			if((mousePos.x>=(canvasW/2)-(92*k_width)
				&&mousePos.x<=(canvasW/2)+(92*k_width))
				&&(mousePos.y>=(canvasH/2)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(0*k_height)))&&gamePaused)
				{
					console.log("clicked on Resume")
					gamePaused = false	//So the game doesn't keep the pause screen on when the player has clicked on something
				}
			else if ((mousePos.x>=(canvasW/2)-(110*k_width)
				&&mousePos.x<=(canvasW/2)+(110*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))&&gamePaused)
				{
					console.log("clicked on Start over")
					gamePaused = false
					doReset(currentLevel)
					
				}
			else if ((mousePos.x>=(canvasW/2)-(80*k_width)
				&&mousePos.x<=(canvasW/2)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(200*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(200*k_height))+(0*k_height))&&gamePaused)
				{
					console.log("clicked on Quit")
					gamePaused = false
					currentLevel = "startScreen"
				}
			})
		return;
	}
//start-screen here, nearly identical to the pause screen and death screen and follows the same principles. Here text is written after checking where the player clicks, but it doesn't make a difference
	if (currentLevel=="startScreen") {
		canvas.addEventListener('click', function(evt) {
			var mousePos = getMousePos(canvas, evt);
			if((mousePos.x>=(canvasW/2)-(500*k_width)-(80*k_width)
				&&mousePos.x<=(canvasW/2)-(500*k_width)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))
				&&currentLevel=="startScreen")
				{
					doReset(0);
					console.log("clicked on level 1");
					currentLevel = 0;	//When currentLevel is an integer it means that a level is loaded. 0 is level 1, 1 is level 2 and so on
				}
			else if ((mousePos.x>=(canvasW/2)-(175*k_width)-(80*k_width)
				&&mousePos.x<=(canvasW/2)-(175*k_width)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))
				&&currentLevel=="startScreen")
				{
					doReset(1)
					console.log("clicked on level 2")
					currentLevel = 1
				}
			else if ((mousePos.x>=(canvasW/2)+(175*k_width)-(80*k_width)
				&&mousePos.x<=(canvasW/2)+(175*k_width)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))
				&&currentLevel=="startScreen")
				{
					doReset(2)
					console.log("clicked on level 3")
					currentLevel = 2
				}
			else if ((mousePos.x>=(canvasW/2)+(500*k_width)-(80*k_width)
				&&mousePos.x<=(canvasW/2)+(500*k_width)+(80*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height))+(0*k_height))
				&&currentLevel=="startScreen")
				{
					doReset(3)
					console.log("clicked on level 4")
					currentLevel = 3
				}
		})
	
		ctx.textAlign = "center";
		ctx.font = "96px Century Gothic";
		ctx.fillStyle = "#ADD8E6";
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = "#000000"
		ctx.fillText("Squaring The Circle", canvas.width/2, canvas.height/2);
		ctx.font = "48px Century Gothic";
		ctx.fillStyle = "red"
		ctx.fillText("Level 1", canvas.width/2-500, (canvas.height/2)+100)
		ctx.fillText("Level 2", canvas.width/2-175, (canvas.height/2)+100)
		ctx.fillText("Level 3", canvas.width/2+175, (canvas.height/2)+100)
		ctx.fillText("Level 4", canvas.width/2+500, (canvas.height/2)+100)
		return;
	}
	//win screen is exactly like the different screens above and appears after if the wonGame() function returns true
	player.wonGame()
	if(wonLevel) {
		if(timer<bestTimes[currentLevel]){bestTimes[currentLevel]=timer;}
		ctx.textAlign = "center"
		ctx.font = "96px Century Gothic"
		ctx.fillStyle = "green"
		ctx.fillText("YOU WON!", canvas.width/2, canvas.height/2)
		ctx.font = "48px Century Gothic"
		ctx.fillText("Next Level", canvas.width/2, canvas.height/2+100)
		ctx.fillText("Quit", canvas.width/2, canvas.height/2+200)
		ctx.fillText("Start Over (" + Math.round(timer*100)/100 + ")", canvas.width/2, canvas.height/2+300)
		canvas.addEventListener('click', function(evt) {
			
			var mousePos = getMousePos(canvas, evt);
			if((mousePos.x>=(canvasW/2)-(120*k_width)
				&&mousePos.x<=(canvasW/2)+(120*k_width))
				&&(mousePos.y>=(canvasH/2)+(100*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(100*k_height)-(0*k_height)))&&wonLevel)
				{
					console.log(currentLevel)
					console.log("clicked on Next Level")
					if (currentLevel == 0) {
						doReset(0)
						wonLevel = false;
						currentLevel += 1;
					}
					console.log(currentLevel)

				}
			else if ((mousePos.x>=(canvasW/2)-(48*k_width)
				&&mousePos.x<=(canvasW/2)+(48*k_width))
				&&(mousePos.y>=(canvasH/2)+(200*k_height)-(48*k_height)
				&&mousePos.y<=((canvasH/2)+(200*k_height))+(0*k_height))&&wonLevel)
				{
					console.log("clicked on Quit")
					currentLevel = "startScreen"
					wonLevel = false					
				}
			else if ((mousePos.x>=(canvasW/2)-(200*k_width)
			&&mousePos.x<=(canvasW/2)+(200*k_width))
			&&(mousePos.y>=(canvasH/2)+(300*k_height)-(48*k_height)
			&&mousePos.y<=((canvasH/2)+(300*k_height))+(0*k_height))&&wonLevel) {
				console.log("Clicked on Start Over")
				doReset(currentLevel)
				wonLevel = false;
			}
		})
		return;		
	};



	player.cooldown-=1;	
	timer+=1/40;

	
//clean the screen
	ctx.fillStyle="#B0DFE5";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	
	ctx.drawImage(background[currentLevel],0-scroll/2,0);
if(gridOn){grid();}


//if the player is holding "w" and is on the ground, jump
	if(keys&&keys[87]&&player.onGround){player.vy=-20;}

//if the player is holding "s", make him fall faster
	if(keys&&keys[83]){player.vy+=3;}

//if the player is holding "a", accelerate him to the left until he reaches his max speed		
	if(keys&&keys[65])
	{
		if(player.onGround)
		{
		player.vx-=3;
		}
		else{player.vx-=1.5;}// accelerate less when in air
		player.facing="left";
	}
	if(player.vx<-10){player.vx=-10;}//limit velocity
	
//if the player is holding "d", accelerate him to the right until he reaches his max speed			
	if(keys&&keys[68])
	{
		if(player.onGround)
		{
			player.vx+=3;
		}
		else{player.vx+=1.5;}// accelerate less when in air
		player.facing="right";
	}
	if(player.vx>10){player.vx=10;}//limit velocity
			
//slowly stop the player when he's on the ground		
	if(player.vx>0&&player.onGround){player.vx-=0.5;}
	if(player.vx<0&&player.onGround){player.vx+=0.5;}
	
	player.onGround=false;
	
	//player.gravity();
	
	//find the new top velocity
	topV=1;
	if(Math.abs(player.vx)>topV)
	{
		topV=Math.abs(player.vx);
	}
	if(Math.abs(player.vy)>topV)
	{
		topV=Math.abs(player.vy);
	}
	
	for(let i=2;i<levels[currentLevel].length;i++)
	{
		if(Math.abs(levels[currentLevel][i].vx)>topV)
		{
			topV=Math.abs(levels[currentLevel][i].vx);
		}
		if(Math.abs(levels[currentLevel][i].vy)>topV)
		{
			topV=Math.abs(levels[currentLevel][i].vy);
		}
	}
	//find what number you have to divide the top velocity to get a number smaller than 1
	for(vDivider=1;Math.abs(topV/vDivider)>1;vDivider++);
	
	//move
	for(let i=0;i<vDivider;i++)
	{
		for(let k=2;k<levels[currentLevel].length;k++)
		{
			levels[currentLevel][k].move();
			if(levels[currentLevel][k].hp<=0&&levels[currentLevel][k].type!=0&&levels[currentLevel][k].type!="power-up"&&levels[currentLevel][k].type!="death"){levels[currentLevel].splice(k,1);k-=1;}
			else
			{
			for(let j=0;j<levels[currentLevel][k].projectiles.length;j++)
			{
				levels[currentLevel][k].projectiles[j].move();
				if(levels[currentLevel][k].projectiles[j].hp<=0)
				{
					levels[currentLevel][k].projectiles.splice(j,1);
					levels[currentLevel][k].projectile-=1;
				}
			}
			}
		}
		
		player.move();
		for (k=0; k<player.projectiles.length; k++)
		{
			player.projectiles[k].move();
		}
	}


	

//draw things
	
	
	//ctx.drawImage(player.img,0,0,72,96,player.x-scroll,player.y,player.width,player.height);
	//player.hp-=1;
	player.healthBar(player.x-scroll-(40-player.width/2),player.y-15,80,10);
	player.draw();
	attackAttempt();
	if(player.x-500>scroll){scroll=player.x-500;}//update the scroll value

	if(player.ranged!==0)
	{
		player.ranged -= 1;
	}
	
	for(let k=0; k<player.projectiles.length; k++)
	{
		player.projectiles[k].draw();
		player.projectiles[k].hp -= 1
		if (player.projectiles[k].hp<=0)
		{
			player.projectiles.splice(k, 1)
			player.projectile-=1
		}
	}

	for(let i=2;i<levels[currentLevel].length;i++)
	{
		levels[currentLevel][i].draw();
		if(levels[currentLevel][i].type=="enemy1"||levels[currentLevel][i].type=="enemy2"){levels[currentLevel][i].healthBar(levels[currentLevel][i].x-scroll-(40-levels[currentLevel][i].width/2),levels[currentLevel][i].y-15,80,10);}
		/////////////////////////////////////////this part makes the enemy2 shoot
		if(levels[currentLevel][i].type=="enemy2")
		{
			if(player.x<levels[currentLevel][i].x){levels[currentLevel][i].facing="left"}else{levels[currentLevel][i].facing="right"}
			levels[currentLevel][i].cooldown-=1;
			if(levels[currentLevel][i].cooldown<=0)
			{
				levels[currentLevel][i].shoot(20,20,10,0);
			}
		}
		////////////////////////////////////////
		if(levels[currentLevel][i].projectiles.length>0)
		{
			for(let j=0; j<levels[currentLevel][i].projectiles.length;j++)
			{
				levels[currentLevel][i].projectiles[j].draw();
			}
		}
	}
	
	///////////////////////////////draw text
	ctx.font = "50px Century Gothic";
	ctx.fillStyle="#FFFFFF";
	ctx.textAlign = "start";
	ctx.strokeStyle = 'black';
	ctx.fillText(Math.round(timer),5,50);
	ctx.strokeText(Math.round(timer),5,50);
	if(bestTimes[currentLevel]!==500)
	{
		ctx.fillText("Best Time: "+Math.round(bestTimes[currentLevel]*100)/100+"s",5,120);
		ctx.strokeText("Best Time: "+Math.round(bestTimes[currentLevel]*100)/100+"s",5,120);
	}
	
	
	
};

game = function() {
	setInterval(doCycle, 25);
}

game()