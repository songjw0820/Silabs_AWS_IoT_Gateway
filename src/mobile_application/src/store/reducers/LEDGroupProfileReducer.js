import {
    PROFILE_LIST_PROCEESSING, GET_LEDNODE_GROUP_PROFILE_LIST,
    IS_LED_GROUP_PROFILE_LIST_LOADING, GET_GROUP_PROFILE_DETAILS, IS_GROUP_PROFILE_DETAILS_LOADING
} from "../actions/actionTypes";

const initialState = {
    LEDGroupProfileList: null,
    loading: false,
    proccessing: false,
    profileDetails: {},
    profileDetailsLoader: false
};

const LEDGroupProfileReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_LEDNODE_GROUP_PROFILE_LIST:
            return {
                ...state,
                LEDGroupProfileList: action.payload,
                loading: false
            };
        case IS_LED_GROUP_PROFILE_LIST_LOADING:
            return {
                ...state,
                loading: action.payload
            }
        case PROFILE_LIST_PROCEESSING:
            return {
                ...state,
                proccessing: action.payload
            }
        case GET_GROUP_PROFILE_DETAILS:
            return {
                ...state,
                profileDetails: action.payload,
                profileDetailsLoader: false
            }
        case IS_GROUP_PROFILE_DETAILS_LOADING:
            return {
                ...state,
                profileDetailsLoader: action.payload
            }
        default:
            return state;
    }
};

export default LEDGroupProfileReducer;