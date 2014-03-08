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
		this._removeChild = this._removeChild.bind(this);
	}
	Observer.prototype.getPath = function(includeThis) {
		var path;
		if(this.parent) path = this.parent.getPath(true);
		else path = [];
		if(includeThis && this.name != null) path.push(this.name);
		return path;
	}


	function ObjectObserver(opts) {
		Observer.call(this, opts);
		var o = this.o;
		if(!(o instanceof Object)) throw new Error('Object required');

		this._children = {};
		Object.observe(o, this._handler);

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
	ObjectObserver.prototype._handler = function(changes) {
		var context = '';
		if(this.name) {
			context = this.getPath(true).join('.');
		}
		changes = minimizeObjChanges(changes.map(translateToUpdate));
		changes.forEach(this._change.bind(this, context));
		this.cb(changes);
	}
	ObjectObserver.prototype._change = function(context, change) {
		var name = change.name;
		change.path = combine(context, name);
		this._removeChild(name);
		this._addChild(name, change.newValue);
		return change;
	}
	ObjectObserver.prototype._addChild = function(name, o) {
		if(!(o instanceof Object)) return;
		var obs;
		if(Array.isArray(o)) {
			obs = new ArrayObserver({watch: o, cb: this.cb, parent: this, name: name});
		} else {
			obs = new ObjectObserver({watch: o, cb: this.cb, parent: this, name: name});
		}
		this._children[name] = obs;
	}
	ObjectObserver.prototype._removeChild = function(name) {
		var obs = this._children[name];
		if(obs) {
			obs.destroy(true);
			delete this._children[name];
		}
	}
	ObjectObserver.prototype.destroy = function(notify) { // TODO: Option to send out notifications or not
		// Destroy all child properties
		Object.keys(this._children).forEach(this._removeChild);

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
			this.cb(changes);
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
		var context = '';
		if(this.name) {
			context = this.getPath(true).join('.');
		}
		changes = changes.map(translateToUpdate);
		changes.forEach(this._change.bind(this, context));
		this.o.forEach(this._addChild); // Try to add all items, only new ones succeed
		this.cb(changes);
	}
	ArrayObserver.prototype._change = function(context, change) {
		change.path = context;
		var n = change.index;
		var ch = this._children;

		change.removed.forEach(function(item) {
			this._removeChild(item);
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
	ArrayObserver.prototype._removeChild = function(o) {
		var ch = this._children;
		var obs = ch.get(o);
		if(obs) {
			obs.destroy(true);
			ch.delete(name);
			var co = this._childObjects;
			var pos = co.indexOf(o);
			co.splice(pos, 1);
		}
	}
	ArrayObserver.prototype.destroy = function(notify) {
		// Destroy all child properties
		this._childObjects.forEach(this._removeChild);

		// Send notifications about all properties going away
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
			if(change.oldValue === change.newValue) return false;
			var n = change.name;
			if(n in names) return false;
			names[n] = 1;
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
