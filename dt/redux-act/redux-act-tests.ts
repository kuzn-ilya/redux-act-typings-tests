import { createStore } from 'redux';
import { createAction, createReducer, Action } from 'redux-act';

// Create an action creator (description is optional)
const add = createAction<number>('add some stuff');
const increment = createAction<number>('increment the state');
const decrement = createAction<number>('decrement the state');

// Create a reducer
// (ES6 syntax, see Advanced usage below for an alternative for ES5)
const counterReducer = createReducer({
  [increment.toString()]: (state: number) => state + 1,
  [decrement.toString()]: (state: number) => state - 1,
  [add.toString()]: (state: number, payload: number) => state + payload,
}, 0); // <-- This is the default state

// Create the store
const counterStore = createStore(counterReducer);

// Dispatch actions
counterStore.dispatch(increment()); // counterStore.getState() === 1
counterStore.dispatch(increment()); // counterStore.getState() === 2
counterStore.dispatch(decrement()); // counterStore.getState() === 1
counterStore.dispatch(add(5)); // counterStore.getState() === 6


// You can create several action creators at once
// (but that's probably not the best way to do it)
const [increment2, decrement2] = ['inc', 'dec'].map(createAction);

// When creating action creators, the description is optional
// it will only be used for devtools and logging stuff.
// It's better to put something but feel free to leave it empty if you want to.
const replace = createAction();

// By default, the payload of the action is the first argument
// when you call the action. If you need to support several arguments,
// you can specify a function on how to merge all arguments into
// an unique payload.
let append = createAction('optional description', (...args) => args.join(''));


// There is another pattern to create reducers
// and it works fine with ES5! (maybe even ES3 \o/)

const stringReducer = createReducer<string, string>(
    (on) => {
        on(replace, (state: string, payload: string) => payload);
        on(append, (state: string, payload: string) => state += payload);
        // Warning! If you use the same action twice,
        // the second one will override the previous one.
    }, 'missing a lette'); // <-- Default state

// Rather than binding the action creators each time you want to use them,
// you can do it once and for all as soon as you have the targeted store
// assignTo: mutates the action creator itself
// bindTo: returns a new action creator assigned to the store
const stringStore = createStore(stringReducer);
replace.assignTo(stringStore);
append = append.bindTo(stringStore);

// Now, when calling actions, they will be automatically dispatched
append('r'); // stringStore.getState() === 'missing a letter'
replace('a'); // stringStore.getState() === 'a'
append('b', 'c', 'd'); // stringStore.getState() === 'abcd'

// If you really need serializable actions, using string constant rather
// than runtime generated id, just use a uppercase description (with eventually some underscores)
// and it will be use as the id of the action
const doSomething = createAction('STRING_CONSTANT');
doSomething(1); // { type: 'STRING_CONSTANT', payload: 1}

// Little bonus, if you need to support metadata around your action,
// like needed data but not really part of the payload, you add a second function
const metaAction = createAction('desc', arg => arg, arg => ({meta: 'so meta!'}));

// Metadata will be the third argument of the reduce function
createReducer({
  [metaAction.toString()]: (state: number, payload: number, meta: string) => payload
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

// Super simple action
const simpleAction = createAction();
// Better to add a description
const betterAction = createAction('This is better!');
// Support multiple arguments by merging them
const multipleAction = createAction((text, checked) => ({text, checked}))
// Again, better to add a description
const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
// Serializable action (the description will be used as the unique identifier)
const serializableAction = createAction('SERIALIZABLE_ACTION_42');



const addTodo = createAction('Add todo');
addTodo('content');
// return { type: '[1] Add todo', payload: 'content' }

const editTodo = createAction('Edit todo', (id, content) => ({id, content}));
editTodo(42, 'the answer');
// return { type: '[2] Edit todo', payload: {id: 42, content: 'the answer'} }

const serializeTodo = createAction('SERIALIZE_TODO');
serializeTodo(1);
// return { type: 'SERIALIZE_TODO', payload: 1 }

let action1 = createAction();
let action2 = createAction();
const reducer = createReducer({
  [action1.toString()]: (state: number) => state * 2,
  [action2.toString()]: (state: number) => state / 2,
});
const store = createStore(reducer, 1);
const store2 = createStore(reducer, -1);

// Automatically dispatch the action to the store when called
action1.assignTo(store);
action1(); // store.getState() === 2
action1(); // store.getState() === 4
action1(); // store.getState() === 8

// You can assign the action to several stores using an array
action1.assignTo([store, store2]);
action1();
// store.getState() === 16
// store2.getState() === -2

// If you need more immutability, you can bind them, creating a new action creator
const boundAction2 = action2.bindTo(store);
action2(); // Not doing anything since not assigned nor bound
// store.getState() === 16
// store2.getState() === -2
boundAction2(); // store.getState() === 8


const action3 = createAction();
action3.assigned(); // false, not assigned
action3.bound(); // false, not bound
action3.dispatched(); // false, test if either assigned or bound

const boundAction3 = action3.bindTo(store);
boundAction3.assigned(); // false
boundAction3.bound(); // true
boundAction3.dispatched(); // true

action3.assignTo(store);
action3.assigned(); // true
action3.bound(); // false
action3.dispatched(); // true


const action4 = createAction().bindTo(store);
action4(1); // store has been updated
action4.raw(1); // return the action, store hasn't been updated


//////////////////////////////////////////////////////////////////////////////////////////////
const increment1 = createAction();
const add1 = createAction();

// First pattern
const reducerMap = createReducer({
  [increment1.toString()]: (state: number) => state + 1,
  [add1.toString()]: (state: number, payload: number) => state + payload
}, 0);

// Second pattern
const reducerFactory = createReducer((on, off) => {
  on(increment, (state: number) => state + 1);
  on(add, (state: number, payload: number) => state + payload);
  // 'off' remove support for a specific action
  // See 'Adding and removing actions' section
}, 0);

const add2 = createAction();
const sub2 = createAction();
const reducer2 = createReducer({
  [add2.toString()]: (state: number, action: Action<number>) => state + action.payload,
  [sub2.toString()]: (state: number, action: Action<number>) => state - action.payload
}, 0);

reducer2.options({
  payload: false
});

reducer2.has(add2); // true
reducer2.has(sub2); // false
reducer2.has(add2.getType()); // true
