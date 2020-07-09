import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, TextInput,FlatList, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Image, PermissionsAndroid, Alert, Platform, Button, Picker, AsyncStorage,Dimensions
} from 'react-native';
import * as Constant from '../Constant';
import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const {width,height} = Dimensions.get('window');


Amplify.configure({
    Auth: {
      identityPoolId: 'ap-southeast-1:24d046a2-b54f-4e35-9d5d-2ed6d7f88dd0',
      region: 'ap-southeast-1',
    }
  });

Amplify.addPluggable(new AWSIoTProvider(
    {
    aws_pubsub_region: 'ap-southeast-1',
    aws_pubsub_endpoint: 'wss://a1krmtbfd4tiot-ats.iot.ap-southeast-1.amazonaws.com/mqtt',
  }));


class PublishData extends Component {

  static get options() {
    return {
      ...Constant.DEFAULT_NAVIGATOR_STYLE
    };
  }

  state = {
    payload: ''
 }

 handlePayload = (text) => {
  this.setState({ payload: text })
}

clearText(){
  this.setState({payload:''})
}

publishData = (payload) => {
    console.log(payload)
    try{
      Amplify.PubSub.publish('telemetry',JSON.parse(payload));
      this.clearText()
    }catch(err)
    {
      console.log(err)
      alert("Please check your input . It is invalid JSON")
    }
 }
  render() {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <View  style={styles.greenBackgroundContainer}/>
        <View>
          <Text style={styles.inputText}>Enter Sensor Data into JSON format:</Text>
           <TextInput style = {styles.input}
               underlineColorAndroid = "transparent"
               placeholder = " "
               placeholderTextColor = "#9a73ef"
               autoCapitalize = "none"
               onChangeText = {this.handlePayload}
               value={this.state.payload}
               />
            <TouchableOpacity style={styles.SubmitButtonStyle} onPress={() => this.publishData(this.state.payload)}>
            <Text style={styles.buttonText}> Publish</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }
}



const styles = StyleSheet.create({
  SubmitButtonStyle: {
 
    marginTop:height * 0.02,
    paddingTop: height * 0.02,
    paddingBottom:height * 0.02,
    marginLeft:height * 0.08,
    marginRight: height * 0.08,
    backgroundColor:'#008CBA',
    borderRadius:20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  input: {
    margin: height * 0.03,
    marginTop:height * 0.02,
    height: height * 0.06,
    borderColor: '#7a42f4',
    backgroundColor: '#FFFFFF',
    borderWidth: 1
 },
 inputText: {
  marginTop: height * 0.3,
  fontSize: RFPercentage(2.5),
  color: "#000000",
  fontWeight: "bold",
  textAlign: 'center',

},
  button: {
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    padding: 10,
    borderRadius: 5
  },
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: "center"
  },
  roundButton: {
    justifyContent: "center",
    padding: 6,
    borderRadius: 12,
    marginRight: 12
  },
  addNewButton: {
    backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
  },
  registerButton: {
    backgroundColor: Constant.PRIMARY_COLOR,
  },
  cancelButton: {
    width: 60,
    margin: 10,
    marginLeft: 15,
    backgroundColor: Constant.DARK_GREY_COLOR
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



export default PublishData;
