(function(exports) {
	'use strict';

	function Observer(opts) {
		this.o = opts.watch;
		this.cb = function(changes) {
			if(changes && changes.length) opts.cb(changes);
		}
		this.parent = opts.parent;
		this.name = opts.name;

		this._handler = this._handler.bind(this);
		this._addChild = this._addChild.bind(this);
	}
	Observer.prototype.getPath = function() {
		var path;
		if(this.parent) path = this.parent.getPath();
		else path = [];
		if(this.name != null) path.push(this.name);
		return path;
	}


	function ObjectObserver(opts) {
		// Call super
		Observer.call(this, opts);
		var o = this.o;
		if(!(o instanceof Object)) throw new Error('Object required');

		this._children = {};
		Object.observe(o, this._handler);

		// Ensure we fire events for anything already on this object
		var notifier = Object.getNotifier(o);
		Object.keys(o).forEach(function(key) {
			notifier.notify({
				type: 'update',
				name: key,
				oldValue: undefined,
				newValue: o[key]
			});
		});
	}
	ObjectObserver.prototype = Object.create(Observer.prototype);
	ObjectObserver.prototype._handler = function(changes, fake) {
		changes = minimizeObjChanges(changes.map(translateToUpdate));
		var context = this.getPath().join('.');
		changes.forEach(function(change) {
			change.path = combine(context, change.name);
		}, this);

		if(!fake) {
			changes.forEach(this._handleUpdate, this);
		}
		this.cb(changes);
	}
	ObjectObserver.prototype._handleUpdate = function(change) {
		this._removeChild(change.name, true);
		this._addChild(change.name, change.newValue);
	}
	ObjectObserver.prototype._addChild = function(name, o) {
		if(!(o instanceof Object)) return;
		var ch = this._children;
		var obs = ch[name];
		if(obs == null) {
			var obs = createObserver({watch: o, cb: this.cb, parent: this, name: name});
			ch[name] = obs;
		}
	}
	ObjectObserver.prototype._removeChild = function(name, notify) {
		var obs = this._children[name];
		if(obs) {
			obs.destroy(notify);
			delete this._children[name];
		}
	}
	ObjectObserver.prototype.destroy = function(notify) { // TODO: Option to send out notifications or not
		// Destroy all child properties
		Object.keys(this._children).forEach(function(name) {
			this._removeChild(name, notify);
		}, this);

		// Send notifications about all properties going away
		var o = this.o;
		if(notify) {
			// TODO: Try running the changes through _change so they get a path and automatically activate _removeChild
			var changes = Object.keys(o).map(function(key) {
				return {
					type: 'update',
					name: key,
					oldValue: o[key],
					newValue: undefined
				};
			});
			this._handler(changes, true);
		}

		Object.unobserve(o, this._handler);
	}


	function ArrayObserver(opts) {
		Observer.call(this, opts);
		var o = this.o;
		if(!Array.isArray(o)) throw new Error('Array required');

		this._children = new Map();
		this._childObjects = []; // XXX: This is only because Maps don't have iteration yet
		Array.observe(o, this._handler);

		if(o.length > 0) {
			Object.getNotifier(o).notify({
				type: 'splice',
				index: 0,
				removed: [],
				addedCount: o.length,
				object: o
			});
		}
	}
	ArrayObserver.prototype = Object.create(Observer.prototype);
	ArrayObserver.prototype._handler = function(changes) {
		changes = changes.map(translateToUpdate);

		var context = this.getPath().join('.');
		changes.forEach(function(change) {
			change.path = context;
		});

		changes.forEach(this._handleSplice, this);
		this.o.forEach(this._addChild); // Try to add all items, only new ones succeed
		this.cb(changes);
	}
	ArrayObserver.prototype._handleSplice = function(change) {
		var n = change.index;
		var ch = this._children;

		change.removed.forEach(function(item) {
			this._removeChild(item, true);
		}, this);
		// TODO: Remove corresponding child observers to the items removed

		// TODO: Add child observers for the items added

		// TODO: Correct the name offsets for existing child observers
	}
	ArrayObserver.prototype._addChild = function(o, index) {
		if(!(o instanceof Object)) return;
		var ch = this._children;
		var obs = ch.get(o);
		if(obs === undefined) {
			obs = createObserver({
				watch: o,
				cb: this.cb,
				parent: this,
				name: index
			});
			ch.set(o, obs);
			this._childObjects.push(o);
		} else {
			obs.name = index;
		}
	}
	ArrayObserver.prototype._removeChild = function(o, notify) {
		var ch = this._children;
		var obs = ch.get(o);
		if(obs) {
			obs.destroy(notify);
			ch.delete(name);
			var co = this._childObjects;
			var pos = co.indexOf(o);
			co.splice(pos, 1);
		}
	}
	ArrayObserver.prototype.destroy = function(notify) {
		// Destroy all child properties
		this._childObjects.forEach(function(o) {
			this._removeChild(o, notify);
		}, this);

		Array.unobserve(this.o, this._handler);
	}



	function combine(context, name) {
		if(context) {
			return context + '.' + name;
		}
		return name;
	}

	function translateToUpdate(change) {
		var r = {};
		for(var i in change) {
			r[i] = change[i];
		}
		if(r.type == 'add') {
			r.type = 'update';
			r.oldValue = undefined;
			r.newValue = r.object[r.name];
		} else if(r.type == 'delete') {
			r.type = 'update';
			r.newValue = undefined;
		} else if(r.type == 'update') {
			if(r.object != null) { // Only edit real ones, not fake destroy outputs
				r.newValue = r.object[r.name];
			}
			if(Array.isArray(r.object)) {
				r = {
					type: 'splice',
					removed: [r.oldValue],
					addedCount: 1,
					index: parseInt(r.name),
					object: r.object
				};
			}
		}
		if(r.type != 'splice') {
			delete r.object;
		}
		return r;
	}
	function minimizeObjChanges(changes) {
		changes = changes.filter(function(change) {
			return change.type != 'splice';
		});
		if(changes.length < 2) return changes;

		// Get the oldest value for each property
		var names = {};
		return changes.filter(function(change) {
			var n = change.name;
			var c = names[n];
			if(c) {
				c.newValue = change.newValue;
				return false;
			}
			names[n] = change;
			return true;
		}).filter(function(change) {
			if(change.oldValue === change.newValue) return false;
			return true;
		});
	}
	function minimizeArrayChanges(changes) {
		changes = changes.filter(function(change) {
			return change.type == 'splice';
		});
		if(changes.length < 2) return changes;
		return changes;

		// TODO: Do this later
		changes.forEach(function(change, i, a) {
			var offs = change.addedCount - change.removed.length;
			if(offs != 0) {
				for(i++; i < a.length; i++) {
					change.index += offs;
				}
			}
		});
		return changes;
	}

	function createObserver(opts) {
		if(Array.isArray(opts.watch)) return new ArrayObserver(opts);
		return new ObjectObserver(opts);
	}

	var objs = new Map();
	Observer.observe = function(o, cb) {
		var cbs = objs.get(o);
		if(cbs == null) {
			cbs = new Map();
			objs.set(o, cbs);
		}
		var obs = cbs.get(cb);
		if(obs == null) {
			obs = createObserver({watch: o, cb: cb});
			cbs.set(cb, obs);
		}
	}
	Observer.unobserve = function(o, cb) {
		var cbs = objs.get(o);
		if(cbs == null) {
			cbs = new Map();
			objs.set(o, cbs);
		}
		var obs = cbs.get(cb);
		if(obs != null) {
			obs.destroy();
			cbs.delete(cb);
		}
	}

	exports.RecursiveObserver = Observer;
})(this);
