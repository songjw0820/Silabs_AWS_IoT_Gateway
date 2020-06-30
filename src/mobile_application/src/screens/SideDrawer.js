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
import Auth from '@aws-amplify/auth';

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
            isDevicesClicked: false,
            isDataPublishClicked:false

        }
    }


 signOut = async () => {
    await Auth.signOut()
    AsyncStorage.removeItem('accessToken').then(()=> {
       console.log('successfully logged out');
     }).catch((error) => {
          console.log('error in removing account', error);
     })

    this.setState({
                signOutLoading: true,
                imageUrl: '',
               name: '',
                email: ''
           });
    Navigation.setRoot({
                root: {
                    component: {
                        name: 'LoginScreen'
                    },
                }
            });
  }

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
                        source={require('../../assets/images/logo.jpg')} style={{ width: '100%' }}>
                        <View style={{ padding: 15 }}>
                            <Image
                                style={{ width: 50, height: 50, borderRadius: 35, marginTop: 0, marginBottom: 60 }}
                                source={{ uri: this.state.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                                loadingIndicatorSource={require('../../assets/images/user_70.png')}
                            />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{this.state.name || 'name'}</Text>
                            <Text style={{ color: 'white' }}>{this.state.email}</Text>
                        </View>
                    </ImageBackground>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                          this.setState({
                            isDashboardClicked: true,
                            isGrowAreaClicked: false,
                            isDevicesClicked: false
                          });
                          App(0);
                    }}>
                        <View style={styles.drawerItem}>
                        <Image
                           source={ require('../../assets/images/dashboard_grey.png')}
                           style={{ height: 30, width: 30, tintColor:this.state.isDashboardClicked? Constant.PRIMARY_COLOR : '#000000' }}
                            />
                            <Text style= {{marginLeft: 10 , color: this.state.isDashboardClicked? Constant.PRIMARY_COLOR : '#000000'}}>Dashboard</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isGrowAreaClicked: true,
                            isDevicesClicked: false
                          });
                          App(1);
                    }}>
                        <View style={styles.drawerItem}>
                            <Image
                                source={require('../../assets/images/growarea.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isGrowAreaClicked ? Constant.PRIMARY_COLOR : '#000000' }}
                            />
                            <Text style={{ marginLeft: 10, color: this.state.isGrowAreaClicked? Constant.PRIMARY_COLOR : '#000000' }} >Gateway</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3', }}></View>
                    <TouchableOpacity onPress={() => {
                        this.setState({
                            isDashboardClicked: false,
                            isGrowAreaClicked: false,
                            isDevicesClicked: true
                            
                          });
                          App(2);
                    }}>
                        <View style={[styles.drawerItem, { alignItems: 'center' }]}>
                            <Image
                                source={require('../../assets/images/device_72.png')}
                                style={{ height: 30, width: 30, tintColor: this.state.isDevicesClicked ? Constant.PRIMARY_COLOR : '#000000' }}
                            />
                            <Text style={{ marginLeft: 10,  color: this.state.isDevicesClicked? Constant.PRIMARY_COLOR : '#000000'}} >Sensors</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 2, backgroundColor: '#f3f3f3', }}></View>
                    <TouchableOpacity onPress={() => {
                          this.setState({
                            isDashboardClicked: false,
                            isGrowAreaClicked: false,
                            isDevicesClicked: false,
                            isDataPublishClicked:true
                          });
                          App(3);
                    }}>
                        <View style={[styles.drawerItem, { alignItems:'center'}]}>
                        <Image
                           source={ require('../../assets/images/growsection.png')}
                           style={{ height: 30, width: 30, tintColor:this.state.isDataPublishClicked? Constant.PRIMARY_COLOR : '#000000' }}
                            />
                            <Text style={{ marginLeft: 10,  color: this.state.isDataPublishClicked? Constant.PRIMARY_COLOR : '#000000' }} >Publish</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
                    <TouchableOpacity onPress={() => this.signOut()}>
                        <View style={styles.drawerItem}>
                            <Icon
                                name={Platform.OS === "android" ? "md-log-out" : "ios-log-out"}
                                size={30}
                                color={'#000000'}
                                style={{ height: 30, width: 30 }}
                            />
                            <Text style={{ marginLeft: 10, color: '#000000' }} >Sign Out</Text>
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