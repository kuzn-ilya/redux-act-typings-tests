import * as chai from 'chai';
import {createStore} from 'redux';
import {disbatch, createAction, createReducer} from 'redux-act';
const expect = chai.expect;

describe('disbatch', function () {
  function init() {
    const inc = createAction();
    const dec = createAction();
    const reducer = createReducer({
      [inc.toString()]: (state)=> state + 1,
      [dec.toString()]: (state)=> state - 1
    }, 0);
    const store = createStore(reducer);
    const store2 = createStore(reducer);
    return { inc, dec, reducer, store, store2 };
  }

  it('should disbatch directly', function () {
    const { inc, dec, reducer, store, store2 } = init();
    disbatch(store, inc(), inc(), inc());
    expect(store.getState()).to.equal(3);
    disbatch(store.dispatch, dec(), dec(), inc());
    expect(store.getState()).to.equal(2);
  });

  it('should disbatch directly an array of actions', function () {
    const { inc, dec, reducer, store, store2 } = init();
    disbatch(store, [inc(), inc(), inc()]);
    expect(store.getState()).to.equal(3);
    disbatch(store.dispatch, [dec(), dec(), inc()]);
    expect(store.getState()).to.equal(2);
  });

  it('should augment a store', function () {
    const { inc, dec, reducer, store, store2 } = init();
    let disbatchedStore = disbatch(store);
    expect(disbatchedStore.disbatch).to.be.a('function');
    disbatchedStore.disbatch(inc(), inc(), inc());
    expect(store.getState()).to.equal(3);
    disbatchedStore.disbatch(dec(), dec(), inc());
    expect(store.getState()).to.equal(2);
  });

//   it('should throw without valid arguments', function () {
//     function fail1() { return disbatch(false, []); }
//     function fail2() { return disbatch(false); }
//     expect(fail1).to.throw(TypeError);
//     expect(fail2).to.throw(TypeError);
//   });
});