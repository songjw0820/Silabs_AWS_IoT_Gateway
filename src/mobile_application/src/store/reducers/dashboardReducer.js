import { GET_DASHBOARD_COUNT, GET_DASHBOARD_ALERT } from '../actions/actionTypes';


const initialState = {
    dashboardCount: {},
    dashboardAlerts: null
}
const dashboardReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_DASHBOARD_COUNT:
            return { ...state, dashboardCount: action.payload }
        case GET_DASHBOARD_ALERT:
            return { ...state, dashboardAlerts: action.payload }

        default:
            return state;
    }
};

export default dashboardReducer;