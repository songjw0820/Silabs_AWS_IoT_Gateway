import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Image, PermissionsAndroid, Alert, Platform, Button, Picker, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';




class GrowAreas extends Component {

  static get options() {
    return {
      ...Constant.DEFAULT_NAVIGATOR_STYLE
    };
  }
  gatewayCharacteristics = {};
  visible = false;
  bleDevice = null;
  alreadyRegistredGateways = [];
  reteyConnection = 0;
  reSendingPayloadCount = 0;
  errorCode = 0;

  render() {
    return (
      <View style={[styles.container, { flex: 2 }]}>
        <View style={styles.greenBackgroundContainer} />
        {/* {this.renderPage()} */}
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
    fontSize: 12,
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

// mapStatesToProps = state => {
//   this.connectedBleGrowarea = state.ble.bleManager;

//   return {
//     growareas: state.root.growareas,
//     growAreaTypes: state.root.growAreaTypes,
//     facilities: state.root.facilities,
//     containers: state.root.containers,
//     containersByFacilityId: state.root.containersByFacilityId,
//     growareasByContainerId: state.root.growareasByContainerId,
//     isLoading: state.ui.isLoading,
//     registrationState: state.ui.registrationState,
//     gatewayHId: state.root.gatewayHId,
//     apiKey: state.root.apiKey,
//     apiSecretKey: state.root.apiSecretKey,
//     bleManager: state.ble.bleManager,
//     users: state.root.users,
//     alreadyProvisionedGateway: state.root.allProvisionedGateways,
//     internalCloudePayload: state.ble.payLoadForInternalCloud,
//     isGatewayDeleted: state.gateway.isGatewayDeleted,
//     retry401Count: state.auth.retry401Count


//   }
// };

// mapDispatchToProps = dispatch => {
//   return {
//     onGetGrowAreas: (containerId, inBackground, isLessThenVersion4, token, appleKey) => dispatch(getGrowAreas(containerId, inBackground, isLessThenVersion4, token, appleKey)),
//     onGatewayRegistrationToArrow: (payload, bleDevice, seleneVersion) => dispatch(registerGatewayToArrow(payload, bleDevice, seleneVersion)),
//     onUpdateRegistrationState: (state) => dispatch(uiUpdateRegistrationState(state)),
//     onGetContainers: (facilityId, inBackground, showAlert) => dispatch(getContainers(facilityId, inBackground, showAlert)),
//     onGetUsers: (inBackground, token, appleKey) => dispatch(getUsers(inBackground, token, appleKey)),
//     onGetFacilities: (inBackground, token, appleKey) => dispatch(getFacilities(inBackground, token, appleKey)),
//     onGetGrowAreaTypes: (inBackground, token, appleKey) => dispatch(getGrowAreaTypes(inBackground, token, appleKey)),
//     onAddDevice: (device) => dispatch(addBleDevice(device)),
//     onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
//     onSignoutDisconnectFromGrowarea: (device) => dispatch(removeBleDevicefromGrowarea(device)),
//     onGetAllGateways: (token, containerId, inBackground, appleKey) => dispatch(getAllGateways(token, containerId, inBackground, appleKey)),
//     onRegisterGateway: (payload, bleDevice, token, appleKey) => dispatch(registerGateway(payload, bleDevice, token, appleKey)),
//     onDeleteGateway: (token, id, appleKey) => dispatch(deleteLedNodeProfile(token, id, appleKey)),
//     onGatewayDeletionResponse: (flag) => dispatch(deleteGatewayResponse(flag))
//   }
// };

// async function requestLocationPermission() {
//   const granted = await PermissionsAndroid.request(
//     PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
//     {
//       'title': appName + ' Location Permission',
//       'message': appName + ' App needs access to your location ' +
//         'for bluetooth operations.'
//     }
//   )
//   if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//     console.log("You can use the location")
//     return;
//   } else {
//     console.log("Location permission denied")
//     throw new Error('Location permission denied');
//   }
// }


// export const disconnectBleinGrowarea = () => {
//   this.connectedBleGrowarea.destroy()
// }

export default GrowAreas;
