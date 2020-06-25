import React, { Component } from "react";
import {
    View, Text, Dimensions, StyleSheet, TouchableOpacity, Platform,
    Image, ImageBackground, ActivityIndicator, Modal, AsyncStorage
} from "react-native";
import * as Constant from '../Constant';
import Icon from "react-native-vector-icons/Ionicons";
import { connect } from "react-redux";
import { Navigation } from 'react-native-navigation';
import { authSetUser, authLogout } from "../store/actions/rootActions";
import App from "../../App";

class SideDrawer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            imageUrl: '',
            email: '',
            name: '',
            signOutLoading: false,
            isDashboardClicked: false,
            isFacilitiesClicked: false,
            isContainersClicked: false,
            isGrowAreaClicked: false,
            isGrowSecionsClicked: false,
            isDevicesClicked: false
        }
    }

    logOut = async () => {
        Navigation.setRoot({
            root: {
                component: {
                    name: 'LoginScreen'
                },
            }
        });
        await this.props.onLogout();
        this.setState({
            signOutLoading: true,
            imageUrl: '',
            name: '',
            email: ''
        });

    };

    componentDidMount() {
        AsyncStorage.multiGet(['userProfile', 'userEmail', 'userName'], (error, stores) => {
            if (stores) {
                console.log('stores--0-0-0-0-0-0-0-0-0-', stores[2][1]);
                this.setState({
                    imageUrl: stores[0][1],
                    email: stores[1][1],
                    name: stores[2][1]
                });
            } else if (error) {
                console.log('error0-0-0-0-0-0-0-0-', error);

            }
        });
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <View
                    style={[styles.container, { width: Dimensions.get("window").width * 0.8 }]}>
                    <ImageBackground
                        source={require('../../assets/images/bg.jpg')} style={{ width: '100%' }}>
                        <View style={{ padding: 15 }}>
                            <Image
                                style={{ width: 70, height: 70, borderRadius: 35, marginTop: 15, marginBottom: 15 }}
                                source={{ uri: this.state.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                                loadingIndicatorSource={require('../../assets/images/user_70.png')}
                            />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{this.state.name || 'name'}</Text>
                            <Text style={{ color: 'white' }}>{this.state.email}</Text>
                        </View>
                    </ImageBackground>
                    <TouchableOpacity onPress={async () => {
                        this.setState({
                            isDashboardClicked: true,
                            isFacilitiesClicked: false,
                            isContainersClicked: false,
                            isGrowAreaClicked: false,
                            isGrowSecionsClicked: false,
                            isDevicesClicked: false
                        });
                        Icon.getImageSource("ios-menu", 30).then((src) => {
                            Navigation.setRoot({
                                root: {
                                    sideMenu: {
                                        id: 'SideMenu',
                                        left: {
                                            icon: src,
                                            component: {
                                                id: 'sideDrawer',
                                                name: 'SideDrawer',
                                                options: {

                                                    layout: {
                                                        orientation: ['portrait']
                                                    }
                                                }

                                            },
                                            options: {
                                                leftButtons: [
                                                    {
                                                        id: "sideDrawer",
                                                        title: 'SideMenu',
                                                        color: 'white'
                                                    }
                                                ],
                                            }
                                        },
                                        center: {
                                            stack: {
                                                children: [{
                                                    component: {
                                                        name: "DashboardScreen",
                                                        options: {
                                                            topBar: {
                                                                elevation: 0,
                                                                drawBehind: false,
                                                                background: {
                                                                    color: Constant.NAVIGATION_BACK_COLOR,
                                                                },
                                                                title: {
                                                                    text: 'Dashboard',
                                                                    color: '#fff',
                                                                },
                                                                leftButtons: [
                                                                    {
                                                                        id: "sideDrawer",
                                                                        icon: src,
                                                                        title: 'SideMenu',
                                                                        color: 'white'
                                                                    }
                                                                ]
                                                            },
                                                            layout: {
                                                                orientation: ['portrait'] // An array of supported orientations
                                                            },
                                                        },
                                                    },

                                                }],
                                            },
                                        },
                                    },
                                    options: {
                                        layout: {
                                            orientation: ['portrait'],
                                        },
                                        popGesture: true,
                                        leftButtons: [
                                            {
                                                id: "sideDrawer",
                                                icon: src,
                                                title: 'Menu',
                                                color: 'white',
                                            }
                                        ]
                                    }
                                },
                            });
                        })
                    }}>
                        <View style={styles.drawerItem}>

                            <Image
                                source={require('../../assets/images/dashboard_grey.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isDashboardClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }} />
                            <Text style={{ marginLeft: 10, color: this.state.isDashboardClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}>Dashboard</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isFacilitiesClicked: true,
                            isContainersClicked: false,
                            isGrowAreaClicked: false,
                            isGrowSecionsClicked: false,
                            isDevicesClicked: false
                        });
                        App(0);
                    }}>
                        <View style={styles.drawerItem}>
                            <Image
                                source={require('../../assets/images/facilities.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isFacilitiesClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isFacilitiesClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}>Facilities</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isFacilitiesClicked: false,
                            isContainersClicked: true,
                            isGrowAreaClicked: false,
                            isGrowSecionsClicked: false,
                            isDevicesClicked: false
                        });
                        App(1);

                    }}>
                        <View style={styles.drawerItem}>
                            <Image
                                source={require('../../assets/images/containers.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isContainersClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isContainersClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }} >Containers</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isFacilitiesClicked: false,
                            isContainersClicked: false,
                            isGrowAreaClicked: true,
                            isGrowSecionsClicked: false,
                            isDevicesClicked: false
                        });
                        App(2);

                    }}>
                        <View style={styles.drawerItem}>
                            <Image
                                source={require('../../assets/images/growarea.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isGrowAreaClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isGrowAreaClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }} >Grow Areas</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isFacilitiesClicked: false,
                            isContainersClicked: false,
                            isGrowAreaClicked: false,
                            isGrowSecionsClicked: true,
                            isDevicesClicked: false
                        });
                        App(3);

                    }}>
                        <View style={styles.drawerItem}>
                            <Image
                                source={require('../../assets/images/growsection.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isGrowSecionsClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isGrowSecionsClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }} >Grow Sections</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3', }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isFacilitiesClicked: false,
                            isContainersClicked: false,
                            isGrowAreaClicked: false,
                            isGrowSecionsClicked: false,
                            isDevicesClicked: true
                        });

                        App(4);
                    }}>
                        <View style={[styles.drawerItem, { alignItems: 'center' }]}>
                            <Image
                                source={require('../../assets/images/device_72.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isDevicesClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isDevicesClicked ? Constant.PRIMARY_COLOR : Constant.GREY_TEXT_COLOR }} >Devices</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => this.logOut()}>
                        <View style={styles.drawerItem}>
                            <Icon
                                name={Platform.OS === "android" ? "md-log-out" : "ios-log-out"}
                                size={30}
                                color={Constant.GREY_TEXT_COLOR}
                                style={{ height: 30, width: 30 }}
                            />
                            <Text style={{ marginLeft: 10, color: Constant.GREY_TEXT_COLOR }} >Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                </View>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.signOutLoading}
                    onRequestClose={() => { this.setState({ signOutLoading: false }); }}>
                    <View style={styles.fullModalContainer}>
                        <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1
    },
    drawerItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,

    },
    drawerItemIcon: {
        marginRight: 10
    },
    fullModalContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#75757595'
    },
    modalContainer: {
        width: '94%',
        minHeight: '56%',
        backgroundColor: Constant.WHITE_BACKGROUND_COLOR
    },
    modalTitle: {
        flexDirection: 'row',
        alignItems: "center"
    },
    modalTitleAddButton: {
        backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
        height: 30,
        width: 30,
        borderRadius: 15,
        margin: 15
    }
});

mapDispatchToProps = dispatch => {
    return {
        onSetUser: (user) => dispatch(authSetUser(user)),
        onLogout: () => dispatch(authLogout())
    }
};

export default connect(null, mapDispatchToProps)(SideDrawer);