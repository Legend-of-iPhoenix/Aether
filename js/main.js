var canvas = document.querySelector("canvas");
var context = canvas.getContext('2d');

var keys = {};

window.onkeydown = function(event) {
	var key = event.code;
	keys[key] = true;
}

window.onkeyup = function(event) {
	var key = event.code;
	keys[key] = false;
}

var enemyBullets = [];
var playerBullets = [];
var playerBulletCooldown = 0;

var player = {
	x: 0,
	y: 11,
	width: .5,
	height: .5,
	health: 100
}

var enemies = [
	{
		x: 0,
		y: -5,
		size: .75, 
		health: 20,
		isBoss: true,
		moves: [0, 1, 2],
		doingMove: true
	}
]

var activeMoves = []

// each are 100 frames long
var boss_moves = [
	function(boss, frame) {
		if (frame % 3 == 0) {
			var theta = 2 * Math.PI * frame / 100
			var x = Math.cos(theta);
			var y = Math.sin(theta);
			enemyBullets.push({
				x: boss.x + 0.25 * x,
				y: boss.y + 0.25 * y,
				deltaX: x / 2,
				deltaY: y / 2,
				damage: 10
			});
		}
	},
	function(boss, frame) {
		if (frame % 3 == 0) {
			var theta = -2 * Math.PI * frame / 100
			var x = Math.cos(theta);
			var y = Math.sin(theta);
			enemyBullets.push({
				x: boss.x + 0.25 * x,
				y: boss.y + 0.25 * y,
				deltaX: x / 2,
				deltaY: y / 2,
				damage: 10
			});
		}
	},
	function(boss, frame) {
		if (frame % 3) {
			var theta = 2 * Math.PI * frame / 6.1
			var x = Math.cos(theta);
			var y = Math.sin(theta);
			enemyBullets.push({
				x: boss.x + 0.25 * x,
				y: boss.y + 0.25 * y,
				deltaX: x / 2,
				deltaY: y / 2,
				damage: 10
			});
		}
	}
]

function sq(x) {
	return x * x
}

activeMoves.push({
	b: enemies[0],
	f: boss_moves[enemies[0].moves[Math.floor(Math.random() * enemies[0].moves.length)]],
	frames:  100
});

function tick() {
	if (keys["ArrowUp"] && player.y > -16) {
		player.y -= 0.2
	}
	if (keys["ArrowDown"] && player.y < 16) {
		player.y += 0.2
	}
	if (keys["ArrowLeft"] && player.x > -11) {
		player.x -= 0.2
	}
	if (keys["ArrowRight"] && player.x < 11) {
		player.x += 0.2
	}
	playerBulletCooldown--;
	if (keys["Space"] && playerBulletCooldown < 0) {
		playerBullets.push({
			x: player.x,
			y: player.y,
			deltaX: 0,
			deltaY: -0.5,
			damage: 5
		})
		playerBulletCooldown = 200;
	}
	if (activeMoves.length) {
		activeMoves = activeMoves.map(move => {
			move.f(move.b, move.frames);
			if (move.frames--) {
				return move
			} else {
				move.b.doingMove = false
			}
		}).filter(x=>x);
	}

	var size = canvas.getBoundingClientRect();
	canvas.width = size.width;
	canvas.height = size.height;
	context.translate(canvas.width/2, canvas.height/2);

	var unit = Math.min(canvas.width, canvas.height)/32;
	// used for scaling so that every screen size gets the same game.

	// end pre-calculations, start drawing
	context.fillStyle = "black";
	context.beginPath();
	context.arc(player.x * unit, player.y * unit, unit/2, 0, 2 * Math.PI);
	context.fill();

	enemies = enemies.map(enemy => {
		if (enemy.health > 0) {
			context.fillStyle = "green";
			context.beginPath();
			context.arc(enemy.x * unit, enemy.y * unit, enemy.size * unit, 0, 2 * Math.PI);
			context.fill();
			if (enemy.isBoss && !enemy.doingMove && 0.01 > Math.random()) {
				enemy.doingMove = true;
				activeMoves.push({
					b: enemy,
					f: boss_moves[enemy.moves[Math.floor(Math.random() * enemy.moves.length)]],
					frames:  100
				});
			}
			return enemy
		}
	}).filter(x=>x);

	enemyBullets = enemyBullets.map(bullet=>{
		bullet.x += bullet.deltaX
		bullet.y += bullet.deltaY

		context.fillStyle = "red";
		context.beginPath();
		context.arc(bullet.x * unit, bullet.y * unit, unit/8, 0, 2 * Math.PI);
		context.fill();

		if (Math.abs(bullet.x) > 11 || Math.abs(bullet.y) > 16) {
			return null
		}
		if (sq(bullet.x - player.x) + sq(bullet.y - player.y) < 25/64) { // 25/64 = (.5 + .125) ** 2
			console.log("collision!");
			player.health -= bullet.damage;
			return null;
		}
		return bullet
	}).filter(x=>x);

	playerBullets = playerBullets.map(bullet=>{
		bullet.x += bullet.deltaX
		bullet.y += bullet.deltaY

		context.fillStyle = "crimson";
		context.beginPath();
		context.arc(bullet.x * unit, bullet.y * unit, unit/8, 0, 2 * Math.PI);
		context.fill();
		if (Math.abs(bullet.x) > 11 || Math.abs(bullet.y) > 16) {
			return null
		}
		var bulletUsed = false;
		enemies = enemies.map(enemy => {
			if (!bulletUsed && sq(bullet.x - enemy.x) + sq(bullet.y - enemy.y) < sq(enemy.size + .125)) { // 25/64 = (.5 + .125) ** 2
				console.log("enemy collision!");
				enemy.health -= bullet.damage;
				bulletUsed = true;
			}
			return enemy
		})
		if (!bulletUsed)
			return bullet
	}).filter(x=>x);

	window.requestAnimationFrame(tick)
}

tick();