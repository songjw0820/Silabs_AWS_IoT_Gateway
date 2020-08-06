import React, { Component } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator,Dimensions,ImageBackground,
  Platform, AsyncStorage,Image,TouchableOpacity,Button
} from 'react-native';
import { connect } from 'react-redux';
import Slide from './SlideComponent';
import * as Constant from '../Constant';
import Swiper from 'react-native-swiper';
import { Navigation } from 'react-native-navigation';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
const {width,height} = Dimensions.get('window');
import Auth from '@aws-amplify/auth';



class Settings extends Component {

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE
  }

  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    this.eventSubscription = Navigation.events().registerNavigationButtonPressedListener(this.MenuIconPrressed);
    this.state = {
        token: '',
        eButtonValue: 'ON',
        pButtonValue: 'OFF',
        sideMenuVisible: false
    };
  }

  componentDidAppear() {
        AsyncStorage.multiGet(['accessToken','email','number']).then(response => {

          let token = response[0][1];
          let email = JSON.parse(response[1][1]);
          let number = JSON.parse(response[2][1]);
          this.setState({ token,email,number}, () => {
          });
        }).catch((e) => {
          console.log('error in geting asyncStorage\'s item:', e.message);
        })

  }
  MenuIconPrressed = (res) => {
      Platform.OS === 'ios' ? this.setState({ sideMenuVisible: !this.state.sideMenuVisible }) : this.setState({ sideMenuVisible: true })
      Navigation.mergeOptions(res.componentId, {
        sideMenu: {
          left: {
            visible: this.state.sideMenuVisible,
            enabled: Platform.OS === 'android'
          }
        }
      })
  }


  signOut = async () => {
      await Auth.signOut()
      AsyncStorage.multiRemove(['accessToken','listGateway','sensorList']).then(()=> {
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

  openDashboardPage = () => {
      Navigation.push(this.props.componentId, {
        component: {
          name: 'DashboardScreen',
          options: {
            topBar: {
              visible: true
            }
          }
        }
      });
  }

  openGatewayPage = () => {
     let screenName = 'GrowAreasScreen';
     Navigation.push(this.props.componentId, {
       component: {
         name: screenName,
         passProps: {

         },
         options: {
           topBar: {
             visible: true,
             animate: true,
             elevation: 0,
             shadowOpacity: 0,
             drawBehind: false,
             hideOnScroll: false,
             height:44,
             background: {
               color: Constant.RED_COLOR,
             },
             backButton: {
               color: '#fff',
             },
             title: {
               text: "Previous",
               color: '#fff',
             }
           },
           layout: {
             orientation: ['portrait'] // An array of supported orientations
           },
           sideMenu: {
             left: {
               visible: false,
               enabled: Platform.OS === 'android',
             }
           }
         }
       }
     });
   }

  openSensorPage = () => {
       let screenName = 'DevicesScreen';
       Navigation.push(this.props.componentId, {
         component: {
           name: screenName,
           passProps: {

           },
           options: {
             topBar: {
               visible: true,
               animate: true,
               elevation: 0,
               shadowOpacity: 0,
               drawBehind: false,
               hideOnScroll: false,
               height:44,
               background: {
                 color: Constant.RED_COLOR,
               },
               backButton: {
                 color: '#fff',
               },
               title: {
                 text: "Previous",
                 color: '#fff',
               }
             },
             layout: {
               orientation: ['portrait'] // An array of supported orientations
             },
             sideMenu: {
               left: {
                 visible: false,
                 enabled: Platform.OS === 'android',
               }
             }
           }
         }
       });
     }



   render() {
      return (
        <View style={styles.container}>
        <View style={styles.greenBackgroundContainer} />
        <View style={styles.titleTextContainer}>
          <View style={{width:'60%'}}><Text style={styles.titleText}>Settings</Text></View>

          <View style={{width:'40%',flexDirection:'row',alignItems:'flex-end',alignContent:'flex-end',alignSelf:'flex-end',justifyContent:'flex-end'}}>
            <TouchableOpacity onPress={() => {this.signOut()}}>
            <Image source={ require('../../assets/images/signout.png')} style={[styles.signOutIcon,{marginBottom: '6%'}]} ></Image>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {this.openDashboardPage() }}>
            <Image source={ require('../../assets/images/home1.png')} style={[styles.homeIcon,{marginBottom: '6%'}]} ></Image>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.squareRound}>
            <Text style={styles.text}>Notifications</Text>
            <View style= {styles.rectangle}>
                <Text style={styles.emailText}>Email : </Text>
                 <Text style={[styles.emailText,{marginTop: '0.5%'}]}>{this.state.email}</Text>
            </View>
            <View style={styles.buttonView}>
              <TouchableOpacity onPress ={() => {this.state.eButtonValue === 'ON' ? this.setState({eButtonValue:'OFF'}) : this.setState({eButtonValue:'ON'})}}>
                <Text style={[styles.emailText,{textAlign: 'center',marginTop: '12%'}]}>{this.state.eButtonValue}</Text>
              </TouchableOpacity>
            </View>
            <View><Text style= {styles.tapText}>(Data Charges may apply)</Text></View>
            <View style= {[styles.rectangle,{marginTop: '1%'}]}>
                 <Text style={styles.emailText}>Text : </Text>
                 <Text style={[styles.emailText,{marginTop: '0.5%'}]}>{this.state.number}</Text>
            </View>
             <View style={styles.buttonView}>
              <TouchableOpacity onPress ={() => {this.state.pButtonValue === 'ON' ? this.setState({pButtonValue:'OFF'}) : this.setState({pButtonValue:'ON'})}}>
                 <Text style={[styles.emailText,{textAlign: 'center',marginTop: '12%'}]}>{this.state.pButtonValue}</Text>
              </TouchableOpacity>
              </View>
        </View>
        <View style= {[styles.rectangle,{width: width * 0.6,marginLeft: '20%',marginTop: '10%',height: height * 0.06}]}>
          <TouchableOpacity onPress={() => {this.openGatewayPage()}}>
             <Text style={[styles.emailText,{marginTop: '4.5%'}]}>Configure Gateway</Text>
          </TouchableOpacity>
        </View>

        <View style= {[styles.rectangle,{width: width * 0.6,marginLeft: '20%',marginBottom: height * 0.02,height: height * 0.06}]}>
          <TouchableOpacity onPress={() => {this.openSensorPage()}}>
             <Text style={[styles.emailText,{marginTop: '4.5%'}]}>Configure Sensors</Text>
          </TouchableOpacity>
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
  titleTextContainer: {
     flexDirection: 'row',
     alignItems: "center",
   },
  greenBackgroundContainer: {
     backgroundColor: Constant.RED_COLOR,
     width: '100%',
     height: height * 0.085,
     position: 'absolute'
   },
  squareRound:
   {
     borderWidth: 3,
     borderRadius: 50,
     marginTop: '15%',
     marginRight: height * 0.05,
     marginLeft: height * 0.05,
     borderColor: Constant.RED_COLOR,
     height: height * 0.48,
   },
   rectangle:
   {
       borderRadius: 20,
       backgroundColor: Constant.RED_COLOR,
       marginTop: '4%',
       marginRight: height * 0.03,
       marginLeft: height * 0.03,
       height: height * 0.11,

   },
   text:
   {
      flexDirection: 'row',
      color: Constant.BLACK_COLOR,
      fontSize: RFPercentage(4),
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: '1%',

   },
   tapText:
   {
       color: Constant.BLACK_COLOR,
       fontSize: RFPercentage(2.5),
       textAlign: 'center',
   },
   buttonView:
   {
      backgroundColor: Constant.RED_COLOR,
      width: width * 0.15,
      height: width * 0.1,
      borderRadius: 10,
      marginLeft: width * 0.57,
      marginTop: '1%',
      marginBottom: '0.05%'
   },
   emailText:
   {
        flexDirection: 'row',
        color: Constant.WHITE_COLOR,
        fontSize: RFPercentage(2.5),
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: '3%',
   },
  titleText: {
    fontSize: RFPercentage(4.5),
    color: Constant.WHITE_TEXT_COLOR,
    fontWeight: "bold",
    marginLeft: width * 0.03,
  },
  signOutIcon: {
    height: height * 0.04,
    width: width * 0.068,
    marginHorizontal:width * 0.03
  },
  homeIcon: {
    height: height * 0.045,
    width: width * 0.068,
    marginHorizontal:width * 0.03
  },

   Button: {
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: 'center',
    padding: 5,
    borderRadius: 16,
    marginRight: 12,
    marginTop:10,
    width: width * 0.7,
    height:width * 0.15,
    borderRadius: 12,
    backgroundColor: Constant.RED_COLOR,
  },

  ButtonText: {
      fontSize: 19,
      marginLeft: 7,
      color: Constant.WHITE_COLOR,
      fontWeight: "bold",
      textAlign: 'center'
    },
  });

  export default Settings;