import React, { Component } from 'react';
import {
    RefreshControl, StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, ScrollView, AsyncStorage, Alert, Platform
} from 'react-native';
import * as Constant from '../Constant';
import { connect } from 'react-redux';
import { getFacilities, authSetUser, authLogout, } from '../store/actions/rootActions';
import { debug } from './../../app.json';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from 'react-native-google-signin';
import { Navigation } from 'react-native-navigation';


class Facilities extends Component {

    static get options() {
        return Constant.DEFAULT_NAVIGATOR_STYLE
    }
    visible = false;

    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            refreshing: false
        };
        GoogleSignin.configure({
            forceConsentPrompt: true
        })
    }

    componentDidAppear() {
        this.visible = true;
        this._onRefresh();
        this.forceUpdate();
        if (this.props.facilities.length === 0) {
            this.refreshSession();
            this._onRefresh();
        }
    }


    refreshSession = () => {
        console.log("Refresh Session called");
        GoogleSignin.signInSilently().then((userInfo) => {
            console.log("   ng user")
            return Promise.resolve(this.props.onSetUser(userInfo))
        }).then(() => {
            console.log("Calling onRefresh");
            this._onRefresh();
        }).catch(error => {
            console.log("Error:" + error + "\nErrorCode:" + error.code);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log("SIGN_IN_CANCELLED") // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log("IN_PROGRESS")  // operation (f.e. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.log("PLAY_SERVICES_NOT_AVAILABLE")  // play services not available or outdated
                alert("Play services not available in your device.");
            } else {

                if (this.errorCode === 1) {
                    console.log("OTHER_REASON");
                } else {
                    this.errorCode = 1;
                    console.log("OTHER_REASON");

                }
            }
        });
    }



    _onRefresh = () => {
        console.log("OnRefresh called");
        this.setState({ refreshing: true, searching: false, filterKey: '' });
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]
            Promise.resolve(this.props.onGetFacilities(false, token, appleKey)).then(() => {
                this.setState({ refreshing: false, appleLoggedIn: true });
            });
        }).catch((e) => {
            console.log('error in _onRefrresh in Facility', e.message);

        })
    }

    logOut = () => {
        Promise.resolve(this.props.onLogout()).then(() => {
        });
        Navigation.startSingleScreenApp({
            screen: {
                screen: "LoginScreen",
                title: "Login"
            },
            appStyle: {
                orientation: 'portrait'
            }
        });


    };

    onListItemClickHandler = facility => {
        Navigation.push(this.props.componentId, {
            component: {
                name: 'ContainersScreen',
                passProps: {
                    selectedFacility: {
                        id: facility.id,
                        name: facility.facility_name,
                    }
                },
                options: {
                    topBar: {
                        title: {
                            text: facility.facility_name
                        }
                    },

                }
            }
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (this.visible);
    }

    getListData() {
        let data = this.props.facilities;
        if (this.state.filterKey) {
            const newData = data.filter(item => {
                const itemData = `${item.facility_name.toUpperCase()}`;
                return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1;
            });
            return newData;
        }
        return data;
    }

    onClearSearch = () => {
        this.setState({
            searching: false,
            filterKey: ''
        })
    }



    render() {
        console.log("Rendering facilities");
        let listData = this.getListData() || [];

        let facilitiesList = (
            <FlatList
                data={listData}
                renderItem={(info) => (
                    <TouchableOpacity onPress={() => this.onListItemClickHandler(info.item)}>
                        <View style={(info.index === listData.length - 1) ? [styles.listItem, {
                            borderBottomWidth: 2
                        }] : styles.listItem}>
                            <Text>{debug ? info.item.id + '-' : ''}{info.item.facility_name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this._onRefresh}
                        colors={['red', 'green', 'blue']}
                    />
                }
            />
        );

        if (this.props.isLoading) {
            facilitiesList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color="#acd373" /></View>;
        } else if (listData.length === 0) {
            facilitiesList = (
                <ScrollView contentContainerStyle={styles.activityIndicator}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh}
                            colors={['red', 'green', 'blue']}
                        />
                    }>
                    <Text color="#00ff00">No facilities found.</Text>
                </ScrollView>
            );
        }

        return (
            <View style={styles.container}>
                <View style={styles.greenBackgroundContainer} />
                <View style={styles.listContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.listTitle, { flex: 1 }]}> Facilities</Text>
                        {!this.state.searching && listData.length > 0 &&
                            <Icon name="search" size={24} style={{ padding: 10 }} onPress={() => {
                                this.setState({
                                    searching: true
                                });
                                var myInterval = setInterval(() => {
                                    if (this.search) {
                                        this.search.focus();
                                        clearInterval(myInterval);
                                    }
                                }, 100);
                            }} />
                        }
                    </View>
                    {this.state.searching &&
                        <SearchBar
                            ref={search => this.search = search}
                            lightTheme
                            value={this.state.filterKey}
                            onChangeText={(filterKey) => this.setState({ filterKey })}
                            onClear={() => this.onClearSearch()}
                            placeholder='Search facility...'
                            containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2 }}
                            inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}
                            inputStyle={{ fontSize: 16 }} />
                    }
                    {facilitiesList}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Constant.LIGHT_GREY_COLOR
    },
    greenBackgroundContainer: {
        backgroundColor: Constant.PRIMARY_COLOR,
        width: '100%',
        height: '25%',
        position: 'absolute'
    },
    listContainer: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
        marginLeft: '5%',
        marginRight: '5%',
        borderRadius: 5
    },
    listTitle: {
        padding: 10,
        fontWeight: 'bold',
        borderBottomColor: Constant.LIGHT_GREY_COLOR
    },
    listItem: {
        width: "100%",
        borderTopWidth: 2,
        borderColor: Constant.LIGHT_GREY_COLOR,
        padding: 10,
        flexDirection: "row",
        alignItems: "center"
    },
    activityIndicator: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

mapStatesToProps = state => {
    return {
        facilities: state.root.facilities,
        isLoading: state.ui.isLoading
    }
};

mapDispatchToProps = dispatch => {
    return {
        onGetFacilities: (inBackground, token, appleKey) => dispatch(getFacilities(inBackground, token, appleKey)),
        onSetUser: (user) => dispatch(authSetUser(user)),
        onLogout: () => dispatch(authLogout()),
    }
};

export default connect(mapStatesToProps, mapDispatchToProps)(Facilities);
