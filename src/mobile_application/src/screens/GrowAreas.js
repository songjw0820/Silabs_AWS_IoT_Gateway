import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Image, PermissionsAndroid, Alert, Platform, Button, Picker, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import * as RegistrationStates from '../RegistrationStates';
import { gateway_discovery_name_prefix, displayName as appName, debug ,bleDebug} from './../../app.json';
import { connect } from 'react-redux';
import {
  deleteGateway, deleteGatewayResponse,uiStartLoading,uiStopLoading,
  uiUpdateRegistrationState, addBleDevice,removeBleDevicefromGrowarea
} from '../store/actions/rootActions';
import { BleManager } from 'react-native-ble-plx';
import { TextField } from 'react-native-material-textfield';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import { setBleManager } from '../store/actions/bleActions';
import Base64 from './../utils/Base64';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MultiSelect from 'react-native-multiple-select';
import { Navigation } from 'react-native-navigation';



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
  provisionCallbackCharSubscription = null;
  timeoutValue=null;
  loading=false;
  
  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    if (!this.props.bleManager) this.props.onSetBleManager(new BleManager());
    this.state = {
      refreshing: false,
      modalVisible: false,
      registrationModalVisible: false,
      discoveredGateways: {},
      containerId: '',
      facilityId: '',
      gatewayId:'',
      bleMessage: '',
      bleError: '',
      gatewayUId: '',
      selectedUsers: [],
      isContanerFetched: false,
      users: [],
      gateways: [],
      sensors:[],
      curerentUser: '',
      seleneVersion: '',
      isGotAlreadyRegistredGateway: false

    };
  }

  componentDidAppear() {
    this._onRefresh();
    //let containerId = this.state.containerId;
    this.props.bleManager.destroy()
    this.props.onSetBleManager(new BleManager());
    this.visible = true;
    this.forceUpdate();

    AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN', 'userEmail','email','sensorList']).then(response => {
      let token = response[0][1];
      let appleKey = response[1][1];
      let currentUser = response[2][1];
      let email = response[3][1];
      let sensors = JSON.parse(response[4][1]);
      
      this.setState({ token, appleKey, currentUser,email,sensors}, () => {
       
      });
    }).catch((e) => {
      console.log('error in geting asyncStorage\'s item:', e.message);
    })
  }

  componentDidDisappear() {
    console.log('growARea, disappper', this.state.modalVisible);
    this.visible = false;
    this.setState({ modalVisible: false, registrationModalVisible: false });
    this.props.bleManager.destroy()
    this.props.onSetBleManager(new BleManager());
  }



  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.selectedContainer) {
      return {
        ...prevState,
        containerId: nextProps.selectedContainer.id,
        facilityId: nextProps.selectedContainer.facilityId
      };
    }
    else if (nextProps.selectedFacility) {
      return {
        ...prevState,
        facilityId: nextProps.selectedFacility.id
      }
    }
    return null;
  }

  _onRefresh = () => {
    this.setState({ refreshing: true, searching: true, filterKey: '' });
    
    AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN', 'userEmail','email']).then(response => {
      let token = response[0][1];
      let appleKey = response[1][1];
      let email=response[3][1];
      console.log("finally email----"+email);
      if (this.search) this.search.clear();
      this.setState({ refreshing: false });
    }).catch((e) => {
      console.log('error in geting asyncStorage\'s item in _onRefrreshGrowArea: ', e.message);
    })
  }

  onDisconnect = growArea => {
    if (growArea.grow_area_uid) {
      if (this.props.bleManager) {
        this.props.bleManager.cancelDeviceConnection(growArea.grow_area_uid)
          .then(device => {
            console.log(device.id + " disconnected by user");
            return {}
          })
          .catch(error => {
            console.log('error:' + error);
          })
      }
      else {
        this.props.onSetBleManager(new BleManager());
        this.onDisconnect(growArea);
      }
    }
  }

  showGatewayDiscoveryModal(visible) {
    if (this.props.registrationState === RegistrationStates.REGISTRATION_PROCESS_COMPLETE) {
      this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_NOT_STARTED);
      this.setRegistrationModalVisible(false);
      this.setState({
        discoveredGateways: {}
      });
    }

    if (visible) {
      this.gatewayCharacteristics = {};
      const subscription = this.props.bleManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.props.bleManager.destroy()
          this.props.onSetBleManager(new BleManager());
          setTimeout(() => {
            if (this.state.isGotAlreadyRegistredGateway) {

              this.scanAndConnect();
              this.setState({ modalVisible: true, showCancelButton: true });
              subscription.remove();
            } else {
              this.setState({ modalVisible: false, showCancelButton: false });
            }
          }, 1000)
        }
        else if (state === 'PoweredOff') {
          if (Platform.OS === 'ios') {
            Alert.alert('Permission required', appName + ' app wants to use your Bluetooth.. please enable it.', [{ text: 'Ok', onPress: () => { } }], { cancelable: true })
          }
          else {
            Alert.alert('Permission required', appName + ' app wants to turn on Bluetooth',
              [
                { text: 'DENY', onPress: () => { }, style: 'cancel' },
                {
                  text: 'ALLOW', onPress: () => {
                    Promise.resolve(this.props.bleManager.enable('myTransaction'))
                      .catch(error => { console.log("BluetoothTurnOnError:" + error); });
                  }
                },
              ],
              { cancelable: true }
            )
          };
        }
      }, true);
    }



    else {
      this.setState({
        modalVisible: visible,
        discoveredGateways: {}
      });
      this.props.bleManager.stopDeviceScan();
    }
  }

  showGatewayDiscoveryModalForDeleteGateway(visible) {
    this.props.uiStartLoading("Deleting gateway....");
    if (visible) {
      this.gatewayCharacteristics = {};
      const subscription = this.props.bleManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.props.bleManager.destroy()
          this.props.onSetBleManager(new BleManager());
          setTimeout(() => {
            if (this.state.isGotAlreadyRegistredGateway) {
              this.scanAndConnectForDeleteGateway()
                this.setState({ modalVisible: false, showCancelButton: false });
                subscription.remove();
            } else {
              this.setState({ modalVisible: false, showCancelButton: false });
            }
          }, 1000)
        }
        else if (state === 'PoweredOff') {
          if (Platform.OS === 'ios') {
            this.props.uiStopLoading();
            Alert.alert('Permission required', appName + ' app wants to use your Bluetooth.. please enable it.', [{ text: 'Ok', onPress: () => { } }], { cancelable: true })
          }
          else {
            this.props.uiStopLoading();
            Alert.alert('Permission required', appName + ' app wants to turn on Bluetooth',
              [
                { text: 'DENY', onPress: () => { }, style: 'cancel' },
                {
                  text: 'ALLOW', onPress: () => {
                    Promise.resolve(this.props.bleManager.enable('myTransaction'))
                      .catch(error => { console.log("BluetoothTurnOnError:" + error); });
                  }
                },
              ],
              { cancelable: true }
            )
          };
        }
      }, true);
    }
  console.log("end------------");

  }

  gatewayRegisterClickHandler = (bleGateway) => {
    console.log('register called', bleGateway);
   // this.getUserForDisplay();
    this.bleDevice = bleGateway;
    this.props.bleManager.stopDeviceScan();
    this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_NOT_STARTED);
    if (Platform.OS === 'android') {
      this.setState({
        gatewayName: bleGateway.name,
        gatewayUId: bleGateway.id,
        growAreaType: {},
        gatewayDescription: 'My Description',
        registrationModalVisible: true,
        bleMessage: 'Connecting to device..',
        bleError: '',
        gatewayMacId: bleGateway.id,
        waitingForGatewayLoader: false
      })
      console.log("gatewayMacId set");
    }
    else {
      let macId = bleGateway.name.split('_').slice(-1).pop();
      this.setState({
        gatewayName: bleGateway.name,
        gatewayUId: bleGateway.id,
        growAreaType: {},
        gatewayDescription: 'My Description',
        registrationModalVisible: true,
        bleMessage: 'Connecting to device..',
        bleError: '',
        gatewayMacId: bleGateway.name,
        waitingForGatewayLoader: false
      })
    }
    this.connectAndDiscoverCharacteristics(bleGateway);
  }

  gatewayRegisterSubmitClickHandler = () => {
    this.errorCode = 0;
    let payload = {}
    let regEx = /^[a-zA-Z][a-zA-Z_.-]{0,1}[ a-z|A-Z|0-9|_.:-]*$/;
    if (this.state.gatewayName.trim() !== '' && this.state.gatewayName.length <= 30 && regEx.test(this.state.gatewayName.trim())) payload.name = this.state.gatewayName.trim();
    else { Alert.alert("Invalid Gateway name.", "Invalid Gateway name! Maximum length is 25. Name should start with alphabet and may contain dot, underscore, space and numeric value."); return; }
    if (this.state.gatewayUId.trim()) payload.uid = this.state.gatewayUId;
    else { alert("GatewayUId not found."); return; }
    if (this.state.gatewayDescription.trim().length <= 200) payload.description = this.state.gatewayDescription;
    else { alert("Please provide valid gateway description. (Maximum length 200)"); return; }
    
    
    payload.users = this.props.users.filter(item => {
      return this.state.selectedUsers.includes(item.email_id);
    });
    payload.osName = 'Linux';
    console.log('[][][][][][][][][', payload);
    console.log('this.state.seleneversion-=-=-=-=-=-=-=-=-=', this.state.seleneVersion);
    this.props.onUpdateRegistrationState(RegistrationStates.FETCHING_CONFIG_FROM_ARROW_SUCCESS);
  }

  retryRegistration = () => {
    console.log("Retry registration called.");
    this.gatewayRegisterSubmitClickHandler();
  }

  getRegistrationMessage = (registrationState) => {
    switch (registrationState) {
      case RegistrationStates.REGISTRATION_STARTED_TO_ARROW:
        return "Registering to Arrow Cloud..."
      case RegistrationStates.REGISTRATION_SUCCESS_TO_ARROW:
        return "Registered to Arrow Cloud Successfully"
      case RegistrationStates.REGISTRATION_FAILED_TO_ARROW:
        return "Registration to Arrow Cloud Failed"
      case RegistrationStates.FETCHING_CONFIG_FROM_ARROW_STARTED:
        return "Fetching Configuration from Arrow Cloud..."
      case RegistrationStates.FETCHING_CONFIG_FROM_ARROW_SUCCESS:
        return "Configuration Fetched Successfully"
      case RegistrationStates.FETCHING_CONFIG_FROM_ARROW_FAILED:
        return "Failed to Fetch Configuration from Arrow Cloud..."
      case RegistrationStates.REGISTRATION_STARTED_TO_INTERNAL_CLOUD:
        return "Registering to EFR32 IoT Gateway ..."
      case RegistrationStates.REGISTRATION_SUCCESS_TO_INTERNAL_CLOUD:
        return "Registered to " + appName + " Successfully"
      case RegistrationStates.REGISTRATION_FAILED_TO_INTERNAL_CLOUD:
        return "Registration to " + appName + " Failed"
      case RegistrationStates.SENDING_PAYLOAD_TO_GATEWAY:
        return "Sending data to Gateway"
      case RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL:
        return "Connection was interrupted"
      default:
        return 'Invalid registration state found:' + registrationState;
    }
  }

  setRegistrationModalVisible(visible, disconnectDeivce) {
    if (visible) {
      this.setState({
        registrationModalVisible: true,
        bleMessage: '',
        bleError: '',
        growAreaType: {},
        gatewayDescription: '',
        facilityPicked: false,
        containerPicked: false,
        selectedUsers: []
      });

    }
    else {
      if (this.state.facilityPicked) {
        this.setState({
          registrationModalVisible: false,
          facilityId: '',
          facilityPicked: false,
          containerId: '',
          containerPicked: false
        });
      }
      else {
        this.setState({
          registrationModalVisible: false,
        });
      }
      if (this.bleDevice && disconnectDeivce) {
        try {
          this.bleDevice.isConnected().then((isDeviceConnected) => {
            console.log('isDeviceConnected in groearea', isDeviceConnected);
            if (isDeviceConnected) {
              this.bleDevice.cancelConnection().then(() => {
                console.log('successfully disconnected in Growrea');
              }).catch((error) => {
                console.log(' error in disconnecting BLE from sign out Growarea', error);
              })
            } else {
              console.log('gateway is not connected!!');
            }
          }).catch((error) => {
            console.log(' error in getting state of ble-device in Growarea ', error);
          })
          this.setState({
            registrationModalVisible: false,
          });
        } catch (error) {
          console.log(' error in try catch block ', error);

        }

      }
    }
  }

  scanAndConnect() {
    let discoveredGateways = {}
    console.log("Scanning devices:");
    if (this.props.bleManager) {
      console.log("Scanning devices:1");
      this.props.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Scanning devices:" + 2);
          this.setState({ modalVisible: false });
          if (error.errorCode === 101) {
            //Device is not authorized to use BluetoothLE
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please provide access.')
            }
            else {
              Promise.resolve(requestLocationPermission())
                .then(sources => {
                  this.showGatewayDiscoveryModal(true);
                  return;
                }).catch(error => {
                  alert(error);
                });
            }
          }
          else if (error.errorCode === 601) {
            //Location services are disabled
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please enable it.')
              this.showGatewayDiscoveryModal(false);
            }
            else {
              RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
                .then(data => {
                  this.showGatewayDiscoveryModal(true);
                  return;
                }).catch(error => {
                  this.showGatewayDiscoveryModal(true);
                  return;
                });
            }
          }
          else {
            alert(error.errorCode + ":" + error.message);
          }
          return;
        }
        console.log("Scanning devices:3 chnage", device.name);
        if (device.name && device.name.startsWith(gateway_discovery_name_prefix) && device.name && !(this.alreadyRegistredGateways.includes(device.id))) {
          let preLength = Object.keys(discoveredGateways).length;
          discoveredGateways[device.id] = device;
          let latestLength = Object.keys(discoveredGateways).length;
          if (preLength < latestLength) {
            console.log("Name:" + device.name + "\nMac address:" + device.id);
            this.setState({ discoveredGateways: discoveredGateways })
            console.log('device found so stop interval and scanning');
          }
        }
      });
    }
  }

  scanAndConnectForDeleteGateway() {
    let timerStartedCount=0;
    let discoveredGateways = {}
    payload=[{'gatewayId':this.state.gatewayId,'deviceType':'gateway'}]
    console.log("Scanning devices:");
    if (this.props.bleManager) {
      console.log("Scanning devices:1");
      if(timerStartedCount==0){
        this.timeoutValue= setTimeout(() => {
           console.log("set timeout called");
           this.props.bleManager.stopDeviceScan();
           this.props.uiStopLoading();
           Alert.alert('Gateway is not reachable at this time.','Factory reset will be required after deletion Are you sure want to do Force delete of Gateway?',
                [
                 {
                   text: 'Cancel', onPress: () => {
                     console.log('delete operation was canceled.');
                   }, style: 'cancel'
                 },
                 {
                   text: 'Delete', onPress: async() => {
                    this.props.uiStartLoading("Deleting gateway from AWS cloud..");
                    let url = Urls.DELETE_GROWAREA;
                    console.log("payload for gateway delete ---:"+JSON.stringify(payload));
                    try{
                          const response = await fetch(url,{ method: "POST",headers: {'Accept': 'application/json','Content-Type' : 'application/json' },
                                  body: JSON.stringify(payload)})
                          console.log("res---"+JSON.stringify(response));
                          if(response.ok)
                          {
                            const msg = await response.json();
                            console.log("response in json---"+msg);
                            this.props.uiStopLoading();
                            this.setGatewayAfterDeletion(this.state.gatewayId);
                            alert("Gateway deleted successfully from AWS cloud. Need to Factory reset");
                          }
                          else
                          {
                            this.props.uiStopLoading();
                            alert("error received from AWS API");
                          }
                    }catch(err)
                    {
                      this.props.uiStopLoading();
                      alert(err.message);
                    }

                   }
                 },
               ],
               { cancelable: true }
             ) 
         }, 60000);
       }
       timerStartedCount++;
      this.props.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Scanning devices:" + 2);
          this.setState({ modalVisible: false });
          if (error.errorCode === 101) {
            //Device is not authorized to use BluetoothLE
            if (Platform.OS === 'ios') {
              this.props.uiStopLoading();
              alert(appName + ' app wants to use location services.. please provide access.')
            }
            else {
              Promise.resolve(requestLocationPermission())
                .then(sources => {
                  this.props.uiStopLoading();
                  this.showGatewayDiscoveryModal(false);
                  return;
                }).catch(error => {
                  this.props.uiStopLoading();
                  alert(error);
                });
            }
          }
          else if (error.errorCode === 601) {
            //Location services are disabled
            if (Platform.OS === 'ios') {
              this.props.uiStopLoading();
              alert(appName + ' app wants to use location services.. please enable it.')
              this.showGatewayDiscoveryModal(false);
            }
            else {
              RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
                .then(data => {
                  this.props.uiStopLoading();
                  this.showGatewayDiscoveryModal(false);
                  return;
                }).catch(error => {
                  this.props.uiStopLoading();
                  this.showGatewayDiscoveryModal(false);
                  return;
                });
            }
          }
          else {
            this.props.uiStopLoading();
            alert(error.errorCode + ":" + error.message);
          }
          return;
        }
        console.log("Scanning devices:3 chnage", device.name);
        console.log("Scanning devices:3 chnage", device.id);
        console.log("already discovered devices--"+this.alreadyRegistredGateways);
        
        if (device.name && device.name.startsWith(gateway_discovery_name_prefix) && device.name && (this.alreadyRegistredGateways.includes(device.id))) {
          let preLength = Object.keys(discoveredGateways).length;
          discoveredGateways[device.id] = device;
          let latestLength = Object.keys(discoveredGateways).length;
          if (preLength < latestLength) {
            console.log("Name:" + device.name + "\nMac address:" + device.id);
            this.setState({ discoveredGateways: discoveredGateways })
            this.props.bleManager.stopDeviceScan();
            clearTimeout(this.timeoutValue);
            console.log('device found so stop timeout and scanning');
            this.props.uiStopLoading();
            this.deleteGatewayAPI(payload,device);

          }
        }  
            
      });
    }
  }

setGatewayAfterDeletion(gatewayId)
{
  let gateways=this.state.gateways;
  let filteredList = gateways.filter((item) => item.gatewayId !== gatewayId);
  AsyncStorage.setItem('listGateway',JSON.stringify(filteredList)).then(() => {
    this.setState({gateways:filteredList});
    }).catch((error) => {
            console.log('error in saving list of gateway to storage', error);

        })
    let sensors=this.state.sensors;
    let filteredSensorList = sensors.filter((item) => item.gatewayId !== gatewayId);
    AsyncStorage.setItem('sensorList',JSON.stringify(filteredSensorList)).then(() => {
    this.setState({sensors:filteredSensorList});
     }).catch((error) => {
         console.log('error in saving list of sensors to  local storage', error);
        })

}

async deleteGatewayAPI(payload,device)
{
  this.props.uiStartLoading("Deleting gateway from AWS cloud..");
  let url = Urls.DELETE_GROWAREA;
  console.log("payload for gateway delete ---:"+JSON.stringify(payload));
  try{
        const response = await fetch(url,{ method: "POST",headers: {'Accept': 'application/json','Content-Type' : 'application/json' },
                body: JSON.stringify(payload)})
        console.log("res---"+JSON.stringify(response));
        if(response.ok)
        {
          const msg = await response.json();
          console.log("response in json---"+msg);
          this.props.uiStopLoading();
          this.setGatewayAfterDeletion(this.state.gatewayId);
          this.gatewayRegisterClickHandlerForDeleteGateway(device);
        }
        else
        {
          this.props.uiStopLoading();
          alert("error received from AWS API");
        }
      }catch(err)
      {
        this.props.uiStopLoading();
        alert(err.message);
      }
  }

  sendGatewayDeletionPayload()
  {
    let payload = [
      {
      macAddress: this.state.gatewayUId,
      deviceType: "gateway",
      }
    ]; 
  console.log("Checking characristics for send payload to BLE");
  console.log("UId:" + this.state.gatewayUId);
  var gatewayRegCharFound = false;
  Object.keys(this.gatewayCharacteristics[this.state.gatewayUId]).every((characteristicPrefix) => {
    console.log(characteristicPrefix, Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_DELETION);
    console.log(characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_DELETION);
    if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_DELETION) {
      gatewayRegCharFound = true;
      this.writeCharacteristics(this.gatewayCharacteristics[this.state.gatewayUId][characteristicPrefix], payload, (this.gatewayCharacteristics[this.state.gatewayUId].mtu - 3), 'gatewayInfo')
      alert('Gateway deleted successfully..');
      this._onRefresh();
    } else {
      return true;
    }
  });
  }

  gatewayRegisterClickHandlerForDeleteGateway = (bleGateway) => {
    console.log('register called in register delete click handler', bleGateway);
    this.bleDevice = bleGateway;
    //this.props.bleManager.stopDeviceScan();
    if (Platform.OS === 'android') {
      this.setState({
        gatewayName: bleGateway.name,
        gatewayUId: bleGateway.id,
        growAreaType: {},
        gatewayDescription: 'My Description',
        registrationModalVisible: true,
        bleMessage: 'Connecting to device..',
        bleError: '',
        gatewayMacId: bleGateway.id,
        waitingForGatewayLoader: false
      })
      console.log("gatewayMacId set");
    }
    this.connectAndDiscoverCharacteristicsForDeleteGateway(bleGateway);
  }


  connectAndDiscoverCharacteristicsForDeleteGateway(device) {
    console.log("in device connection function");
    this.errorCode = 0;
    device.connect()
      .then((device) => {
        this.errorCode = 1;
        this.props.onSignoutDisconnectFromGrowarea(device);
        this.setState({
          registrationModalVisible: true,
          bleMessage: 'Discovering services and characteristics',
          bleError: ''
        })
        console.log("Discovering services and characteristics");
        this.props.onAddDevice(device);
        return device.discoverAllServicesAndCharacteristics()
      })
      .then((device) => {
        console.log("in discover charactristic function----");
        console.log("DeviceId:" + device.id);
        this.gatewayCharacteristics[device.id] = {};
        this.gatewayCharacteristics[device.id]['mtu'] = device.mtu;
        console.log("GatewayChars:" + this.gatewayCharacteristics);
        device.services().then(services => {
          services = services.filter(this.isKnownService);
          console.log("Known Services size:" + services.length)
          if (services.length === 0) {
            console.log("No known services found in connected device.");
            this.setState({
              bleMessage: '',
              bleError: 'Required services not found. Disconnecting from device..'
            })
            device.cancelConnection();
          }
          else {
            this.setState({
              bleMessage: 'Services discovered..',
              bleError: ''
            })
          }
          services.forEach((service, i) => {
            service.characteristics().then(characteristics => {
              console.log("Service UUID:" + service.uuid);
              console.log("Initial characteristics size:" + characteristics.length);
              characteristics = characteristics.filter((characteristic) => {
                characteristicPrefix = this.isKnownCharacteristic(characteristic);
                if (characteristicPrefix) {
                  if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_DELETION) {
                    this.readCharacteristics(characteristic).then((e) => {
                    }).catch((e) => {
                      console.log('error in reading char.......', e);
                    })
                  }

                  console.log("Characteristics UUID:" + characteristic.uuid);
                  this.gatewayCharacteristics[device.id][characteristicPrefix] = characteristic;
                  return true;
                }
              });
              console.log("After filtering characteristics size:" + characteristics.length);

              if (i === services.length - 1) {
                console.log("GatewayCharacteristics List:", Object.keys(this.gatewayCharacteristics[device.id]));
                const dialog = Object.values(this.gatewayCharacteristics[device.id]).find(
                  characteristic => characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse
                )
                if (!dialog) {
                  console.log("No writable characteristic");
                  this.setState({
                    bleMessage: '',
                    bleError: 'Required characteristics not found. Disconnecting from device..'
                  })
                  device.cancelConnection();
                }
                else {
                  this.setState({
                    bleMessage: 'Characteristics discovered..',
                    bleError: ''
                  })
                  console.log("Opening registration modal..")
                  this.setRegistrationModalVisible(false);
                  this.sendGatewayDeletionPayload();
                }
              }
            })
          })
        }).catch((error) => {
          console.log('error in finding service');
        })
        this.reteyConnection = 0;
      })
      .catch((error) => {
        if (error.errorCode === 203) {
          device.cancelConnection().then(() => {
            this.connectAndDiscoverCharacteristicsForDeleteGateway(device);
            console.log("Reconnecting to device.." + error.message);
          }).catch((e) => {
            console.log("Reconnecting to device Error" + e.message);

          });
        } else if (error.errorCode === 201) {
          console.log('in retry connection', this.reteyConnection);
          if (this.reteyConnection < 3) {
            this.connectAndDiscoverCharacteristicsForDeleteGateway(device);
          } else {
            this.reteyConnection = 0;
            this.setState({
              registrationModalVisible: false,
              bleMessage: '',
              bleError: 'Error: Unable to connect to Gateway. Please try adding Gateway again.'
            })
            console.log(error);
            console.log(error.errorCode);
            device.cancelConnection().catch(error => {
              console.log("Device is already disconnected." + error.message);
            });
          }
          this.reteyConnection = this.reteyConnection + 1;
        }
        else {
          this.setState({
            registrationModalVisible: false,
            bleMessage: '',
            bleError: 'Error: Unable to connect to Gateway. Please try adding Gateway again.'
          })
          console.log(error);
          console.log(error.errorCode);
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
          });
        }
      }).catch((error) => {
        console.log('error in connectAndDiscoverCharacteristics', error);
      });
  }


  connectAndDiscoverCharacteristics(device) {
    this.errorCode = 0;
    device.connect()
      .then((device) => {
        this.errorCode = 1;
        this.props.onSignoutDisconnectFromGrowarea(device);
        this.setState({
          registrationModalVisible: true,
          bleMessage: 'Discovering services and characteristics',
          bleError: ''
        })
        console.log("Discovering services and characteristics");
        this.props.onAddDevice(device);
        return device.discoverAllServicesAndCharacteristics()
      })
      .then((device) => {
        console.log("DeviceId:" + device.id);
        this.gatewayCharacteristics[device.id] = {};
        this.gatewayCharacteristics[device.id]['mtu'] = device.mtu;
        console.log("GatewayChars:" + this.gatewayCharacteristics);
        device.services().then(services => {
          services = services.filter(this.isKnownService);
          console.log("Known Services size:" + services.length)
          if (services.length === 0) {
            console.log("No known services found in connected device.");
            this.setState({
              bleMessage: '',
              bleError: 'Required services not found. Disconnecting from device..'
            })
            device.cancelConnection();
          }
          else {
            this.setState({
              bleMessage: 'Services discovered..',
              bleError: ''
            })
          }
          services.forEach((service, i) => {
            service.characteristics().then(characteristics => {
              console.log("Service UUID:" + service.uuid);
              console.log("Initial characteristics size:" + characteristics.length);
              characteristics = characteristics.filter((characteristic) => {
                characteristicPrefix = this.isKnownCharacteristic(characteristic);
                if (characteristicPrefix) {
                  if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID) {
                    this.readCharacteristics(characteristic).then((e) => {
                    }).catch((e) => {
                      console.log('error in reading char.......', e);
                    })
                  }

                  console.log("Characteristics UUID:" + characteristic.uuid);
                  this.gatewayCharacteristics[device.id][characteristicPrefix] = characteristic;
                  return true;
                }
              });
              console.log("After filtering characteristics size:" + characteristics.length);

              if (i === services.length - 1) {
                console.log("GatewayCharacteristics List:", Object.keys(this.gatewayCharacteristics[device.id]));
                const dialog = Object.values(this.gatewayCharacteristics[device.id]).find(
                  characteristic => characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse
                )
                if (!dialog) {
                  console.log("No writable characteristic");
                  this.setState({
                    bleMessage: '',
                    bleError: 'Required characteristics not found. Disconnecting from device..'
                  })
                  device.cancelConnection();
                }
                else {
                  this.setState({
                    bleMessage: 'Characteristics discovered..',
                    bleError: ''
                  })
                  console.log("Opening registration modal..")
                  this.setRegistrationModalVisible(true);
                }
              }
            })
          })
        }).catch((error) => {
          console.log('error in finding service');

        })
        this.reteyConnection = 0;
      })
      .catch((error) => {
        if (error.errorCode === 203) {
          device.cancelConnection().then(() => {
            this.connectAndDiscoverCharacteristics(device);
            console.log("Reconnecting to device.." + error.message);
          }).catch((e) => {
            console.log("Reconnecting to device Error" + e.message);

          });
        } else if (error.errorCode === 201) {
          console.log('in retry connection', this.reteyConnection);
          if (this.reteyConnection < 3) {
            this.connectAndDiscoverCharacteristics(device);
          } else {
            this.reteyConnection = 0;
            this.setState({
              registrationModalVisible: true,
              bleMessage: '',
              bleError: 'Error: Unable to connect to Gateway. Please try adding Gateway again.'
            })
            console.log(error);
            console.log(error.errorCode);
            device.cancelConnection().catch(error => {
              console.log("Device is already disconnected." + error.message);
            });
          }
          this.reteyConnection = this.reteyConnection + 1;
        }
        else {
          this.setState({
            registrationModalVisible: true,
            bleMessage: '',
            bleError: 'Error: Unable to connect to Gateway. Please try adding Gateway again.'
          })
          console.log(error);
          console.log(error.errorCode);
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
          });
        }
      }).catch((error) => {
        console.log('error in connectAndDiscoverCharacteristics', error);
      });
  }

  isKnownService(service) {
    console.log("service.uuid", service.uuid);

    return Object.values(Constant.KNOWN_BLE_SERVICES)
      .find(knownServicePrefix => service.uuid.startsWith(knownServicePrefix));
  }

  isKnownCharacteristic(characteristic) {
    characteristicPrefix = '';
    Object.values(Constant.KNOWN_BLE_CHARACTERISTICS)
      .find(knownCharPrefix => {
        if (characteristic.uuid.startsWith(knownCharPrefix)) {
          characteristicPrefix = knownCharPrefix;
          return true;
        }
        return false;
      });
    console.log('characteristicPrefix:' + characteristicPrefix);
    return characteristicPrefix;
  }

  readCharacteristics(characteristic) {
    return new Promise((resolve, reject) => {
      characteristic.read().then((response) => {
        console.log('=================> read file', response.value, Base64.atob(response.value));
        let version = Base64.atob(response.value).toString();
        version = version.replace(/\0/g, '')
        this.setState({ seleneVersion: version })
        console.log('version================================', version, typeof (version));
        resolve(response)
      }).catch((error) => {
        console.log('error in reading file from ble', error);
        reject(' Error in reading from ble ' + error)
      })
    })
  }

  
   handleProvisionCallbackNotifications (gatewayProvisionCallbackChar, Gatewaypayload) {
    console.log("Subscribing to provision callback characteristic..");
    let validPayload = '';
    this.provisionCallbackCharSubscription = gatewayProvisionCallbackChar.monitor((error, characteristic) => {
      console.log('hello msg');

      if (error) {
        console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverGatewayProvisionCallbackNotificationSubscription');
        if (this.state.errorCode === 1) {
          console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverGatewayProvisionCallbackNotificationSubscription');
        } else {
          this.setState({ errorCode: 1 });
        }
      }
      else {
        let message = Base64.atob(characteristic.value);
        console.log("GatewayProvisionCallbackMessage:" + message);
        if (message === Constant.BLE_PAYLOAD_PREFIX){
            validPayload = ''; 
            console.log("Got begin payload"+validPayload);
          }
        else if (message === Constant.BLE_PAYLOAD_SUFFIX) {
          console.log("payload before--"+validPayload);
            if (isJsonString(validPayload)) {
              let payload = JSON.parse(validPayload);
              console.log("Got end payload");
              if(payload['result']===Constant.BLE_RESPONSE_STATUS)
              {
                this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_PROCESS_COMPLETE);
                gateways =this.state.gateways;
                Gatewaypayload[0]['gatewayId']=payload['gatewayId'];
                gateways.push(Gatewaypayload[0]);
                AsyncStorage.setItem('listGateway',JSON.stringify(gateways)).then((token) => {
                    this.setState({gateways});
                    }).catch((error) => {
                            console.log('error in saving name', error);
                        })
                alert(payload['statusMessage']);
              }else
              {
                    alert(payload['statusMessage']);
              }
            }
            else {
              console.log("Invalid JSON:" + validPayload);
              validPayload = '';
            }
            validPayload = '';
          }
        else {
            console.log("Got JSON payload ");
            validPayload = validPayload + message;
            console.log("before append payload-"+validPayload);
            console.log("after apend-"+validPayload);
          }
      }
    }, 'myGatewayProvisionCallbackTransaction');
  }



  writeCharacteristics(characteristic, payload, chunkSize, info) {
    console.log("type of", typeof (payload));
    if (typeof (payload) === 'object') {
      payload = JSON.stringify(payload);
    }
    console.log("payload before write-------"+payload);
    console.log("Writing " + payload.length + " bytes to " + characteristic.uuid + " for " + info);
    characteristic.writeWithResponse(Base64.btoa(Constant.BLE_PAYLOAD_PREFIX)).catch(error => {
      console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);

      if (this.reSendingPayloadCount < 3) {
        this.errorCode = 1;
        this.reSendingPayloadCount++;
        console.log('------------retry count--------', this.reSendingPayloadCount);

        this.writeCharacteristics(characteristic, payload, chunkSize, info);
      } else {
        this.reSendingPayloadCount = 0
        this.props.onUpdateRegistrationState(RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL);
        this.showGatewayDiscoveryModal(false);
        this.setRegistrationModalVisible(false, true);
        Alert.alert('Provisioning Gateway Failed.', 'Please try again.');
      }

    });
    for (var k = 0; k < (payload.length / chunkSize); k++) {
      var str = payload.substring(k * chunkSize, ((k + 1) * chunkSize));
      console.log(str);
      characteristic.writeWithResponse(Base64.btoa(str), info + k).catch(error => {
        console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
        if (this.errorCode == 1) {
          console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
        } else {
          if (this.reSendingPayloadCount < 3) {
            this.errorCode = 1;
            this.reSendingPayloadCount++;
            console.log('------------retry count--------', this.reSendingPayloadCount);

            this.writeCharacteristics(characteristic, payload, chunkSize, info);
          } else {
            this.reSendingPayloadCount = 0
            this.props.onUpdateRegistrationState(RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL);
            this.showGatewayDiscoveryModal(false);
            this.setRegistrationModalVisible(false, true);
            Alert.alert('Provisioning Gateway Failed.', 'Please try again.');
          }
        }
      });
    }
    characteristic.writeWithResponse(Base64.btoa(Constant.BLE_PAYLOAD_SUFFIX), info + '$').catch(error => {
      console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
      if (this.errorCode == 1) {
        console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);

      } else {
        if (this.reSendingPayloadCount < 3) {
          this.errorCode = 1;
          this.reSendingPayloadCount++;
          console.log('------------retry count--------', this.reSendingPayloadCount);

          this.writeCharacteristics(characteristic, payload, chunkSize, info);
        } else {
          this.reSendingPayloadCount = 0
          this.props.onUpdateRegistrationState(RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL);
          this.showGatewayDiscoveryModal(false);
          this.setRegistrationModalVisible(false, true);
          Alert.alert('Provisioning Gateway Failed.', 'Please try again.');
        }
      }
    }).then(() => {
      if (this.errorCode === 1) {
        console.log('code 1');
      } else {
        this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_STARTED_TO_INTERNAL_CLOUD);
        console.log('------------payload', this.props.internalCloudePayload);
        console.log('-------------ble', this.bleDevice);
      }
    });
  }

  onViewDevices(growArea) {
    console.log("enter into device function");
    this.props.bleManager.destroy()
    this.props.onSetBleManager(new BleManager());

    Navigation.push(this.props.componentId, {
      component: {
        name: 'DevicesScreen',
        passProps: {
          selectedGrowArea: {
            id: growArea.gatewayId,
            name: growArea.gatewayName,
            macId: growArea.macAddress,
          },
          gateway: growArea,
        },
        options: {
          topBar: {
            title: {
              text: growArea.gatewayName
            }
          }
        }
      }
    });

  }

  getGatewayList()
  {
    AsyncStorage.getItem('listGateway').then(response => {
      gateways=JSON.parse(response)
      this.setState( { gateways})

    }).catch((e) => {
      console.log('error in geting asyncStorage\'s item:', e.message);
    })
     return this.state.gateways; 
  }

  onClearSearch = () => {
    console.log('searrch bar cleared!!');

  }

  alreadyRegistredGateway(registeredGateway) {
    try {
      console.log('data-0=0-0-------------------=-0-=0=-0-=0=-0=-0=-0=-0=-', registeredGateway);
      var data = []
      if (registeredGateway != undefined) {
        console.log("data", registeredGateway.length);

        registeredGateway.map((gateway) => {
          console.log('gateway maccc id', gateway.macAddress);

          console.log('mac id', gateway.macAddress);
          data.push(gateway.macAddress);
        });
        this.setState({ isGotAlreadyRegistredGateway: true })
        return data;
      }
      this.setState({ isGotAlreadyRegistredGateway: true })
      return [];
    } catch (e) {
      this.setState({ isGotAlreadyRegistredGateway: false })
      console.log('error in alreadyRegistered data', e);
      Alert.alert('Alert', 'Failed to get already provisioned gateway\'s list. Please try again.');
    }
  }


  shouldComponentUpdate(nextProps, nextState) {
    return (this.visible);
  }


  onSelectedItemsChange = selectedUsers => {
    console.log("OnSelectedItemsChange called");
    this.setState({ selectedUsers });
    console.log(selectedUsers);
  };

  render() {

    if (this.props.retry401Count === 20 && !this.state.enabled401) {
      this.setState({ modalVisible: false, registrationModalVisible: false, enabled401: true })
    }

    if (this.props.isGatewayDeleted) {
      console.log('-------------------');
      this._onRefresh();
      this.props.onGatewayDeletionResponse(false);
    }

    if (this.props.registrationState === RegistrationStates.REGISTRATION_PROCESS_COMPLETE) {
      this.setState({ modalVisible: false, registrationModalVisible: false })
      this._onRefresh();
      this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_NOT_STARTED);
    }
   // let containerId = this.state.containerId;
    // let listData = this.getListData() || [];
    let listData = this.getGatewayList() || [];
    
    let growAreasList = (
      <FlatList
        data={listData}
        renderItem={({ item, index }) => (
          <View style={(index === listData.length - 1) ? [styles.listItem, {
            borderBottomWidth: 2
          }] : styles.listItem}>
            <View style={{ width: '80%' }}>
              <TouchableOpacity onPress={() => {this.onViewDevices(item) }}>
                <View style={{}}>
                  <Text style={{ fontWeight: 'bold' }} >{item.gatewayName}</Text>
                  <Text style={{}}>{item.macAddress}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1, height: 35 }} onPress={() => { }} />
            <View style={{ flexDirection: 'row' }}>
              {/* <Icon name="wifi" size={24} style={item.latest_heartbeat_timestamp === 'true' ? { paddingRight: 10, color: Constant.PRIMARY_COLOR } : { paddingRight: 10, color: 'red' }} /> */}
              <Icon name="delete" size={24} style={{ paddingRight: 10, color: 'grey' }} onPress={() => {
                  Alert.alert('Delete gateway', 'Are you sure you want to delete ' + item.gatewayName + '?'+' All the sensor provision with this gateway will also get deleted',
                    [
                      {
                        text: 'Cancel', onPress: () => {
                          console.log('delete operation was canceled.');
                        }, style: 'cancel'
                      },
                      {
                        text: 'Delete', onPress: async() => {
                          this.alreadyRegistredGateways = await this.alreadyRegistredGateway(this.state.gateways);
                          this.showGatewayDiscoveryModalForDeleteGateway(true);
                          this.setState({gatewayId:item.gatewayId});
                        }
                      },
                    ],
                    { cancelable: true }
                  ) 
                 
              }} />
            </View>
          </View>
        )}
       keyExtractor={(item) => item.gatewayId}
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
      //growAreasList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
      growAreasList=(
            <View style={styles.activityIndicator}>
              <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /><Text style={{ margin: 4, fontWeight: "bold" }}>{this.props.isMessage}</Text>
             </View>
           );
    } else if (listData.length === 0) {
      growAreasList = (
        <ScrollView contentContainerStyle={styles.activityIndicator}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
              colors={['red', 'green', 'blue']}
            />
          }>
          <Text color="#00ff00">No Gateway found.</Text>
        </ScrollView>
      );
    }

    let gatewayDiscoveryContainer = (
      <View style={styles.scanContainer}>
        <Image
          source={require('../../assets/images/scan.png')}
          style={styles.scanImage}
        />
        <Text style={styles.scanText}> Searching For Available Gateways Over BLE</Text>
      </View>
    );

    let gatewayListSize = Object.keys(this.state.discoveredGateways).length;

    if (gatewayListSize > 0) {
      gatewayDiscoveryContainer = (
        <View style={styles.gatewayListContainer}>
          <View style={{ alignItems: "center", marginBottom: 6 }}><Text>{gatewayListSize} {gatewayListSize === 1 ? 'Gateway' : 'Gateways'} found</Text></View>
          <FlatList
            data={Object.values(this.state.discoveredGateways)}
            renderItem={(info) =>
              (
                <View style={styles.gatewayItem}>
                  <Image
                    source={require('../../assets/images/device_48.png')}
                    style={styles.gatewayIcon}
                  />
                  <View style={{ flexDirection: 'column', width: '30%', marginLeft: 5, marginRight: 5 }}>
                    <Text style={{ fontSize: 7 }}>Name</Text>
                    <Text style={{ fontSize: 12 }}>{info.item.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'column', width: '30%' }}>
                    <Text style={{ fontSize: 7 }}>UId</Text>
                    <Text style={{ fontSize: 10 }}>{info.item.id}</Text>
                  </View>
                  <TouchableOpacity style={[styles.roundButton, styles.registerButton]} onPress={() => {
                    this.gatewayRegisterClickHandler(info.item);

                  }}>
                    <Text style={[styles.buttonText, { fontSize: 10 }]}>REGISTER</Text>
                  </TouchableOpacity>
                </View>
              )}
            keyExtractor={(item) => item.id.toString()}
          />
          <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.showGatewayDiscoveryModal(false)}>
            <Text style={styles.buttonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      );
    }

    

    let gatewayDetailsContainer = (
      <ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, padding: 10, borderBottomWidth: 1 }}> Register Gateway </Text>
        <ScrollView contentContainerStyle={styles.inputContainer}>
          
          <TextField label='Gateway Name' onChangeText={(gatewayName) => this.setState({ gatewayName })} value={this.state.gatewayName} labelHeight={18} />
          <TextField label='Description' onChangeText={(gatewayDescription) => this.setState({ gatewayDescription })} value={this.state.gatewayDescription} labelHeight={18} />
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10 }}>
          <Button title="Cancel" onPress={() => this.setRegistrationModalVisible(false, true)} />
          <Button onPress={
            this.gatewayRegisterSubmitClickHandler
          } title="Submit" />
        </View>
      </ScrollView>
    );

    if (this.props.registrationState && this.props.registrationState !== 0) {
      stateIndicator = (<ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />);
      if (this.props.registrationState === RegistrationStates.REGISTRATION_FAILED_TO_ARROW ||
        this.props.registrationState === RegistrationStates.FETCHING_CONFIG_FROM_ARROW_FAILED ||
        this.props.registrationState === RegistrationStates.REGISTRATION_FAILED_TO_INTERNAL_CLOUD ||
        this.props.registrationState === RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL) {
        stateIndicator = (<Button title="Retry" onPress={() => {//this.retryRegistration()
          this.setState({ registrationModalVisible: false, containerId: '', facilityId: '' })
        }} />);
      } else if (this.props.registrationState === RegistrationStates.FETCHING_CONFIG_FROM_ARROW_SUCCESS) {
        console.log("REGISTRATION_SUCCESS_TO_INTERNAL_CLOUD");
        this.props.onUpdateRegistrationState(RegistrationStates.SENDING_PAYLOAD_TO_GATEWAY)
        let payload = [
            {
            gatewayName: this.state.gatewayName,
            macAddress: this.state.gatewayUId,
            userId: JSON.parse(this.state.email) ,
            deviceType: "gateway",
            description:this.state.gatewayDescription
          
          }
      ]; 
        console.log("REGISTRATION_SUCCESS_TO_INTERNAL_CLOUD2");
        console.log("UId:" + this.state.gatewayUId);
        var gatewayRegCharFound = false;
        Object.keys(this.gatewayCharacteristics[this.state.gatewayUId]).every((characteristicPrefix) => {
          console.log(characteristicPrefix, Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID);
          console.log(characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID);
          if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID) {
            gatewayRegCharFound = true;
            this.writeCharacteristics(this.gatewayCharacteristics[this.state.gatewayUId][characteristicPrefix], payload, (this.gatewayCharacteristics[this.state.gatewayUId].mtu - 3), 'gatewayInfo')
            this.handleProvisionCallbackNotifications(this.gatewayCharacteristics[this.state.gatewayUId][characteristicPrefix],payload);

          } else {
            return true;
          }
        });
        if (!gatewayRegCharFound) {
          alert("Gateway registration service not found in connected gateway.");
        }
      }

      gatewayDetailsContainer = (
        <View style={{ alignItems: "center", margin: 10 }}>
          {stateIndicator}
          <Text style={{ margin: 4, fontWeight: "bold" }}>{this.getRegistrationMessage(this.props.registrationState)}</Text>
        </View>
      );
    }

    if (this.state.bleMessage || this.state.bleError) {
      stateIndicator = (<ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />);
      message = this.state.bleMessage;
      if (this.state.bleError) {
        stateIndicator = (<View />);
        message = this.state.bleError;
      }
      gatewayDetailsContainer = (
        <View style={{ alignItems: "center", margin: 10 }}>
          {stateIndicator}
          <Text style={{ margin: 4, fontWeight: "bold" }}>{message}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.greenBackgroundContainer} />
        <View style={styles.listContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.listTitle}> Gateway</Text>
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
            <TouchableOpacity style={[styles.roundButton, styles.addNewButton]} onPress={async () => {
              this.props.bleManager.destroy()
              this.props.onSetBleManager(new BleManager());
              this.showGatewayDiscoveryModal(true)
              console.log('already provisioned gateways', this.props.alreadyProvisionedGateway.length);
              this.alreadyRegistredGateways = await this.alreadyRegistredGateway(this.state.gateways)
              this.setState({ discoveredGateways: {}, waitingForGatewayLoader: true, bleMessage: '', bleError: '' })
            }
            }>
              <Text style={styles.buttonText}>Add New</Text>
            </TouchableOpacity>
          </View>
          {this.state.searching && (listData.length > 0 || this.state.filterKey.length > 0) &&
            <SearchBar
              ref={search => this.search = search}
              lightTheme
              value={this.state.filterKey}
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search gateway...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2, maxHeight: 34 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR, maxHeight: 34 }}
              inputStyle={{ fontSize: 16 }} />
          }
          {growAreasList}
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible && (this.props.registrationState !== RegistrationStates.REGISTRATION_PROCESS_COMPLETE)}
          onRequestClose={() => {
            this.showGatewayDiscoveryModal(false);
          }}
        >
          <View style={styles.fullModalContainer}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalTitle, { width: '100%', justifyContent: 'space-between' }]}>
                <Image
                  source={require('../../assets/images/add_24.png')}
                  style={styles.modalTitleAddButton}
                />

                <Text> Discover New Gateways </Text>
                {this.state.waitingForGatewayLoader ? <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} style={{
                  alignSelf: 'flex-end',
                  justifyContent: 'center',
                  height: 30,
                  width: 30,
                  borderRadius: 15,
                  margin: 15
                }} /> : <View />}
              </View>
              {gatewayDiscoveryContainer}
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.registrationModalVisible && (this.props.registrationState !== RegistrationStates.REGISTRATION_PROCESS_COMPLETE)}
          onRequestClose={() => {
            this.setRegistrationModalVisible(false, true);
          }}
        >
          <View style={styles.fullModalContainer}>
            <View style={styles.registrationModalContainer}>
              {gatewayDetailsContainer}
            </View>
          </View>
        </Modal>
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

mapStatesToProps = state => {
  this.connectedBleGrowarea = state.ble.bleManager;

  return {
    growareas: state.root.growareas,
    //growAreaTypes: state.root.growAreaTypes,
    //facilities: state.root.facilities,
   // containers: state.root.containers,
    //containersByFacilityId: state.root.containersByFacilityId,
   // growareasByContainerId: state.root.growareasByContainerId,
    isLoading: state.ui.isLoading,
    isMessage: state.ui.isMessage,
    registrationState: state.ui.registrationState,
   // gatewayHId: state.root.gatewayHId,
   // apiKey: state.root.apiKey,
   // apiSecretKey: state.root.apiSecretKey,
    bleManager: state.ble.bleManager,
    users: state.root.users,
    alreadyProvisionedGateway: state.root.allProvisionedGateways,
    internalCloudePayload: state.ble.payLoadForInternalCloud,
    isGatewayDeleted: state.gateway.isGatewayDeleted,
    retry401Count: state.auth.retry401Count


  }
};

mapDispatchToProps = dispatch => {
  return {
  onUpdateRegistrationState: (state) => dispatch(uiUpdateRegistrationState(state)),
  //onGetContainers: (facilityId, inBackground, showAlert) => {},
  onAddDevice: (device) => dispatch(addBleDevice(device)),
  onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
  onSignoutDisconnectFromGrowarea: (device) => dispatch(removeBleDevicefromGrowarea(device)),
  onGetAllGateways: (token, containerId, inBackground, appleKey) => {},
  onDeleteGateway: (payload) => dispatch(deleteGateway(payload)),
  onGatewayDeletionResponse: (flag) => dispatch(deleteGatewayResponse(flag)),
  uiStartLoading : (message) => dispatch(uiStartLoading(message)),
  uiStopLoading : () => dispatch(uiStopLoading())
  }
};

async function requestLocationPermission() {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    {
      'title': appName + ' Location Permission',
      'message': appName + ' App needs access to your location ' +
        'for bluetooth operations.'
    }
  )
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("You can use the location")
    return;
  } else {
    console.log("Location permission denied")
    throw new Error('Location permission denied');
  }
}

function isJsonString(str) {
  try {
  JSON.parse(str);
  } catch (e) {
  return false;
  }
  return true;
 }

export const disconnectBleinGrowarea = () => {
  this.connectedBleGrowarea.destroy()
}

export default connect(mapStatesToProps, mapDispatchToProps)(GrowAreas);