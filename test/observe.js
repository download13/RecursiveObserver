describe('RecursiveObserver', function() {
	var changes = [];
	var cb = function(c) {
		changes = changes.concat(c);
	}
	var o = {};
	o.o2 = {};
	o.a2 = [];
	it('should start observing a loaded object', function(done) {
		RecursiveObserver.observe(o, cb);

		assertsAsync(function() {
			assert.deepEqual(changes.shift(), {type: 'update', name: 'o2', path: 'o2', newValue: {}, oldValue: undefined});
			assert.deepEqual(changes.shift(), {type: 'update', name: 'a2', path: 'a2', newValue: [], oldValue: undefined});
			assert.equal(changes.length, 0);
		}, done);
	});
	describe('Events fire', function() {
		describe('when properties are added', function() {
			describe('directly', function() {
				it('number', function(done) {
					o.n = 1;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: 1, oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					o.s = 'testString';

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 's', path: 's', newValue: 'testString', oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					o.o = {};

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'o', path: 'o', newValue: {}, oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					o.a = [];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'a', path: 'a', newValue: [], oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('loaded object', function(done) {
					o.lo = {test: 1, testO: {t: 1}, testA: [5], str: 'wut'};

					assertsAsync(function() {

						assert.deepEqual(changes.shift(), {
							type: 'update',
							name: 'lo',
							path: 'lo',
							newValue: {test: 1, testO: {t: 1}, testA: [5], str: 'wut'},
							oldValue: undefined
						});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'test', path: 'lo.test', newValue: 1, oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'testO', path: 'lo.testO', newValue: {t: 1}, oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'testA', path: 'lo.testA', newValue: [5], oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'str', path: 'lo.str', newValue: 'wut', oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'update', name: 't', path: 'lo.testO.t', newValue: 1, oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'splice', object: [5], index: 0, removed: [], addedCount: 1, path: 'lo.testA'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('loaded array', function(done) {
					o.la = [1, {t: 1}, [5], 'wut'];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {
							type: 'update',
							name: 'la',
							path: 'la',
							newValue: [1, {t: 1}, [5], 'wut'],
							oldValue: undefined
						});
						assert.deepEqual(changes.shift(), {
							type: 'splice',
							object: [1, {t: 1}, [5], 'wut'],
							index: 0,
							removed: [],
							addedCount: 4,
							path: 'la'
						});
						assert.deepEqual(changes.shift(), {type: 'update', name: 't', path: 'la.1.t', newValue: 1, oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'splice', object: [5], index: 0, removed: [], addedCount: 1, path: 'la.2'});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
			describe('to a sub-object', function() {
				it('number', function(done) {
					o.o2.n = 2;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'o2.n', newValue: 2, oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					o.o2.s = 'sd';

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 's', path: 'o2.s', newValue: 'sd', oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					o.o2.o = {};

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'o', path: 'o2.o', newValue: {}, oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					o.o2.a = [];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'a', path: 'o2.a', newValue: [], oldValue: undefined});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
			describe('to a sub-array', function() {
				it('number', function(done) {
					o.a2.push(3);

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3], index: 0, removed: [], addedCount: 1, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					o.a2.push('str');

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 'str'], index: 1, removed: [], addedCount: 1, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					o.a2.push({});

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 'str', {}], index: 2, removed: [], addedCount: 1, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					o.a2.push([]);

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 'str', {}, []], index: 3, removed: [], addedCount: 1, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('by splicing', function (done) {
					var buncha = [1, 2, [], {}, 5, 'strings'];
					o.a2.splice.bind(o.a2, 0, 0).apply(null, buncha);

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {
							type: 'splice',
							object: [1, 2, [], {}, 5, 'strings', 3, 'str', {}, []],
							index: 0,
							removed: [],
							addedCount: 6,
							path: 'a2'
						});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
		});
		describe('when properties are updated', function() {
			describe('object properties', function() {
				it('number to object', function(done) {
					o.n = {};

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: {}, oldValue: 1});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object to string', function(done) {
					o.n = 'testString';

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: 'testString', oldValue: {}});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string to array', function(done) {
					o.n = [];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: [], oldValue: 'testString'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array to number', function(done) {
					o.n = 1;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: 1, oldValue: []});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
			describe('array elements', function() {
				it('set numbers', function(done) {
					o.uta = [3, 5, 7];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'uta', path: 'uta', newValue: [3, 5, 7], oldValue: undefined});
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 5, 7], index: 0, removed: [], addedCount: 3, path: 'uta'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('number to array', function(done) {
					o.uta[1] = ['c'];

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, ['c'], 7], index: 1, removed: [5], addedCount: 1, path: 'uta'});
						assert.deepEqual(changes.shift(), {type: 'splice', object: ['c'], index: 0, removed: [], addedCount: 1, path: 'uta.1'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array to string', function(done) {
					o.uta[1] = 'gh';

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 'gh', 7], index: 1, removed: [['c']], addedCount: 1, path: 'uta'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string to object', function(done) {
					o.uta[1] = {};

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, {}, 7], index: 1, removed: ['gh'], addedCount: 1, path: 'uta'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object to number', function(done) {
					o.uta[1] = 5;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 5, 7], index: 1, removed: [{}], addedCount: 1, path: 'uta'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('all to undefined', function(done) {
					o.uta[0] = undefined;
					o.uta[1] = undefined;
					o.uta[2] = undefined;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {
							type: 'splice',
							object: [undefined, undefined, undefined],
							index: 0,
							removed: [3],
							addedCount: 1,
							path: 'uta'
						});
						assert.deepEqual(changes.shift(), {
							type: 'splice',
							object: [undefined, undefined, undefined],
							index: 1,
							removed: [5],
							addedCount: 1,
							path: 'uta'
						});
						assert.deepEqual(changes.shift(), {
							type: 'splice',
							object: [undefined, undefined, undefined],
							index: 2,
							removed: [7],
							addedCount: 1,
							path: 'uta'
						});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
		});
		describe('when properties are removed', function() {
			describe('directly', function() {
				it('number', function(done) {
					delete o.n;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'n', newValue: undefined, oldValue: 1});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					delete o.s;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 's', path: 's', newValue: undefined, oldValue: 'testString'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					delete o.o;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'o', path: 'o', newValue: undefined, oldValue: {}});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					delete o.a;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'a', path: 'a', newValue: undefined, oldValue: []});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('by deleting a high-level object', function(done) {
					delete o.lo;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 't', path: 'lo.testO.t', newValue: undefined, oldValue: 1});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'test', path: 'lo.test', newValue: undefined, oldValue: 1});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'testO', path: 'lo.testO', newValue: undefined, oldValue: {t: 1}});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'testA', path: 'lo.testA', newValue: undefined, oldValue: [5]});
						assert.deepEqual(changes.shift(), {type: 'update', name: 'str', path: 'lo.str', newValue: undefined, oldValue: 'wut'});
						assert.deepEqual(changes.shift(), {
							type: 'update',
							name: 'lo',
							path: 'lo',
							newValue: undefined,
							oldValue: {test: 1, testO: {t: 1}, testA: [5], str: 'wut'}
						});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('by deleting a high-level array', function(done) {
					delete o.la;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 't', path: 'la.1.t', newValue: undefined, oldValue: 1});
						assert.deepEqual(changes.shift(), {
							type: 'update',
							name: 'la',
							path: 'la',
							newValue: undefined,
							oldValue: [1, {t: 1}, [5], 'wut']
						});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
			describe('from a sub-object', function() {
				it('number', function(done) {
					delete o.o2.n;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'n', path: 'o2.n', newValue: undefined, oldValue: 2});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					delete o.o2.s;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 's', path: 'o2.s', newValue: undefined, oldValue: 'sd'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					delete o.o2.o;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'o', path: 'o2.o', newValue: undefined, oldValue: {}});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					delete o.o2.a;

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'update', name: 'a', path: 'o2.a', newValue: undefined, oldValue: []});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
			describe('from a sub-array', function() {
				it('by splicing', function(done) {
					o.a2.splice(0, 6);

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [3, 'str', {}, []], index: 0, removed: [1, 2, [], {}, 5, 'strings'], addedCount: 0, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('number', function(done) {
					o.a2.shift();

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: ['str', {}, []], index: 0, removed: [3], addedCount: 0, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('string', function(done) {
					o.a2.shift();

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [{}, []], index: 0, removed: ['str'], addedCount: 0, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('object', function(done) {
					o.a2.shift();

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [[]], index: 0, removed: [{}], addedCount: 0, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
				it('array', function(done) {
					o.a2.shift();

					assertsAsync(function() {
						assert.deepEqual(changes.shift(), {type: 'splice', object: [], index: 0, removed: [[]], addedCount: 0, path: 'a2'});
						assert.equal(changes.length, 0);
					}, done);
				});
			});
		});
		
		/*
		it('should replace an array property correctly', function(done) {
			// TODO: Same here
			changes = [];

			o.a = 3;
			
			setTimeout(function() {
				asserts(function() {
					assert.deepEqual(changes.shift(), {type: 'update', name: 'a', path: 'a', newValue: 3, oldValue: [20, 5, 6]});
					assert.equal(changes.length, 0);
				}, done);
			}, DELAY);
		});
		
*/
	});
	describe('changing array positions', function() {
		it('should update the paths for objects in the array', function(done) {
			var to = {k: 1};
			o.ta = [];

			o.ta.push(to);
			o.ta.splice(0, 0, 5, 87);

			assertsAsync(function() {
				assert.deepEqual(changes.shift(), {type: 'update', name: 'ta', path: 'ta', newValue: [5, 87, {k: 1}], oldValue: undefined});
				assert.deepEqual(changes.shift(), {type: 'splice', object: [5, 87, {k: 1}], index: 0, removed: [], addedCount: 3, path: 'ta'});
				assert.deepEqual(changes.shift(), {type: 'update', name: 'k', path: 'ta.2.k', newValue: 1, oldValue: undefined});
				assert.equal(changes.length, 0);

				o.ta.splice(0, 1);
				to.k = 3;
			}, function(err) {
				assertsAsync(function() {
					if(err) return done(err);

					assert.deepEqual(changes.shift(), {type: 'splice', object: [87, {k: 3}], index: 0, removed: [5], addedCount: 0, path: 'ta'});
					assert.deepEqual(changes.shift(), {type: 'update', name: 'k', path: 'ta.1.k', newValue: 3, oldValue: 1});
					assert.equal(changes.length, 0);
				}, done);
			});
		});
	});
	describe('stop observing', function() {
		it('without firing events', function(done) {
			changes = [];
			RecursiveObserver.unobserve(o, cb);
			o.test = 0;

			assertsAsync(function() {
				assert.equal(changes.length, 0);
			}, done);
		});
	});
});

function asserts(fn, done) {
	try {
		fn();
		done();
	} catch(e) {
		done(e);
	}
}
function assertsAsync(fn, done) {
	setTimeout(function() {
		asserts(fn, done);
	}, 1);
}

// Root and sub checks for every function
// Checks for adding a subtree
// Checks for unobserving