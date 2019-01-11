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
	size: 0.5,
	health: 100
}

var enemies = [
	{
		x: 2,
		y: -3,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: -2,
		y: -3,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: 0,
		y: -6,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: 0,
		y: 0,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: -4,
		y: 0,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: 4,
		y: 0,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: 2,
		y: 3,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: -2,
		y: 3,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
	},
	{
		x: 0,
		y: 6,
		size: .75, 
		health: 20,
		isBoss: true,
		moves:  [0, 1, 2, 3],
		doingMove: false
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
				deltaX: x / 64,
				deltaY: y / 64,
				size: .125,
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
				deltaX: x / 64,
				deltaY: y / 64,
				size: .125,
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
				deltaX: x / 64,
				deltaY: y / 64,
				size: .125,
				damage: 10
			});
		}
	},
	function(boss, frame) {
		if (frame % 50 == 0) {
			enemyBullets.push({
				x: boss.x,
				y: boss.y,
				deltaX: 0,
				deltaY: 0,
				size: .5,
				damage: 20,
				seeking: true,
				age: 750
			});
		}
	}
]

function sq(x) {
	return x * x
}

var frameTime = 0;
var frameEnd = 0;

var maxBullets = 0;
function tick() {
	var arcs = [];
	if (enemyBullets.length > maxBullets) {
		maxBullets = enemyBullets.length
		console.log("max bullets: " + maxBullets);
	}
	var frameStart = performance.now();
	if ((keys["ArrowUp"] || keys["KeyW"]) && player.y > -16) {
		player.y -= 0.2
	}
	if ((keys["ArrowDown"] || keys["KeyS"]) && player.y < 16) {
		player.y += 0.2
	}
	if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > -11) {
		player.x -= 0.2
	}
	if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < 11) {
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

	context.fillStyle = "black";
	context.textBaseline = "hanging";
	context.fillText(Math.floor(10 * frameTime) + ' \u03BCs per frame', -canvas.width/2, -canvas.height/2 + unit/4)

	// end pre-calculations, start drawing
	context.beginPath();
	context.arc(player.x * unit, player.y * unit, unit/2, 0, 2 * Math.PI);
	context.fill();
	var len = enemies.length;
	for (var i = 0; i < len; i++) {
		var enemy = enemies[i]
		if (enemy.health > 0) {
			context.fillStyle = "green";
			context.beginPath();
			context.arc(enemy.x * unit, enemy.y * unit, enemy.size * unit, 0, 2 * Math.PI);
			context.fill();
			if (enemy.isBoss && !enemy.doingMove /*&& 0.01 > Math.random()*/) {
				enemy.doingMove = true;
				activeMoves.push({
					b: enemy,
					f: boss_moves[enemy.moves[Math.floor(Math.random() * enemy.moves.length)]],
					frames:  100
				});
			}
			enemies[i] = enemy
			continue
		}
		enemies[i] = null
	}

	enemies = enemies.filter(x=>x);
	var len = enemyBullets.length;
	for (var i = 0; i < len; i++) {
		var bullet = enemyBullets[i];
		if (bullet.seeking) {
			var angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
			bullet.deltaX = (Math.cos(angle) / 32) * 0.8 + bullet.deltaX * 0.2
			bullet.deltaY = (Math.sin(angle) / 32) * 0.8 + bullet.deltaY * 0.2
			bullet.age--;
			if (bullet.age <= 0) {
				for (var _ = 0; _ < 10; _++) {
					var x = Math.cos(_ * Math.PI / 5);
					var y = Math.sin(_ * Math.PI / 5);
					enemyBullets.push({
						x: bullet.x + 0.25 * x,
						y: bullet.y + 0.25 * y,
						deltaX: 2 * x / 3,
						deltaY: 2 * y / 3,
						size: .125,
						damage: 5
					});
				}
				enemyBullets[i] = null;
				continue
			}
		}
		bullet.x += bullet.deltaX
		bullet.y += bullet.deltaY

		enemyBullets[i] = bullet

		arcs.push([bullet.x * unit, bullet.y * unit, unit * bullet.size])

		if (bullet.x * bullet.x > 121 || bullet.y * bullet.y > 256) {
			enemyBullets[i] = null;
			continue
		}

		if (bullet.x - bullet.size > player.x + player.size || bullet.y - bullet.size > player.y + player.size) {
			continue
		}
		if (bullet.x + bullet.size < player.x - player.size || bullet.y + bullet.size < player.y - player.size) {
			continue
		}

		if (sq(bullet.x - player.x) + sq(bullet.y - player.y) < sq(player.size + bullet.size)) {
			console.log("collision! (-" + bullet.damage + ")");
			player.health -= bullet.damage;
			enemyBullets[i] = null;
			continue
		}
	}
	enemyBullets = enemyBullets.filter(x=>x);

	context.fillStyle = "red";
	context.beginPath()
	var len = arcs.length;
	for (var i = 0; i < len; i++) {
		context.moveTo(...arcs[i])
		context.arc(...arcs[i], 0, 2 * Math.PI)
	}
	context.fill();


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
	frameTime = frameStart - frameEnd
	frameEnd = frameStart

	if (frameTime > (1000 / 30)) { // 60 fps
		console.log("Lagging (" + (frameTime) + ") with " + enemyBullets.length)
	}
	window.requestAnimationFrame(tick)
}

tick();