import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from "redux-thunk";
import rootReducer from './reducers/rootReducer';
import authReducer from './reducers/authReducer';
import uiReducer from './reducers/uiReducer';
import bleReducer from './reducers/bleReducer';
import deviceReducer from './reducers/deviceReducer';
import gatewayReducer from './reducers/GrowareaReducer';
import dashboardReducer from './reducers/dashboardReducer';
import LEDGroupReducer from './reducers/LEDGropsReducer';
import LEDGroupProfileReducer from './reducers/LEDGroupProfileReducer';
import EventReducer from './reducers/groupEventReducer';

const appReducer = combineReducers({
    root: rootReducer,
    ui: uiReducer,
    auth: authReducer,
    ble: bleReducer,
    device: deviceReducer,
    gateway: gatewayReducer,
    dashboard: dashboardReducer,
    LEDGroup: LEDGroupReducer,
    LEDGroupProfile: LEDGroupProfileReducer,
    EventReducer
});

const mainReducer = (state, action) => {
    return appReducer(state, action)
}

let composeEnhancers = compose;

if (__DEV__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
}

const configureStore = () => {
    return createStore(mainReducer, composeEnhancers(applyMiddleware(thunk)));
};

export default configureStore;