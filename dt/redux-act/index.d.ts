// Type definitions for redux-act v1.1.0
// Project: https://github.com/pauldijou/redux-act
// Definitions by: Ilya Kuznetsov <https://github.com/kuzn-ilya>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="redux" />

declare namespace ReduxAct {

    interface Action<Payload> extends Redux.Action {
        payload: Payload;
    }

    interface ActionMeta<Payload, Meta> extends Action<Payload> {
        meta?: Meta;
    }

    type PayloadReducer<Payload> = (...args: any[]) => Payload;
    type MetaReducer<Meta> = (...args: any[]) => Meta;

    interface ActionCreator<Payload, Action> {
        /**
         * An action creator is basically a function that takes arguments and return an action which has the following format:
         * * type: generated id + your description.
         * * payload: the data passed when calling the action creator. Will be the first argument of the function except if you specified a payload reducer when creating the action.
         * * meta: if you have provided a metaReducer, it will be used to create a metadata object assigned to this key. Otherwise, it's undefined.
         * 
         * ```ts
         * const addTodo = createAction('Add todo');
         * addTodo('content');
         * // return { type: '[1] Add todo', payload: 'content' }
         *
         * const editTodo = createAction('Edit todo', (id, content) => ({id, content}));
         * editTodo(42, 'the answer');
         * // return { type: '[2] Edit todo', payload: {id: 42, content: 'the answer'} }
         * 
         * const serializeTodo = createAction('SERIALIZE_TODO');
         * serializeTodo(1);
         * // return { type: 'SERIALIZE_TODO', payload: 1 }
         * ```
         */
        (...args: any[]): Action;
        
        /**
         * #### getType()
         * Return the generated type that will be used by all actions from this action creator. Useful for compatibility purposes.
         */
        getType(): string;

        /**
         * #### assignTo(store | dispatch)
         * Remember that you still need to dispatch those actions. If you already have one or more stores, you can assign the action using the assignTo function. This will mutate the action creator itself. You can pass one store or one dispatch function or an array of any of both.
         * ```ts
         * let action = createAction();
         * let action2 = createAction();
         * const reducer = createReducer({
         *     [action.toString()]: (state) => state * 2,
         *     [action2.toString()]: (state) => state / 2,
         * });
         * const store = createStore(reducer, 1);
         * const store2 = createStore(reducer, -1);
         *
         * // Automatically dispatch the action to the store when called
         * action.assignTo(store);
         * action(); // store.getState() === 2
         * action(); // store.getState() === 4
         * action(); // store.getState() === 8
         * 
         * // You can assign the action to several stores using an array
         * action.assignTo([store, store2]);
         * action();
         * // store.getState() === 16
         * // store2.getState() === -2
         * ```
         */
        assignTo(storeOrDispatch: Redux.Store<Payload> | Redux.Store<Payload>[] | Redux.Dispatch<Action> | Redux.Dispatch<Action>[] | undefined): ActionCreator<Payload, Action>;

        /**
         * #### bindTo(store | dispatch)
         * If you need immutability, you can use bindTo, it will return a new action creator which will automatically dispatch its action.
         * ```ts
         * // If you need more immutability, you can bind them, creating a new action creator
         * const boundAction = action2.bindTo(store);
         * action2(); // Not doing anything since not assigned nor bound
         * // store.getState() === 16
         * // store2.getState() === -2
         * boundAction(); // store.getState() === 8
         * ```
         */
        bindTo(storeOrDispatch: Redux.Store<Payload> | Redux.Store<Payload>[] | Redux.Dispatch<Action> | Redux.Dispatch<Action>[]): ActionCreator<Payload, Action>;

        /**
         * #### assigned()
         * Test the current status of the action creator.
         * ```ts
         * const action = createAction();
         * action.assigned(); // false, not assigned
         *
         * const boundAction = action.bindTo(store);
         * boundAction.assigned(); // false
         *
         * action.assignTo(store);
         * action.assigned(); // true
         */
        assigned(): boolean;

        /**
         * #### bound()
         * Test the current status of the action creator.
         * ```ts
         * const action = createAction();
         * action.bound(); // false, not bound
         *
         * const boundAction = action.bindTo(store);
         * boundAction.bound(); // true
         *
         * action.assignTo(store);
         * action.bound(); // false
         */
        bound(): boolean;

        /**
         * #### dispatched()
         * Test the current status of the action creator.
         * ```ts
         * const action = createAction();
         * action.dispatched(); // false, test if either assigned or bound
         *
         * const boundAction = action.bindTo(store);
         * boundAction.dispatched(); // true
         *
         * action.assignTo(store);
         * action.dispatched(); // true 
         */
        dispatched(): boolean;

        /**
         * #### raw(...args)
         * When an action creator is either assigned or bound, it will no longer only return the action object but also dispatch it. In some cases, you will need the action without dispatching it (when batching actions for example). In order to achieve that, you can use the raw method which will return the bare action. You could say that it is exactly the same as the action creator would behave it if wasn't assigned nor bound.
         * ```ts
         * const action = createAction().bindTo(store);
         * action(1); // store has been updated
         * action.raw(1); // return the action, store hasn't been updated
         */
        raw(...args: any[]): Action;
        toString(): string;
    }
    
    type StateReducer<State> = (state?: State) => State; 
    type StateAndPayloadReducer<State, Payload> = (state: State, payload: Payload) => State; 
    type StatePayloadAndMetaReducer<State, Payload, Meta> = (state: State, payload: Payload, meta: Meta) => State; 

    type ReducerMap<State> = {
        [actionType: string]: StateReducer<State> | StateAndPayloadReducer<State, any> | StatePayloadAndMetaReducer<State, any, any>;
    };

    type ReducerArray<State> = (StateReducer<State> | StateAndPayloadReducer<State, any> | StatePayloadAndMetaReducer<State, any, any>)[];

    /**
     * #### createAction([description], [payloadReducer], [metaReducer])
     * 
     * @param {description} (string, optional): used by logging and devtools when displaying the action. If this parameter is uppercase only, with underscores and numbers, it will be used as the action type without any generated id. You can use this feature to have serializable actions you can share between client and server.
     * @param {payloadReducer} (function, optional): transform multiple arguments as a unique payload.
     * @param {metaReducer} (function, optional): transform multiple arguments as a unique metadata object.
     * Returns a new action creator. If you specify a description, it will be used by devtools. By default, createAction will return a function and its first argument will be used as the payload when dispatching the action. If you need to support multiple arguments, you need to specify a payload reducer in order to merge all arguments into one unique payload.
     * ```ts
     * // Super simple action
     * const simpleAction = createAction();
     * // Better to add a description
     * const betterAction = createAction('This is better!');
     * // Support multiple arguments by merging them
     * const multipleAction = createAction((text, checked) => ({text, checked}))
     * // Again, better to add a description
     * const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
     * // Serializable action (the description will be used as the unique identifier)
     * const serializableAction = createAction('SERIALIZABLE_ACTION_42');
     * ```
     */
    export function createAction(
        actionType?: string | undefined
    ): ActionCreator<any, Action<any>>;

    /**
     * #### createAction([description], [payloadReducer], [metaReducer])
     * 
     * @param {description} (string, optional): used by logging and devtools when displaying the action. If this parameter is uppercase only, with underscores and numbers, it will be used as the action type without any generated id. You can use this feature to have serializable actions you can share between client and server.
     * @param {payloadReducer} (function, optional): transform multiple arguments as a unique payload.
     * @param {metaReducer} (function, optional): transform multiple arguments as a unique metadata object.
     * Returns a new action creator. If you specify a description, it will be used by devtools. By default, createAction will return a function and its first argument will be used as the payload when dispatching the action. If you need to support multiple arguments, you need to specify a payload reducer in order to merge all arguments into one unique payload.
     * ```ts
     * // Super simple action
     * const simpleAction = createAction();
     * // Better to add a description
     * const betterAction = createAction('This is better!');
     * // Support multiple arguments by merging them
     * const multipleAction = createAction((text, checked) => ({text, checked}))
     * // Again, better to add a description
     * const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
     * // Serializable action (the description will be used as the unique identifier)
     * const serializableAction = createAction('SERIALIZABLE_ACTION_42');
     * ```
     */
    export function createAction<Payload>(
        actionType: string | undefined,
        payloadReducer?: PayloadReducer<Payload>
    ): ActionCreator<Payload, Action<Payload>>;

    /**
     * #### createAction([description], [payloadReducer], [metaReducer])
     * 
     * @param {description} (string, optional): used by logging and devtools when displaying the action. If this parameter is uppercase only, with underscores and numbers, it will be used as the action type without any generated id. You can use this feature to have serializable actions you can share between client and server.
     * @param {payloadReducer} (function, optional): transform multiple arguments as a unique payload.
     * @param {metaReducer} (function, optional): transform multiple arguments as a unique metadata object.
     * Returns a new action creator. If you specify a description, it will be used by devtools. By default, createAction will return a function and its first argument will be used as the payload when dispatching the action. If you need to support multiple arguments, you need to specify a payload reducer in order to merge all arguments into one unique payload.
     * ```ts
     * // Super simple action
     * const simpleAction = createAction();
     * // Better to add a description
     * const betterAction = createAction('This is better!');
     * // Support multiple arguments by merging them
     * const multipleAction = createAction((text, checked) => ({text, checked}))
     * // Again, better to add a description
     * const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
     * // Serializable action (the description will be used as the unique identifier)
     * const serializableAction = createAction('SERIALIZABLE_ACTION_42');
     * ```
     */
    export function createAction<Payload, Meta>(
        actionType: string | undefined,
        payloadReducer?: PayloadReducer<Payload>,
        metaReducer?: MetaReducer<Meta>
    ): ActionCreator<Payload, ActionMeta<Payload, Meta>>;

    /**
     * #### createAction([description], [payloadReducer], [metaReducer])
     * 
     * @param {description} (string, optional): used by logging and devtools when displaying the action. If this parameter is uppercase only, with underscores and numbers, it will be used as the action type without any generated id. You can use this feature to have serializable actions you can share between client and server.
     * @param {payloadReducer} (function, optional): transform multiple arguments as a unique payload.
     * @param {metaReducer} (function, optional): transform multiple arguments as a unique metadata object.
     * Returns a new action creator. If you specify a description, it will be used by devtools. By default, createAction will return a function and its first argument will be used as the payload when dispatching the action. If you need to support multiple arguments, you need to specify a payload reducer in order to merge all arguments into one unique payload.
     * ```ts
     * // Super simple action
     * const simpleAction = createAction();
     * // Better to add a description
     * const betterAction = createAction('This is better!');
     * // Support multiple arguments by merging them
     * const multipleAction = createAction((text, checked) => ({text, checked}))
     * // Again, better to add a description
     * const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
     * // Serializable action (the description will be used as the unique identifier)
     * const serializableAction = createAction('SERIALIZABLE_ACTION_42');
     * ```
     */
    export function createAction<Payload>(
        payloadReducer: PayloadReducer<Payload>
    ): ActionCreator<Payload, Action<Payload>>;

    /**
     * #### createAction([description], [payloadReducer], [metaReducer])
     * 
     * @param {description} (string, optional): used by logging and devtools when displaying the action. If this parameter is uppercase only, with underscores and numbers, it will be used as the action type without any generated id. You can use this feature to have serializable actions you can share between client and server.
     * @param {payloadReducer} (function, optional): transform multiple arguments as a unique payload.
     * @param {metaReducer} (function, optional): transform multiple arguments as a unique metadata object.
     * Returns a new action creator. If you specify a description, it will be used by devtools. By default, createAction will return a function and its first argument will be used as the payload when dispatching the action. If you need to support multiple arguments, you need to specify a payload reducer in order to merge all arguments into one unique payload.
     * ```ts
     * // Super simple action
     * const simpleAction = createAction();
     * // Better to add a description
     * const betterAction = createAction('This is better!');
     * // Support multiple arguments by merging them
     * const multipleAction = createAction((text, checked) => ({text, checked}))
     * // Again, better to add a description
     * const bestAction = createAction('Best. Action. Ever.', (text, checked) => ({text, checked}))
     * // Serializable action (the description will be used as the unique identifier)
     * const serializableAction = createAction('SERIALIZABLE_ACTION_42');
     * ```
     */
    export function createAction<Payload, Meta>(
        payloadReducer: PayloadReducer<Payload>,
        metaReducer?: MetaReducer<Meta>
    ): ActionCreator<Payload, ActionMeta<Payload, Meta>>;

    interface ReducerOptions {
        payload: boolean;
    }

    type On<State, Payload> = (typeOrActionCreator: string | ActionCreator<Payload, Action<Payload>>, 
        reducer: StateReducer<State> | StateAndPayloadReducer<State, Payload>) => void;

    type Off<State, Payload> = (typeOrActionCreator: string | ActionCreator<Payload, Action<Payload>>) => void; 

    interface Reducer<State, Payload> {
        (state: State, action: Action<Payload>): State;
        /** 
         * #### options(object) 
         * Since an action is an object with a type, a payload (which is your actual data) and eventually some metadata, all reduce functions directly take the payload as their 2nd argument and the metadata as the 3rd by default rather than the whole action since all other properties are handled by the lib and you shouldn't care about them anyway. If you really need to use the full action, you can change the behavior of a reducer.
         * ```ts 
         * const add = createAction();
         * const sub = createAction();
         * const reducer = createReducer({
         *     [add.toString()]: (state, action) => state + action.payload,
         *     [sub.toString()]: (state, action) => state - action.payload
         * }, 0);
         *
         * reducer.options({
         *     payload: false
         * });
         * ```
         */
        options(options: ReducerOptions): void;

        /**
         * #### has(action creator)
         * Test if the reducer has a reduce function for a particular action creator or a string type.
         * ```ts
         * const add = createAction();
         * const sub = createAction();
         * const reducer = createReducer({
         *     [add.toString()]: (state, action) => state + action.payload
         * }, 0);
         * 
         * reducer.has(add); // true
         * reducer.has(sub); // false
         * reducer.has(add.getType()); // true
         * ```
         */
        has(action: ActionCreator<Payload, Action<Payload>> | string): boolean;

        /**
         * #### on(action creator, reduce function) / off(action creator)
         * You can dynamically add and remove actions. You can use either a redux-act action creator or a raw string type.
         */
        on: On<State, Payload>;

        /**
         * #### on(action creator, reduce function) / off(action creator)
         * You can dynamically add and remove actions. You can use either a redux-act action creator or a raw string type.
         */
        off: Off<State, Payload>;
    }

    /**
     * #### createReducer(handlers, [defaultState])
     * @param {handlers} (object or function): if object, a map of action to the reduce function. If function, take two attributes: a function to register actions and another one to unregister them. See below.
     * @param {defaultState} (anything, optional): the initial state of the reducer. Must not be empty if you plan to use this reducer inside a combineReducers.
     * Returns a new reducer. It's kind of the same syntax as the Array.prototype.reduce function. You can specify how to reduce as the first argument and the accumulator, or default state, as the second one. The default state is optional since you can retrieve it from the store when creating it but you should consider always having a default state inside a reducer, especially if you want to use it with combineReducers which make such default state mandatory.
     * 
     * There are two patterns to create a reducer. One is passing an object as a map of action creators to reduce functions. Such functions have the following signature: (previousState, payload) => newState. The other one is using a function factory. Rather than trying to explaining it, just read the following examples.
     * ```ts
     * const increment = createAction();
     * const add = createAction();
     * 
     * // First pattern
     * const reducerMap = createReducer({
     *     [increment.toString()]: (state) => state + 1,
     *     [add.toString()]: (state, payload) => state + payload
     * }, 0);
     *
     * // Second pattern
     * const reducerFactory = createReducer(function (on, off) {
     *     on(increment, (state) => state + 1);
     *     on(add, (state, payload) => state + payload);
     *     // 'off' remove support for a specific action
     *     // See 'Adding and removing actions' section
     * }, 0);
     * ```
     */
    export function createReducer<State>(
        handlers?: ReducerMap<State>,
        defaultState?: State
    ): Reducer<State, any>;

    /**
     * #### createReducer(handlers, [defaultState])
     * @param {handlers} (object or function): if object, a map of action to the reduce function. If function, take two attributes: a function to register actions and another one to unregister them. See below.
     * @param {defaultState} (anything, optional): the initial state of the reducer. Must not be empty if you plan to use this reducer inside a combineReducers.
     * Returns a new reducer. It's kind of the same syntax as the Array.prototype.reduce function. You can specify how to reduce as the first argument and the accumulator, or default state, as the second one. The default state is optional since you can retrieve it from the store when creating it but you should consider always having a default state inside a reducer, especially if you want to use it with combineReducers which make such default state mandatory.
     * 
     * There are two patterns to create a reducer. One is passing an object as a map of action creators to reduce functions. Such functions have the following signature: (previousState, payload) => newState. The other one is using a function factory. Rather than trying to explaining it, just read the following examples.
     * ```ts
     * const increment = createAction();
     * const add = createAction();
     * 
     * // First pattern
     * const reducerMap = createReducer({
     *     [increment.toString()]: (state) => state + 1,
     *     [add.toString()]: (state, payload) => state + payload
     * }, 0);
     *
     * // Second pattern
     * const reducerFactory = createReducer(function (on, off) {
     *     on(increment, (state) => state + 1);
     *     on(add, (state, payload) => state + payload);
     *     // 'off' remove support for a specific action
     *     // See 'Adding and removing actions' section
     * }, 0);
     * ```
     */
    export function createReducer<State, Payload>(
        handlers: (on: On<State, Payload>, off: Off<State, Payload>) => void,
        defaultState?: State
    ): Reducer<State, Payload>;

    /**
     * #### batch(actions)
     * @param actions (objects | array): wrap an array of actions inside another action and will reduce them all at once when dispatching it. You can also call this function with several actions as arguments.
     * Warning. Does not work with assigned and bound actions by default since those will be dispatched immediately when called. You will need to use the raw method for such actions. See usage below.
     * Useful when you need to run a sequence of actions without impacting your whole application after each one but rather after all of them are done. For example, if you are using @connect from react-redux, it is called after each action by default. Using batch, it will be called only when all actions in the array have been reduced.
     * ```batch``` is an action creator like any other created using createAction. You can assign or bind it if you want, especially if you only have one store. You can even use it inside reducers. It is enabled by default, but you can remove it and put it back.
     * ```ts
     * import { createAction, createReducer, batch } from 'redux-act';
     *
     * // Basic actions
     * const inc = createAction();
     * const dec = createAction();
     *
     * const reducer = createReducer({
     *     [inc.toString()]: state => state + 1,
     *     [dec.toString()]: state => state - 1,
     * }, 0);
     *
     * const store = createStore(reducer);
     * // actions as arguments
     * store.dispatch(batch(inc(), inc(), dec(), inc()));
     * // actions as an array
     * store.dispatch(batch([inc(), inc(), dec(), inc()]));
     * store.getState(); // 4
     *
     * // Assigned actions
     * inc.assignTo(store);
     * dec.assignTo(store);
     *
     * // You still need to dispatch the batch action
     * // You will need to use the 'raw' function on the action creators to prevent
     * // the auto-dipatch from the assigned action creators
     * store.dispatch(batch(inc.raw(), dec.raw(), dec.raw()));
     * store.dispatch(batch([inc.raw(), dec.raw(), dec.raw()]));
     * store.getState(); // 2
     *
     * // Let's de-assign our actions
     * inc.assignTo(undefined);
     * dec.assignTo(undefined);
     *
     * // You can bind batch
     * const boundBatch = batch.bindTo(store);
     * boundBatch(inc(), inc());
     * store.getState(); // 4
     *
     * // You can assign batch
     * batch.assignTo(store);
     * batch(dec(), dec(), dec());
     * store.getState(); // 1
     *
     * // You can remove batch from a reducer
     * reducer.off(batch);
     * batch(dec(), dec());
     * store.getState(); // 1
     *
     * // You can put it back
     * reducer.on(batch, (state, payload) => payload.reduce(reducer, state));
     * batch(dec(), dec());
     * store.getState(); // -1
     * ```
     */
    export const batch: ActionCreator<Action<any>[], Action<any>>;

    /**
     * #### assignAll(actionCreators, stores)
     * @param {actionCreators} (object or array): which action creators to assign. If it's an object, it's a map of name -> action creator, useful when importing several actions at once.
     * @param {stores} (object or array): the target store(s) when dispatching actions. Can be only one or several inside an array.
     * A common pattern is to export a set of action creators as an object. If you want to bind all of them to a store, there is this super small helper. You can also use an array of action creators. And since you can bind to one or several stores, you can specify either one store or an array of stores.
     * ```ts
     * // actions.js
     * export const add = createAction('Add');
     * export const sub = createAction('Sub');
     *
     * // reducer.js
     * import * as actions from './actions';
     * export default createReducer({
     *     [actions.add.toString()]: (state, payload) => state + payload,
     *     [actions.sub.toString()]: (state, payload) => state - payload
     * }, 0);
     *
     * // store.js
     * import * as actions from './actions';
     * import reducer from './reducer';
     *
     * const store = createStore(reducer);
     * assignAll(actions, store);
     *
     * export default store;
     * ```
     */
    export function assignAll(actionCreators: ActionCreator<any, Action<any>>[] | ActionCreator<any, Action<any>> | { [key: string]: ActionCreator<any, Action<any>> },
        stores: Redux.Store<any>[] | Redux.Store<any>): void;

    /**
     * #### bindAll(actionCreators, stores)
     * @param actionCreators (object or array): which action creators to bind. If it's an object, it's a map of name -> action creator, useful when importing several actions at once.
     * @param stores (object or array): the target store(s) when dispatching actions. Can be only one or several inside an array.
     * Just like assignAll, you can bind several action creators at once.
     * ```ts
     * import { bindAll } from 'redux-act';
     * import store from './store';
     * import * as actions from './actions';
     *
     * export bindAll(actions, store);
     * ```
     */
    export function bindAll(actionCreators: { [key: string]: ActionCreator<any, Action<any>> },
        stores: Redux.Store<any>[] | Redux.Store<any>): ReducerMap<any>;

    /**
     * #### bindAll(actionCreators, stores)
     * @param actionCreators (object or array): which action creators to bind. If it's an object, it's a map of name -> action creator, useful when importing several actions at once.
     * @param stores (object or array): the target store(s) when dispatching actions. Can be only one or several inside an array.
     * Just like assignAll, you can bind several action creators at once.
     * ```ts
     * import { bindAll } from 'redux-act';
     * import store from './store';
     * import * as actions from './actions';
     *
     * export bindAll(actions, store);
     * ```
     */
    export function bindAll(actionCreators: ActionCreator<any, Action<any>>[],
        stores: Redux.Store<any>[] | Redux.Store<any>): ReducerArray<any>;

    /**
     * #### disbatch(store | dispatch, [actions])
     * @param {store | dispatch} (object, which is a Redux store, or a dispatch function): add a disbatch function to the store if it is the only parameter. Just like dispatch but for several actions which will be batched as a single one.
     * @param {actions} (array, optional): the array of actions to dispatch as a batch of actions.
     * ```ts
     * // All samples will display both syntax with and without an array
     * // They are exactly the same
     * import { disbatch } from 'redux-act';
     * import { inc, dec } from './actions';
     *
     * // Add 'disbatch' directly to the store
     * let disbatchedStore = disbatch(store);
     * disbatchedStore.disbatch(inc(), dec(), inc());
     * disbatchedStore.disbatch([inc(), dec(), inc()]);
     *
     * // Disbatch immediately from store
     * disbatch(store, inc(), dec(), inc());
     * disbatch(store, [inc(), dec(), inc()]);
     *
     * // Disbatch immediately from dispatch
     * disbatch(store.dispatch, inc(), dec(), inc());
     * disbatch(store.dispatch, [inc(), dec(), inc()]);
     * ```
     */
    export function disbatch(store: Redux.Store<any>, action: Action<any>, ...actions: Action<any>[]): Redux.Store<any>;

    /**
     * #### disbatch(store | dispatch, [actions])
     * @param {store | dispatch} (object, which is a Redux store, or a dispatch function): add a disbatch function to the store if it is the only parameter. Just like dispatch but for several actions which will be batched as a single one.
     * @param {actions} (array, optional): the array of actions to dispatch as a batch of actions.
     * ```ts
     * // All samples will display both syntax with and without an array
     * // They are exactly the same
     * import { disbatch } from 'redux-act';
     * import { inc, dec } from './actions';
     *
     * // Add 'disbatch' directly to the store
     * let disbatchedStore = disbatch(store);
     * disbatchedStore.disbatch(inc(), dec(), inc());
     * disbatchedStore.disbatch([inc(), dec(), inc()]);
     *
     * // Disbatch immediately from store
     * disbatch(store, inc(), dec(), inc());
     * disbatch(store, [inc(), dec(), inc()]);
     *
     * // Disbatch immediately from dispatch
     * disbatch(store.dispatch, inc(), dec(), inc());
     * disbatch(store.dispatch, [inc(), dec(), inc()]);
     * ```
     */
    export function disbatch(dispatch: Redux.Dispatch<any>, ...actions: Action<any>[]): Redux.Store<any>;

    /**
     * #### disbatch(store | dispatch, [actions])
     * @param {store | dispatch} (object, which is a Redux store, or a dispatch function): add a disbatch function to the store if it is the only parameter. Just like dispatch but for several actions which will be batched as a single one.
     * @param {actions} (array, optional): the array of actions to dispatch as a batch of actions.
     * ```ts
     * // All samples will display both syntax with and without an array
     * // They are exactly the same
     * import { disbatch } from 'redux-act';
     * import { inc, dec } from './actions';
     *
     * // Add 'disbatch' directly to the store
     * let disbatchedStore = disbatch(store);
     * disbatchedStore.disbatch(inc(), dec(), inc());
     * disbatchedStore.disbatch([inc(), dec(), inc()]);
     *
     * // Disbatch immediately from store
     * disbatch(store, inc(), dec(), inc());
     * disbatch(store, [inc(), dec(), inc()]);
     *
     * // Disbatch immediately from dispatch
     * disbatch(store.dispatch, inc(), dec(), inc());
     * disbatch(store.dispatch, [inc(), dec(), inc()]);
     * ```
     */
    export function disbatch(store: Redux.Store<any>, actions: Action<any>[]): Redux.Store<any>;

    /**
     * #### disbatch(store | dispatch, [actions])
     * @param {store | dispatch} (object, which is a Redux store, or a dispatch function): add a disbatch function to the store if it is the only parameter. Just like dispatch but for several actions which will be batched as a single one.
     * @param {actions} (array, optional): the array of actions to dispatch as a batch of actions.
     * ```ts
     * // All samples will display both syntax with and without an array
     * // They are exactly the same
     * import { disbatch } from 'redux-act';
     * import { inc, dec } from './actions';
     *
     * // Add 'disbatch' directly to the store
     * let disbatchedStore = disbatch(store);
     * disbatchedStore.disbatch(inc(), dec(), inc());
     * disbatchedStore.disbatch([inc(), dec(), inc()]);
     *
     * // Disbatch immediately from store
     * disbatch(store, inc(), dec(), inc());
     * disbatch(store, [inc(), dec(), inc()]);
     *
     * // Disbatch immediately from dispatch
     * disbatch(store.dispatch, inc(), dec(), inc());
     * disbatch(store.dispatch, [inc(), dec(), inc()]);
     * ```
     */
    export function disbatch(dispatch: Redux.Dispatch<any>, actions: Action<any>[]): Redux.Store<any>;

    
    interface DisbatchedStore<S> extends Redux.Store<S> {
        disbatch(...actions: Action<any>[]): Redux.Store<S>;
    } 

    /**
     * #### disbatch(store | dispatch, [actions])
     * @param {store | dispatch} (object, which is a Redux store, or a dispatch function): add a disbatch function to the store if it is the only parameter. Just like dispatch but for several actions which will be batched as a single one.
     * @param {actions} (array, optional): the array of actions to dispatch as a batch of actions.
     * ```ts
     * // All samples will display both syntax with and without an array
     * // They are exactly the same
     * import { disbatch } from 'redux-act';
     * import { inc, dec } from './actions';
     *
     * // Add 'disbatch' directly to the store
     * let disbatchedStore = disbatch(store);
     * disbatchedStore.disbatch(inc(), dec(), inc());
     * disbatchedStore.disbatch([inc(), dec(), inc()]);
     *
     * // Disbatch immediately from store
     * disbatch(store, inc(), dec(), inc());
     * disbatch(store, [inc(), dec(), inc()]);
     *
     * // Disbatch immediately from dispatch
     * disbatch(store.dispatch, inc(), dec(), inc());
     * disbatch(store.dispatch, [inc(), dec(), inc()]);
     * ```
     */
    export function disbatch(store: Redux.Store<any>): DisbatchedStore<any>;

    interface Types {
        add(name: string): void;
        remove(name: string): void;
        has(name: string): boolean;
        all(): string[];
        clear(): void;
    }
    
    /**
     * #### types
     * *This is mostly internal stuff and is exposed only to help during testing.*
     * As you know it, each action has a type. redux-act will ensure that each action creator type is unique. If you are not using serializable actions, you are good to go as all types will be dynamically generated and unique. But if you do use them, by default, nothing prevent you from creating two action creators with the same type. redux-act will throw if you call createAction with an already used type, and that is good, except when running tests.
     * During testing, you might need to reset all types, start as fresh, to prevent redux-act to throw between tests. To do so, you have a small API to manage types stored by redux-act.
     * ```ts
     * import { types } from 'redux-act';
     * 
     * // Add a type and prevent any action creator from using it from now on
     * types.add('MY_TYPE');
     * types.add('MY_TYPE_BIS');
     *
     * // Remove a type, you can use it again in an action creator
     * types.remove('MY_TYPE_BIS');
     * 
     * // Test if a type is already used
     * types.has('MY_TYPE'); // true
     * types.has('MY_TYPE_BIS'); // false
     *
     * // Return all used types
     * types.all(); // [ 'MY_TYPE' ]
     * 
     * // Remove all types
     * types.clear();
     * ```
     */
    export const types: ReduxAct.Types;
}

declare module 'redux-act' {
    export = ReduxAct;
}