import { GET_EVENT_LIST, IS_EVENT_LOADING, EVENT_LIST_PROCEESSING } from "./actionTypes";
import { uiStartLoading, uiStopLoading, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { apiDebug } from '../../../app.json';
import { AsyncStorage } from 'react-native';
import * as Urls from '../../Urls';

export const getEventList = (token, id) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            dispatch(isEventLoading(true));
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            let url = Urls.GET_INDIVIDUAL_GROUP + `/${id}/event`;
            console.log('url:------------------->', url);
            fetch(url,
                {
                    method: "GET",
                    headers
                })
                .catch((error) => {
                    throw new Error("Network error!");
                })
                .then(res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while fetching LED Groups.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log('parsedRes', JSON.stringify(parsedRes));
                    dispatch({ type: GET_EVENT_LIST, payload: parsedRes });
                    dispatch(sessionEstablished())
                })
                .catch(error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isEventLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getEventList(token, id));
                                })
                            }  
                        }
                    } else {
                        dispatch(isEventLoading(false));
                        console.log('error in gateway deletion', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                });
        }).catch((e) => {
            console.log('errror', e);

        })
    }
}

export const stopEventProccessing = (flag) => {
    return {
        type: EVENT_LIST_PROCEESSING,
        payload: flag
    }
}

export const isEventLoading = (flag) => {
    console.log('flag-------->', flag);
    return {
        type: IS_EVENT_LOADING,
        payload: flag
    }
}

export const deleteEvent = (token, jobName) => {
    return dispatch => {
        let url = Urls.DELETE_EVENT + `/${jobName}`;
        console.log('url for ------>', url);
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            dispatch(isEventLoading(true));
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            fetch(url,
                {
                    method: "DELETE",
                    headers
                })
                .catch((error) => {
                    throw new Error("Network error!");
                })
                .then(res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while Deleting Events.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopEventProccessing(true));
                    dispatch(isEventLoading(false));
                    dispatch(sessionEstablished())
                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isEventLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(deleteEvent(token, jobName));
                                })
                            }  
                        }
                    } else {
                        dispatch(isEventLoading(false));
                        console.log('error in deleting events', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                })
        }).catch((e) => {
            console.log('error', e);
        })
    }
}