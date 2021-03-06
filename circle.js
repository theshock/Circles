atom.declare('Circles.Circle', App.Element,
{
	radius:       5,
	speed:        0.1,
	growSpeed:    30,
	growMax:      50,
	grownTime:    0,
	grownTimeMax: 5000,
	dwindleSpeed: 20,
	colour:       "#000000",
	state:        "move",
	buffer:       null,
	
	get canvasSize ()
	{
		return this.settings.get('fieldSize');
	},

	get fieldShape ()
	{
		return this.controller.shape;
	},
	
	configure: function method ()
	{

		this.controller = this.settings.get('controller');
		this.colour     = this.settings.get('colour') || atom.Color.random().toString();
		this.impulse    = this.getRandomImpulse();

		this.shape = new Circle(
			this.makeCenterPoint(),
			this.radius
		);
		
		this.state = this.settings.get('state');

		this.updateCache();
	},

	getRandomImpulse: function ()
	{
		var x, y;
		x = Number.randomFloat(-this.speed, this.speed);
		y = Math.sqrt(this.speed * this.speed - x*x) * (Math.random() > 0.5 ? 1 : -1);
		return new Point(x, y);
	},

	move: function (time)
	{
		return new Point(
			this.impulse.x * time,
			this.impulse.y * time
		);
	},

	makeCenterPoint: function ()
	{
		return this.settings.get('point') || this.fieldShape.getRandomPoint(10);
	},

	// Update
	onUpdate: function (t)
	{
		this.redraw();
		this[this.state + 'State'](t);
    },

	moveState: function (t)
	{
		this.shape.center.move(this.move(t));
		this.collideBounds(t);
	},

	growState: function (t)
	{
		if (this.shape.radius >= this.growMax)
		{
			this.state = "calm";
			this.shape.radius = this.growMax;
			this.updateCache();
		}
		else
		{
			this.shape.radius += this.growSpeed / t;
		}
		this.checkCollision();
	},

	calmState: function (t)
	{
		this.grownTime += t;

		if (this.grownTime > this.grownTimeMax)
		{
			this.state = "dwindle";
		}
		this.checkCollision();
	},

	dwindleState: function (t)
	{
		this.shape.radius -= this.dwindleSpeed / t;
		if (this.shape.radius > 0)
		{
			this.redraw();
		}
		else
		{
			this.shape.radius = 0;
			this.state = "destroy";
		}
		this.checkCollision();
	},

	destroyState: function (t) {
		this.controller.removeCircle(this);
	},

	// Collisions
	checkCollision: function ()
	{
		this.controller.checkCollision(this);
	},
	
	collideBounds: function(t)
	{
		this.collideBoundsAxis('x', t);
		this.collideBoundsAxis('y', t);
	},

	collideBoundsAxis: function (axis, t)
	{
		if (this.isOutOfBounds(axis))
		{
			this.impulse[axis] *= -1;
			this.shape.center[axis] += this.move(t)[axis];
		}
	},

	isOutOfBounds: function (axis)
	{
		var s = this.shape;
		return s.center[axis] < s.radius
		    || s.center[axis] + s.radius > this.canvasSize[axis];
	},

	// View
	updateCache: function () {
		var
			cache = this.cache,
			r = this.shape.radius,
			s = Math.ceil(r * 2),
			shape = new Circle(s/2, s/2, r);

		if (cache) {
			cache.width = cache.height = s;
		} else {
			cache = this.cache = LibCanvas.buffer(s, s, true);
		}

		cache.ctx.fill(shape, this.colour);

		// To check, what circles are drawn from cache - uncomment this line:
		// cache.ctx.stroke(shape, 'black');
	},

	renderTo: function (ctx, resources)
	{
		if (this.state == 'move' || this.state == 'calm') {
			ctx.drawImage({
				image   : this.cache,
				center  : this.shape.center,
				optimize: true
			});
		} else {
			ctx.fill( this.shape, this.colour );
		}
    }
});