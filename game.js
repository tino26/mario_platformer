const terrainX = 8000, terrainY = 6000;
var isMouseDown = false;
var cameraX=terrainX/2, cameraY=terrainY/2;
var gameOver=new Image();
gameOver.src="Game_over1.png";
var startImg=new Image();
startImg.src="start1.png";
var win=new Image();
win.src="win.png";
var start=false;

function draw_from_camera(x, y, sx, sy){
    context.fillRect(x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
}
function drw_img(img, x, y, sx, sy, alpha){
    context.save();
    context.translate(x-cameraX+canvas.width/2, y-cameraY+canvas.height/2);
    context.rotate(alpha);
    context.drawImage(img, -sx/2, -sy/2, sx, sy);
    context.restore();
}
function coll(obj1, obj2){
    return areColliding(
        obj1.x-obj1.sx/2, obj1.y-obj1.sy/2, obj1.sx, obj1.sy,
        obj2.x-obj2.sx/2, obj2.y-obj2.sy/2, obj2.sx, obj2.sy
    );
}
function d(x1, y1, x2, y2){
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

class Platform{
    constructor(x, y, sx){
        this.x = x;
        this.oldx = this.x;
        this.y = y;
        this.oldy = this.y;
        this.sx = sx;
        this.sy = 40;
        this.img = new Image();
        this.img.src = 'platform.png';
    }
    move(){
        this.oldx = this.x;
        this.oldy = this.y;
    }
    draw(){
        drw_img(this.img, this.x, this.y, this.sx*1.2, this.sy*1.7, 0);
    }
};

class MovingPlatform extends Platform{
    constructor(x1, y1, sx, x2, y2, t){
        super(x1, y1, sx);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.t = t;
        this.alpha = 0;
    }
    move(){
        super.move();
        this.alpha+=2/this.t*Math.PI;
        let sin = (Math.sin(this.alpha)+1)/2;
        this.x = sin*this.x1 + (1-sin)*this.x2;
        this.y = sin*this.y1 + (1-sin)*this.y2;
    }
}

class damagePlatform extends Platform{
    constructor(x, y, sx){
        super(x, y, sx);
        this.x = x;
        this.y = y;
        this.sy = 40;
        this.img = new Image();
        this.img.src = 'kill_platform.png';
    }
    draw(){
        drw_img(this.img, this.x, this.y, this.sx*1.2, this.sy*1.7, 0);
    }
    damage(){
        player.hit(1);
    }
}

var np = 620;
var plats = [];
for (let i=0; i<np; ++i){
    let x = Math.floor(Math.random()*terrainX/450)*450;
    let y = Math.floor(Math.random()*terrainY/200)*200;
    if(i<20){
        plats[i]=new damagePlatform(x, y, 150);
    }else{
        if (i%2==1){
            plats[i] = new MovingPlatform(x, y, 150, x+(Math.floor(Math.random()*3)-1)*200, y+ (Math.floor(Math.random()*3)-1)*100, Math.random()*100+200);
        }
        if(i%2==0){
            plats[i] = new Platform(x, y, 400);
        }
    }
}

class Player{
    constructor(){
        this.x = cameraX;
        this.y = cameraY;
        this.sx = 40;
        this.sy = 70;
        this.color = 'blue';
        this.dy = 0;
        this.step = -1;
        this.health = 100;
        this.inv = 0;
        this.img = [new Image(), new Image(), new Image()];
        this.img_flip = [new Image(), new Image(), new Image()];
        this.img[0].src = 'hero0.png'; this.img[1].src = 'hero1.png'; this.img[2].src = 'hero2.png';
        this.img_flip[0].src = 'hero0_flipped.png'; this.img_flip[1].src = 'hero1_flipped.png'; this.img_flip[2].src = 'hero2_flipped.png';
        this.img_ind = 0;
    }
    jump(){
        if (this.health <= 0) return;
        if (this.step!=-1){
            this.dy = -12;
            this.step = -1;
        }
    }
    hit(dmg){
        if (this.health <= 0) return;
        if (this.inv == 0){
            this.health -= dmg;
            this.inv = 10;
        }
    }
    fall(){
        if (this.step!=-1){
            this.step=-1;
            this.dy = 0;
        }
    }
    pickup(){
        let closest=1, dist=terrainX+terrainY+1000;
        for (let i=1; i<weapons.length; ++i){
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist){
                dist = cdist;
                closest = i;
            }
        }
        if (dist < 100){
            weapons[0].held = false;
            let c = weapons[closest];
            weapons[closest] = weapons[0]
            weapons[0] = c;
            weapons[0].held = true;
        }
    }
    update(){
        if (this.health <= 0) return;
        if (this.inv > 0) --this.inv;
        let oldy = this.y;
        if (this.step==-1){
            this.dy += 0.17;
            this.y += this.dy;
        }else{
            this.x += plats[this.step].x - plats[this.step].oldx;
            this.y += plats[this.step].y - plats[this.step].oldy;
        }
        if (isKeyPressed[65]) this.x -= 5;
        if (isKeyPressed[68]) this.x += 5;
        if (this.step!=-1 && (this.x+this.sx/2 < plats[this.step].x-plats[this.step].sx/2 || this.x-this.sx/2 > plats[this.step].x+plats[this.step].sx/2)){
            this.step = -1;
            this.dy = 0;
        }
        for (let i=0; i<np; ++i){
            if (coll(this, plats[i]) && plats[i].oldy-oldy > this.sy/2+plats[i].sy/2){
                this.step = i;
                this.y = plats[i].y-this.sy/2-plats[i].sy/2;
            }
        }
        cameraX = this.x;
        cameraY = this.y;
    }
    draw(){
        if (this.health <= 0) return;
        context.fillStyle = 'rgba(0, 0, 255, 0.5)';
        draw_from_camera(this.x, this.y-this.sy/2-20, this.health, 10);
        if (this.inv%2==0) context.fillStyle = this.color;
        if (mouseX >= canvas.width/2){
            if (this.step==-1){
                drw_img(this.img[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }else{
            if (this.step==-1){
                drw_img(this.img_flip[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img_flip[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }
    }
}

var player = new Player();

class Enemy{
    constructor(x, y){
        this.x=x;
        this.y=y;
        this.sx = 30;
        this.sy = 30;
        this.color = 'orange';
        this.speed = 4;
        this.health = 2;
    }
    hit(dmg){
        this.health -= dmg;
        if (this.health <= 0){
            Object.assign(this, enemies[enemies.length-1]);
            enemies.pop();
            ne--;
        }
    }
    update(){
        let dist = d(player.x, player.y, this.x, this.y);
        this.x += (player.x-this.x)/dist*this.speed;
        this.y += (player.y-this.y)/dist*this.speed;
        if (coll(this, player)) player.hit(1);
    }
    draw(){
        context.fillStyle = this.color;
        draw_from_camera(this.x, this.y, this.sx, this.sy);
    }
}



class BigEnemy extends Enemy{
    constructor(x, y){
        super(x, y);
        this.x=x;
        this.y=y;
        this.sx = 50;
        this.sy = 50;
        this.color = 'red';
        this.speed = 1;
        this.health = 10;
    }
    
    update(){
        let dist = d(player.x, player.y, this.x, this.y);
        this.x += (player.x-this.x)/dist*this.speed;
        this.y += (player.y-this.y)/dist*this.speed;
        if (coll(this, player)) player.hit(5);
    }
}


class respaunEnemy extends Enemy{
    constructor(x, y){
        super(x, y);
        this.x=x;
        this.y=y;
        this.sx = 10;
        this.sy = 10;
        this.color = 'blue';
        this.speed = 6;
        this.health = 1;
    }
    
    
    update(){
        let dist = d(player.x, player.y, this.x, this.y);
        this.x += (player.x-this.x)/dist*this.speed;
        this.y += (player.y-this.y)/dist*this.speed;
        if (coll(this, player)){
            player.hit(2);
            this.x=Math.random()*terrainX;
            this.y=Math.random()*terrainY;
        }
    }
}


var ne = 50;
var enemies = [];
for (let i=0; i<ne; ++i){
    if(i%3==0){
        enemies[i] = new Enemy(Math.random()*terrainX, Math.random()*terrainY);
    }
    if(i%3==1){
        enemies[i] = new BigEnemy(Math.random()*terrainX, Math.random()*terrainY);
    }
    if(i%3==2){
        enemies[i] = new respaunEnemy(Math.random()*terrainX, Math.random()*terrainY);
    }
}

var bullets = [];
class Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img){
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        let dist = d(x, y, targetX, targetY);
        this.dx = (targetX-x)/dist*speed;
        this.dy = (targetY-y)/dist*speed;
        this.alpha = Math.atan2(this.dy, this.dx);
        this.img = new Image();
        this.img.src = img;
        this.dmg = dmg;
    }
    del(){
        Object.assign(this, bullets[bullets.length-1]);
        bullets.pop();
    }
    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        if (this.x > terrainX+canvas.width ||
           this.x < -canvas.width ||
           this.y > terrainY+canvas.height ||
           this.y < -canvas.height){
            this.del();
            return;
        }
        for (let i=0; i<enemies.length; ++i){
            if (coll(this, enemies[i])){
                enemies[i].hit(this.dmg);
                this.del();
                return;
            }
        }
    }
    draw(){
        drw_img(this.img, this.x, this.y, this.sx, this.sy, this.alpha)
    }
}

class Weapon{
    constructor(x, y, held=false){
        this.x = x;
        this.y = y;
        this.sx = 50;
        this.sy = 50;
        this.img = new Image();
        this.img.src = 'pistol.png';
        this.img_flip = new Image();
        this.img_flip.src = 'pistol_flip.png';
        this.held = held;
        this.reaload_time = 30;
        this.curr_reload = 0;
    }
    update(){
        if (this.held){
            if (this.curr_reload > 0) --this.curr_reload;
            this.y = player.y;
            if (mouseX-canvas.width/2+cameraX > player.x)
                this.x = player.x+10;
            else                
                this.x = player.x-10;
        }
        if(player.health<=0){
            this.held=false;
            this.y+=6;
        }
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            bullets.push(new Bullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
            this.curr_reload = this.reaload_time;
        }
    }
    draw(){
        let dirX, dirY, alpha;
        if (this.held){
            dirX = mouseX-canvas.width/2+cameraX-this.x;
            dirY = mouseY-canvas.height/2+cameraY-this.y;
            alpha = Math.atan2(dirY, dirX);
        }else{
            dirX = 100;
            dirY = 0;
            alpha = 0;
        }
        if (dirX >= 0) drw_img(this.img, this.x, this.y, this.sx, this.sy, alpha);
        else drw_img(this.img_flip, this.x, this.y, this.sx, this.sy, alpha);
    }
}

class AK47 extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'ak47.png';
        this.img_flip.src = 'ak47_flip.png';
        this.reaload_time = 7;
        this.sx=70;
        this.sy=50;
    }
}


class shotgun extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'lasergun.png';
        this.img_flip.src = 'lasergun_flipped.png';
        this.reaload_time = 80;
        this.sx=60;
        this.sy=40;
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            if(mouseX-canvas.width/2+cameraX < player.x+40 && mouseX-canvas.width/2+cameraX > player.x-20){
                bullets.push(new Bullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                bullets.push(new Bullet(this.x+10, this.y, 20, 10, mouseX-canvas.width/2+cameraX+30, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                bullets.push(new Bullet(this.x-10, this.y, 20, 10, mouseX-canvas.width/2+cameraX-30, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                this.curr_reload = this.reaload_time;
            }else{
                bullets.push(new Bullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                bullets.push(new Bullet(this.x, this.y+10, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY+30, 10, 2, 'bullet.png'));
                bullets.push(new Bullet(this.x, this.y-10, 20, 10, mouseX-canvas.width/2+cameraX,     mouseY-canvas.height/2+cameraY-30, 10, 2, 'bullet.png'));
                this.curr_reload = this.reaload_time;
            }
        }
    }
}


class pumpShotgun extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'pumpShotgun.png';
        this.img_flip.src = 'pumpShotgun_flipped.png';
        this.sx=70;
        this.sy=30;
        this.reaload_time = 80;
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            if(mouseX-canvas.width/2+cameraX < player.x+40 && mouseX-canvas.width/2+cameraX > player.x-20){
                bullets.push(new PumpBullet(this.x+10, this.y, 20, 10, mouseX-canvas.width/2+cameraX+20, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                bullets.push(new PumpBullet(this.x-10, this.y, 20, 10, mouseX-canvas.width/2+cameraX-20, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
                this.curr_reload = this.reaload_time;
            }else{
                bullets.push(new PumpBullet(this.x, this.y+10, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY+20, 10, 2, 'bullet.png'));
                bullets.push(new PumpBullet(this.x, this.y-10, 20, 10, mouseX-canvas.width/2+cameraX,     mouseY-canvas.height/2+cameraY-20, 10, 2, 'bullet.png'));
                this.curr_reload = this.reaload_time;
            }
        }
    }
}

class PumpBullet extends Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img){
        super(x, y, sx, sy, targetX, targetY, speed, dmg, img);
        this.img.src="bullet.png";
        this.sx=20;
        this.sy=10;
        this.speed=3;
        this.dmg=3;
    }
}

var rockets=[];
class rocket extends Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img, killed){
        super(x, y, sx, sy, targetX, targetY, speed, dmg, img);
        this.img.src="rocket.png";
        this.sx=40;
        this.sy=30;
        this.speed=3;
        this.dmg=5;
        this.killed=0;
    }
    
    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        if (this.x > terrainX+canvas.width ||
           this.x < -canvas.width ||
           this.y > terrainY+canvas.height ||
           this.y < -canvas.height){
            this.del();
            return;
        }
        for (let i=0; i<enemies.length; ++i){
            if (coll(this, enemies[i])){
                enemies[i].hit(this.dmg);
                this.del();
                this.killed++;
                    return;
            }
        }
    }
    
    del(){
        if(this.killed>=5){
            Object.assign(this, rockets[rockets.length-1]);
            rockets.pop();
            this.killed=0;
        }
    }
}


class bazooka extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'bazooka.png';
        this.img_flip.src = 'bazooka_flipped.png';
        this.reaload_time = 200;
        this.sx=100;
        this.sy=70;
    }
    
    shoot(){
        if (this.held && this.curr_reload==0){
            rockets.push(new rocket(this.x, this.y, 30, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 5, 'rocket.png'));
            this.curr_reload = this.reaload_time;
        }
    }
}


var nw = 40;
var weapons = [];
weapons[0] = new Weapon(player.x, player.y, true);
for (let i=1; i<nw; ++i){
    if(i%4==0){
        weapons[i] = new AK47(Math.random()*terrainX, Math.random()*terrainY);
    }
    if(i%4==1){
        weapons[i] = new shotgun(Math.random()*terrainX, Math.random()*terrainY);
    }
    if(i%4==2){
        weapons[i] = new bazooka(Math.random()*terrainX, Math.random()*terrainY);
    }
    if(i%4==3){
        weapons[i] = new pumpShotgun(Math.random()*terrainX, Math.random()*terrainY);
    }
}

function update() {
    if(start==true){
        for (let i=0; i<np; ++i){
            plats[i].move();
         }
        player.update();
        for (let i=0; i<enemies.length; ++i){
            enemies[i].update();
        }
        weapons[0].update();
        if (isMouseDown) weapons[0].shoot();
        for (let i=0; i<bullets.length; ++i){
            bullets[i].update();
        }
        for (let i=0; i<rockets.length; ++i){
            rockets[i].update();
        }
        if(player.y>=6300){
            player.health=0;
        }
    }
}

function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let i=0; i<np; ++i){
        plats[i].draw();
    }
    for(let i=0; i<20; ++i){
        if(coll(plats[i], player)){
            plats[i].damage();
        }
    }
    for (let i=0; i<enemies.length; ++i){
        enemies[i].draw();
    }
    player.draw();
    for (let i=0; i<nw; ++i){
        weapons[i].draw();
    }
    for (let i=0; i<bullets.length; ++i){
        bullets[i].draw();
    }
    for (let i=0; i<rockets.length; ++i){
        rockets[i].draw();
    }

    if(player.health<=0){
        context.drawImage(gameOver, 0, 0, canvas.width, canvas.height);
    }
    if(start==false){
        context.drawImage(startImg, 0, 0, canvas.width, canvas.height);
    }
    if(ne<=0){
        context.drawImage(win, 0, 0, canvas.width, canvas.height);
    }
};

function keydown(key) {
    if(start==false && key==32){
        start=true;
    }
    if(start==true){
        if (key==32) player.jump();
        if (key==83) player.fall();
        if (key==69) player.pickup();
    }
};
function mousedown(){
    isMouseDown=true;
}
function mouseup() {
    isMouseDown=false;
};
