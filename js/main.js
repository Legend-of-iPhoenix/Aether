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
		moves: [0, 1],
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
	context.beginPath();
	context.arc(player.x * unit, player.y * unit, unit/2, 0, 2 * Math.PI);
	context.fill();

	enemies = enemies.map(enemy => {
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
	})

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

	window.requestAnimationFrame(tick)
}

//tick();