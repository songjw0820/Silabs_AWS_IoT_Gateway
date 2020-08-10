import React, { Component } from "react";
import { View, StyleSheet, ScrollView, Text,FlatList, TouchableOpacity,Image,AsyncStorage,Dimensions, ActivityIndicator, Picker, Alert } from "react-native";
import { connect } from 'react-redux';
import DateTimePicker from 'react-native-modal-datetime-picker';
import * as Urls from '../Urls';
import * as Constant from '../Constant';
import { Navigation } from "react-native-navigation";
import { WebView } from 'react-native-webview';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Swiper from "react-native-custom-swiper";
const {width,height} = Dimensions.get('window');

class HistoricalChart extends Component {

  static get options() {
    return {
      ...Constant.DEFAULT_NAVIGATOR_STYLE
    };
  }
    dataList = []
    constructor(props) {
      super(props);
      Navigation.events().bindComponent(this);
        this.state = {
            token: '',
            sensors: [],
            currentIndex: 0,
            currentPropertyIndex: 0,
        };
    }

    componentDidAppear() {
        AsyncStorage.multiGet(['accessToken','sensorList']).then(response => {
          let token = response[0][1];
          let sensors = JSON.parse(response[1][1]);
          this.setState({ token, sensors}, () => {
          });
        }).catch((e) => {
          console.log('error in geting asyncStorage\'s item:', e.message);
        })
    }

    ActivityIndicatorLoadingView() {
        //making a view to show to while loading the webpage
        return (
        <View style={styles.activityIndicator}>
        <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /><Text style={{ margin: 4, fontWeight: "bold" }}>Data Loading...</Text>
       </View>
        );
      }

  
    showData()
    {
        var selectedItem=this.state.sensors[this.state.currentIndex]
        gatewayId=selectedItem['gatewayId'];
        sensorId=selectedItem['sensorId'];
        propertyName=Constant.propertyList[this.state.currentPropertyIndex];
        console.log("property selected---"+propertyName);
        const finalUrl=Urls.EMBEDDED_BASE_URL+'&gatewayId='+gatewayId+'&sensorId='+sensorId+'&propertyName='+propertyName;
        console.log(finalUrl);
       return (
            
            <WebView 
              source={{ uri: finalUrl }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              renderLoading={this.ActivityIndicatorLoadingView}
              startInLoadingState={true}
            />
          );
    }

    openDashboardPage = () => {
        Navigation.push(this.props.componentId, {
          component: {
            name: 'DashboardScreen',
            options: {
              topBar: {
                visible: false
              }
            }
          }
        });
      }

   screenChange = index => {
        console.log("index when change :=> \n", index);
        this.setState({ currentIndex: index });
    };

    renderImageSwipeItem = item => {
      return (
          <View>
              <Text style={styles.buttonText} >{item.device_name}</Text> 
          </View>
      );
  };

  renderSwipeProperty = item => {
    return (
        <View>
            <Text style={styles.buttonText} >{item}</Text> 
        </View>
    );
};
    screenChangeProperty = index => {
      console.log("index when change :=> \n", index);
      this.setState({ currentPropertyIndex: index });
    };



    render() {
        let devicesList;
        if(this.state.sensors.length!== 0)
        {
            devicesList=(
              <ScrollView  contentContainerStyle={styles.inputContainer}>
              <View style={{marginVertical:height*0.05}}>
                  <View style={[styles.roundButton,{flexDirection:'row'}]}>
                      <Swiper
                              style={{ flex: 1}}
                              currentSelectIndex={0}
                              swipeData={this.state.sensors}
                              renderSwipeItem={this.renderImageSwipeItem}
                              onScreenChange={this.screenChange}
                              backgroundColor={Constant.RED_COLOR}
                              containerWidth={width*0.7}
                              leftButtonImage={require('../../assets/images/backward.png')}
                              rightButtonImage={require('../../assets/images/forward.png')}
                          />
                  </View>
                  <View style={[styles.roundButton,{flexDirection:'row'}]}>
                      <Swiper
                                  style={{ flex: 1 }}
                                  currentSelectIndex={0}
                                 // swipeData={this.state.propertyList}
                                 swipeData={Constant.propertyList}
                                  renderSwipeItem={this.renderSwipeProperty}
                                  onScreenChange={this.screenChangeProperty}
                                  backgroundColor={Constant.RED_COLOR}
                                  containerWidth={width*0.7}
                                  leftButtonImage={require('../../assets/images/backward.png')}
                                  rightButtonImage={require('../../assets/images/forward.png')}
                              />
                  </View>
                  <View style={{ marginVertical:height*0.01}}>  
                    <Text style={{fontSize:RFPercentage(3.0), color:"black",alignSelf:'center'}}>{this.state.sensors[this.state.currentIndex]['device_name']} : {Constant.propertyList[this.state.currentPropertyIndex]}</Text>
                    <View style={{flexDirection:'column',width:(width * 0.9),height:(height * 0.5), marginVertical:height*0.01}}>
                    {this.showData()}
                    </View>
                  </View>
              </View>
        
              <View>
                  
                      <View style={{flexDirection:'row'}}>
                          <View style={[styles.alertButton,{flexDirection:'row'}]}>
                              <Image source={ require('../../assets/images/backward.png')} style={styles.settingIcon}></Image>
                              <Text style={styles.buttonText}>Low Alert</Text>
                              <Image source={ require('../../assets/images/forward.png')} style={styles.settingIcon}></Image>    
                          </View>
                          <Text style={styles.number}>40</Text>
                      </View>
                      <View style={{flexDirection:'row'}}>
                          <View style={[styles.alertButton,{flexDirection:'row'}]}>
                              <Image source={ require('../../assets/images/backward.png')} style={styles.settingIcon}></Image>
                              <Text style={styles.buttonText}>High Alert</Text>
                              <Image source={ require('../../assets/images/forward.png')} style={styles.settingIcon}></Image>
                          </View>
                          <Text style={styles.number}>80</Text>
                          <TouchableOpacity><Text style={{color:"black",fontSize:RFPercentage(5.5),marginHorizontal:width * 0.02,fontWeight: "bold"}}>F</Text></TouchableOpacity>
                      </View>
              </View>
      
              </ScrollView>
               
            );

        }
        else
        {
          devicesList=(
            <ScrollView contentContainerStyle={styles.activityIndicator}>
          <Text color="#00ff00">No Sensors found.</Text>
            </ScrollView>
          );
        }
    return (
       
    <View style={styles.container}>
         <View style={styles.greenBackgroundContainer} />
        <View style={styles.titleTextContainer}>
            <View style={{width:'60%'}}><Text style={styles.titleText}> Sensor View</Text></View>
            
            <View style={{width:'40%' ,flexDirection:'row',alignItems:'flex-end',alignContent:'flex-end',alignSelf:'flex-end',justifyContent:'flex-end'}}>
                <TouchableOpacity>
                <Image source={ require('../../assets/images/setting1.png')} style={styles.settingIcon} ></Image>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {this.openDashboardPage() }}>
                <Image source={ require('../../assets/images/home1.png')} style={styles.homeIcon} ></Image>
                </TouchableOpacity>
            </View>
            
        </View>
        {devicesList}
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
    titleText: {
      fontSize: RFPercentage(4.5),
      color: Constant.WHITE_TEXT_COLOR,
      fontWeight: "bold",
      marginLeft: width * 0.03,
    },
    number:{
        color:"black",
        fontSize:RFPercentage(3.5),
        marginHorizontal:width * 0.02,
        fontWeight: "bold"
    },
    settingIcon: {
      height: height * 0.05,
      width: width * 0.07,
      marginHorizontal:width * 0.03
    },
    homeIcon: {
      height: height * 0.055,
      width: width * 0.07,
      marginHorizontal:width * 0.03
    },
    titleTextContainer: {
      flexDirection: 'row',
      alignItems: "center",
    },
    greenBackgroundContainer: {
      backgroundColor: Constant.RED_COLOR,
      width: '100%',
      height: height * 0.095,
      position: 'absolute'
    },
    WebViewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      },
    listContainer: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
      marginLeft: '5%',
      marginRight: '5%',
      marginTop:height * 0.065,
      borderRadius: 5,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: "center"
    },
    roundButton: {
      justifyContent: "center",
      backgroundColor:Constant.RED_COLOR,
      padding: 6,
      borderRadius: 8,
      alignItems:"center",
      alignSelf:"center",
      marginVertical:height*0.01,
      //marginRight: 12,
      height:width * 0.15,
      width:width * 0.8
    },
    flatlist:{
        width:(width * 0.8)+5,
    },
    alertButton: {
        justifyContent: "center",
        backgroundColor:Constant.RED_COLOR,
        padding: 6,
        borderRadius: 8,
        alignItems:"center",
        alignSelf:"center",
        marginLeft:width*0.04,
        marginVertical:height*0.01,
        height:width * 0.15,
        width:width * 0.6
      },
    addNewButton: {
      backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
    },
    registerButton: {
      backgroundColor: Constant.RED_COLOR,
    },
    cancelButton: {
      margin: 10,
      marginLeft: 15,
      backgroundColor: Constant.RED_COLOR
    },
    buttonText: {
      fontSize: RFPercentage(2.5),
      color: Constant.WHITE_TEXT_COLOR,
      fontWeight: "bold",
      textAlign: 'center'
    },
    fullModalContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#78787885'
    },
    modalContainer: {
      width: '94%',
      height: '56%',
      backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
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
    },
    scanContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    scanImage: {
      height: 100,
      width: 100
    },
    scanText: {
      marginTop: 10,
      marginBottom: 30,
      color: Constant.DARK_GREY_COLOR
    },
    gatewayList: {
      flex: 1
    },
    gatewayListContainer: {
      flex: 1,
      justifyContent: "center"
    },
    gatewayIcon: {
      backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
      height: 30,
      width: 30,
      borderRadius: 15,
      margin: 5,
      marginLeft: 15,
    },
    listTitle: {
      flex: 1,
      padding: 10,
      fontWeight: 'bold',
      borderBottomColor: Constant.LIGHT_GREY_COLOR
    },
    listItem: {
      width: "100%",
      borderTopWidth: 2,
      borderColor: Constant.LIGHT_GREY_COLOR,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: 'center',
      paddingLeft: 10,
      paddingRight: 6,
      height: 50,
    },
    gatewayItem: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: Constant.LIGHT_GREY_COLOR,
    },
    activityIndicator: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    registrationModalContainer: {
      width: '84%',
      marginTop: 60,
      marginBottom: 60,
      backgroundColor: Constant.WHITE_TEXT_COLOR
    },
    inputContainer: {
      marginLeft: '5%',
      marginRight: '5%'
    },
    menuItem: { margin: 6 }
  });


export default connect()(HistoricalChart);

