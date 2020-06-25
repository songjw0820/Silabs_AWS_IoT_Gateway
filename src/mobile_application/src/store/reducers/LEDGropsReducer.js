import {
    GET_LEDNODE_GROUP_LIST, GROUPE_LIST_PROCEESSING,
    FIND_DEVICES_LOADER, IS_LED_GROUP_LIST_LOADING,
    FIND_LEDNODE_FOR_GROUP, IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, GET_GROUP_DETAILS
} from "../actions/actionTypes";

const initialState = {
    LEDGroupList: null,
    isScreenLoading: false,
    LEDDeviceList: [],
    findDevicesLoader: false,
    proccessing: false,
    individualGroupLoading: false,
    groupDetails: {}
};

const LEDGroupReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_LEDNODE_GROUP_LIST:
            return {
                ...state,
                LEDGroupList: action.payload,
                isScreenLoading: false
            };
        case IS_LED_GROUP_LIST_LOADING:
            return {
                ...state,
                isScreenLoading: action.payload
            }
        case FIND_LEDNODE_FOR_GROUP:
            return {
                ...state,
                LEDDeviceList: action.payload,
                findDevicesLoader: false
            }
        case FIND_DEVICES_LOADER:
            return {
                ...state,
                findDevicesLoader: action.payload
            }
        case GROUPE_LIST_PROCEESSING:
            return {
                ...state,
                proccessing: action.payload
            }
        case IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING:
            return {
                ...state,
                individualGroupLoading: action.payload
            }
        case GET_GROUP_DETAILS:
            return {
                ...state,
                groupDetails: action.payload
            }
        default:
            return state;
    }
};

export default LEDGroupReducer;