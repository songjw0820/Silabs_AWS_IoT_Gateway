import { GET_EVENT_LIST, IS_EVENT_LOADING, EVENT_LIST_PROCEESSING } from "../actions/actionTypes";

const initialState = {
    eventList: null,
    loading: false,
    proccessing: false,
};

const groupEventReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_EVENT_LIST:
            return {
                ...state,
                eventList: action.payload,
                loading: false
            };
        case IS_EVENT_LOADING:
            return {
                ...state,
                loading: action.payload
            }
        case EVENT_LIST_PROCEESSING:
            return {
                ...state,
                proccessing: action.payload
            }
        default:
            return state;
    }
};

export default groupEventReducer;
