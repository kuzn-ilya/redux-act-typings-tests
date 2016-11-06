import * as chai from 'chai';
import * as Mocha from 'mocha';

import {createStore, combineReducers} from 'redux';
import {createAction, createReducer, batch} from 'redux-act';
const expect = chai.expect;

describe('createReducer', function () {
  let increment, decrement, add, sub, firstReducer, secondReducer, funkyReducer;

  it('should init', function () {
    increment = createAction();
    decrement = createAction();
    add = createAction();
    sub = createAction();

    firstReducer = createReducer({
      [increment.toString()]: (state)=> state + 1,
      [add.toString()]: (state, payload)=> state + payload
    }, 0);

    secondReducer = createReducer(function (on) {
      on(decrement, (state)=> state - 1);
      on(sub, (state, payload: number)=> state - payload);
    }, 42);

    funkyReducer = createReducer(function (on, off) {
      on(increment, state => {
        off(add);
        on(sub, (state, payload: number)=> state - payload);
        return state + 1;
      });

      on(decrement, state => {
        off(sub);
        on(add, (state, payload: number)=> state + payload);
        return state - 1;
      });
    }, 0);
  });

  it('should be a valid first reducer', function () {
    expect(firstReducer).to.be.a('function');
  });

  it('should be a valid second reducer', function () {
    expect(secondReducer).to.be.a('function');
  });

  it('should update a store', function () {
    const store = createStore(firstReducer, 0);
    store.dispatch(increment());
    expect(store.getState()).to.equal(1);
    store.dispatch(increment());
    expect(store.getState()).to.equal(2);
    store.dispatch(add(40));
    expect(store.getState()).to.equal(42);
  });

  it('should update a store bis', function () {
    const store = createStore(secondReducer, 42);
    store.dispatch(decrement());
    expect(store.getState()).to.equal(41);
    store.dispatch(decrement());
    expect(store.getState()).to.equal(40);
    store.dispatch(sub(40));
    expect(store.getState()).to.equal(0);
  });

  it('should combine reducers', function () {
    const ultimateReducer = combineReducers({
      up: firstReducer,
      down: secondReducer
    });

    const store = createStore(ultimateReducer);

    store.dispatch(increment());
    expect(store.getState()).to.deep.equal({up: 1, down: 42});
    store.dispatch(increment());
    expect(store.getState()).to.deep.equal({up: 2, down: 42});
    store.dispatch(decrement());
    expect(store.getState()).to.deep.equal({up: 2, down: 41});
    store.dispatch(sub(30));
    expect(store.getState()).to.deep.equal({up: 2, down: 11});
    store.dispatch(add(40));
    expect(store.getState()).to.deep.equal({up: 42, down: 11});
    store.dispatch(decrement());
    expect(store.getState()).to.deep.equal({up: 42, down: 10});
    store.dispatch(sub(10));
    expect(store.getState()).to.deep.equal({up: 42, down: 0});
  });

  it('should have dynamic actions', function () {
    const handlers = {};
    const reducer = createReducer(handlers, 0);
    const store = createStore(reducer);
    const inc = createAction().assignTo(store);
    handlers[inc.toString()] = (state)=> state + 1;

    inc();
    expect(store.getState()).to.equal(1);
    inc();
    expect(store.getState()).to.equal(2);
    inc();
    expect(store.getState()).to.equal(3);

    delete handlers[inc.toString()];

    inc();
    expect(store.getState()).to.equal(3);
    inc();
    expect(store.getState()).to.equal(3);
  });

  it('should support on and off methods', function () {
    const reducer = createReducer({}, 0);
    const store = createStore(reducer);
    const inc = createAction().assignTo(store)

    reducer.on(inc, state=> state + 1)

    inc();
    expect(store.getState()).to.equal(1);
    inc();
    expect(store.getState()).to.equal(2);
    inc();
    expect(store.getState()).to.equal(3);

    reducer.off(inc);

    inc();
    expect(store.getState()).to.equal(3);
    inc();
    expect(store.getState()).to.equal(3);
  });

  it('should update its options', function () {
    const add = createAction();
    const reducer = createReducer({
      [add.toString()]: (state, action)=> state + action.payload
    }, 0);
    reducer.options({payload: false});
    const store = createStore(reducer);
    add.assignTo(store);

    add(3);
    expect(store.getState()).to.equal(3);
    add(2);
    expect(store.getState()).to.equal(5);

    reducer.on(add, (state, payload)=> state + payload);
    reducer.options({payload: true});

    add(-4);
    expect(store.getState()).to.equal(1);
    add(10);
    expect(store.getState()).to.equal(11);

    reducer.on(add, (state, action)=> state + action.payload);
    reducer.options({payload: false});

    add(30);
    expect(store.getState()).to.equal(41);
    add(1);
    expect(store.getState()).to.equal(42);
  });

  it('should support meta', function () {
    const add = createAction(undefined, undefined, arg=> arg * 2);
    const reducer = createReducer({
      [add.toString()]: (state, payload, meta)=> state + payload * meta
    }, 0);
    const store = createStore(reducer);
    add.assignTo(store);
    add(3);
    expect(store.getState()).to.equal(18);
  });

  it('should support on and off inside factory function', function () {
    const store = createStore(funkyReducer);
    increment.assignTo(store);
    decrement.assignTo(store);
    add.assignTo(store);
    sub.assignTo(store);

    // No add nor sub support at start
    add(5);
    expect(store.getState()).to.equal(0);
    sub(6);
    expect(store.getState()).to.equal(0);

    // increment => sub support
    increment();
    expect(store.getState()).to.equal(1);
    increment();
    expect(store.getState()).to.equal(2);
    sub(5);
    expect(store.getState()).to.equal(-3);
    add(3);
    expect(store.getState()).to.equal(-3);

    // decrement => add support
    decrement();
    expect(store.getState()).to.equal(-4);
    sub(10);
    expect(store.getState()).to.equal(-4);
    add(6);
    expect(store.getState()).to.equal(2);
  });

  it('should support empty handlers', function () {
    const action = createAction();
    const reducer = createReducer();
    const store = createStore(reducer);
    store.dispatch(action());
    expect(store.getState()).to.equal(undefined);
  });

  it('should accept batch when defined', function () {
    const reducer = createReducer({
      [batch.toString()]: (state) => state + 1, // just for fun, never do that
    }, 0);
    const store = createStore(reducer);
    expect(store.getState()).to.equal(0);
    store.dispatch(batch());
    expect(store.getState()).to.equal(1);
    store.dispatch(batch());
    expect(store.getState()).to.equal(2);
  });

  it('should test if it has a handler', function () {
    const a1 = createAction();
    const a2 = createAction();
    const reducer = createReducer({
      [a1.toString()]: () => 1,
      [a2.toString()]: () => 2,
    }, 0);

    expect(reducer.has(a1)).to.be.true;
    expect(reducer.has(a2)).to.be.true;
    expect(reducer.has(batch)).to.be.true;

    reducer.off(a2);

    expect(reducer.has(a1)).to.be.true;
    expect(reducer.has(a2)).to.be.false;
    expect(reducer.has(batch)).to.be.true;

    reducer.off(a1);

    expect(reducer.has(a1)).to.be.false;
    expect(reducer.has(a2)).to.be.false;
    expect(reducer.has(batch)).to.be.true;

    reducer.on(a2, () => 2);

    expect(reducer.has(a1)).to.be.false;
    expect(reducer.has(a2)).to.be.true;
    expect(reducer.has(batch)).to.be.true;
  });

  it('should be compatible', function () {
    const TYPE = 'TYPE';
    const a1 = () => ({ type: TYPE });
    const a2 = createAction();

    const reducer1 = createReducer({
      [TYPE]: () => 1,
      [a2.toString()]: () => 2,
    }, 0);

    const reducer2 = createReducer((on, off) => {
      on(TYPE, () => 1);
      on(a2, () => 2);
    }, 0);

    function reducer3(state = 0, action) {
      switch (action.type) {
      case TYPE:
        return 1;
      case a2.getType():
        return 2;
      default:
        return state;
      }
    }

    const store = createStore(combineReducers({
      one: reducer1,
      two: reducer2,
      three: reducer3,
    }));

    expect(reducer1.has(TYPE)).to.be.true;
    expect(reducer1.has(a2)).to.be.true;
    expect(reducer2.has(TYPE)).to.be.true;
    expect(reducer2.has(a2)).to.be.true;

    expect(store.getState()).to.deep.equal({ one: 0, two: 0, three: 0 });
    store.dispatch(a1());
    expect(store.getState()).to.deep.equal({ one: 1, two: 1, three: 1 });
    store.dispatch(a1());
    expect(store.getState()).to.deep.equal({ one: 1, two: 1, three: 1 });
    store.dispatch(a2());
    expect(store.getState()).to.deep.equal({ one: 2, two: 2, three: 2 });

    reducer1.off(TYPE);
    reducer2.off(TYPE);
    store.dispatch(a1());
    expect(store.getState()).to.deep.equal({ one: 2, two: 2, three: 1 });

    reducer1.on(TYPE, () => 3);
    reducer2.on(TYPE, () => 3);
    store.dispatch(a1());
    expect(store.getState()).to.deep.equal({ one: 3, two: 3, three: 1 });
  });
});
