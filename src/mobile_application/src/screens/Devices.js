import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, KeyboardAvoidingView,
  TouchableOpacity, Image, Modal, Platform, Alert, PermissionsAndroid, TextInput,
  ScrollView, Picker, AsyncStorage

} from 'react-native';
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import { displayName as appName, debug, bleDebug, liveChartDebug, deviceDiscoveryTimeout } from './../../app.json';
import { connect } from 'react-redux';
import { BleManager } from 'react-native-ble-plx';
import {
  setBleManager, addBleDevice, removeBleDevice, authSetUser,uiStartLoading,uiStopLoading,removeBleDevicefromDevice
} from '../store/actions/rootActions';


import _ from 'lodash';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import Base64 from './../utils/Base64';
import CheckBox from 'react-native-check-box';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Navigation } from 'react-native-navigation';

class Devices extends Component {

  static get options() {
    return {
      ...Constant.DEFAULT_NAVIGATOR_STYLE,
      leftButtons: [
        {
          id: 'buttonOne',
          icon: require('../../assets/images/containers.png')
        }
      ],
    };
  }
  deviceCharacteristics = {};
  connectedDevices = [];
  device = null;
  discoverCharSubscription = null;
  provisionCallbackCharSubscription = null;
  visible = false;
  provisionRequestSent = false;
  connectedBle = null;
  deviceConectivityCharFound = false;
  deviceNotificationChar = null;
  onTimeRegistredDevices = 0;
  discoonecFromCancel = false;
  GatewayMacID = null;
  timeOutValue = null;

  constructor(props) {
      super(props);
      Navigation.events().bindComponent(this);

      if (!this.props.manager) this.props.onSetBleManager(new BleManager());

      this.state = {
        token: '',
        errorCode: 0,
        refreshing: false,
        deviceDiscoveryModalVisible: false,
        discoveredDevices: {},
        deviceRegistrationModalVisible: false,
        callbackRegistredDevices: 0,
        isRegistrationProcessCompleted: false,
        showCancelButton: false,
        waitingDeviceLoader: false,
        sensors: [],
      };

      if (this.props.selectedGrowArea) { // redirect from grow area
        this.growAreaId = this.props.selectedGrowArea.id;
        this.growAreaName = this.props.selectedGrowArea.name;

      }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (this.visible);
      }

      componentDidAppear() {
        this._onRefresh();
        this.forceUpdate();
        this.visible = true;
        AsyncStorage.getItem('accessToken').then(async (authToken) => {
        this.setState({ refreshing: true, searching: false, filterKey: '', token: authToken });

        this.setState({ refreshing: false })
        console.log(JSON.stringify(this.props.deviceTypes));

         let growAreaId = this.growAreaId;

         if (growAreaId) {
            if (growAreaId ? (!this.props.devicesByGrowAreaId[growAreaId] || this.props.devicesByGrowAreaId[growAreaId].length === 0) : this.props.devices.length === 0) {
                this._onRefresh();
            }
         }
         else if (this.props.devices.length === 0) {
              this._onRefresh();
          }
         })
       }

    getSensorList(){

          AsyncStorage.getItem('sensorList').then(response => {
              sensors=JSON.parse(response)
              this.setState( { sensors})
          }).catch((e) => {
              console.log('error in getting asyncStorage\'s item:', e.message);
          })
          return this.state.sensors;
    }

     _onRefresh = () => {
      AsyncStorage.getItem('accessToken').then((authToken) => {
         this.setState({ refreshing: true, searching: false, filterKey: '', token: authToken });
         this.getSensorList();
         this.setState({ refreshing: false, calledGetCurrentData: true });
        console.log(JSON.stringify(this.props.deviceTypes));

      })
    }

   showDeviceDiscoveryModal(visible, inBackground, keepProvisionCallback, showAlert) {
      console.log('flags', visible, inBackground, keepProvisionCallback, showAlert);

      if (visible) {
        const subscription = this.props.bleManager.onStateChange((state) => {
          if (state === 'PoweredOn') {
            if (!inBackground) this.setState({ deviceDiscoveryModalVisible: true, waitingDeviceLoader: true });
            console.log("Checking for gateway connection")
            this.checkForGatewayConnection(inBackground);
            subscription.remove();
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
      else if (showAlert) {

        Alert.alert(
          'Sensor Provision',
          'Are you sure, you want to discard discovered sensors?',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'OK', onPress: () => {
                this.setState({
                  deviceDiscoveryModalVisible: visible,
                  errorCode: 1
                });
                this.stopDeviceScanUnsubscribeNotification(keepProvisionCallback);
              }
            },
          ],
          { cancelable: false },
        );
      }
      else {
        this.setState({
          deviceDiscoveryModalVisible: visible,
        });
      }
    }
    async deleteSensorAPI(payload,device,sensorId,eui64)
    {
      let url = Urls.DELETE_GROWAREA;
      this.props.uiStartLoading("Deleting Selected Sensor");
      console.log("payload for sensor delete ---:"+JSON.stringify(payload));
      try{
            const response = await fetch(url,{ method: "POST",headers: {'Accept': 'application/json','Content-Type' : 'application/json' },
                    body: JSON.stringify(payload)})
            console.log("res---"+JSON.stringify(response));
            if(response.ok)
            {
              const msg = await response.json();
              console.log("response in json---"+msg);
             this.setSensorListAfterDeletion(sensorId);
              this.askForService(device,eui64);
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

      setSensorListAfterDeletion(sensorId)
      {
        let sensors=this.state.sensors;
        let filteredList = sensors.filter((item) => item.sensorId !== sensorId);
        AsyncStorage.setItem('sensorList',JSON.stringify(filteredList)).then(() => {
          this.setState({sensors:filteredList});
          }).catch((error) => {
                  console.log('error in saving list of sensors to  local storage', error);

              })
         console.log('Delete Sensor from sensor list');
        alert("Sensor deleted Successfully");
        this.props.uiStopLoading();
        this._onRefresh();
      }

        askForService = (device,eui64) => {
          console.log("Discovering services and characteristics...");
          this.setState({
            deviceDiscoveryModalVisible: false,
            bleMessage: 'Discovering services and characteristics...',
            waitingDeviceLoader: false
          })
          device.discoverAllServicesAndCharacteristics()
            .then((device) => {
              console.log("DeviceId:::::::::" + device.id);
              this.deviceCharacteristics[device.id] = {};
              this.deviceCharacteristics[device.id]['mtu'] = device.mtu;
              device.services().then(services => {
                services = services.filter(this.isKnownService);
                console.log("Known Services size:" + services.length)
                if (services.length === 0) {
                  console.log("No known services found in connected device.");
                  this.setState({
                    bleMessage: 'Required services not found. Disconnecting from device..',
                    waitingDeviceLoader: false
                  })
                  device.cancelConnection();
                }
                else {
                  this.setState({
                    bleMessage: 'Services discovered..',
                    waitingDeviceLoader: false
                  })
                }
                services.forEach((service, i) => {
                  service.characteristics().then(characteristics => {
                    console.log("Service UUID:" + service.uuid);
                    console.log("Initial characteristics size:" + characteristics.length);
                    characteristics = characteristics.filter((characteristic) => {

                      characteristicPrefix = this.isKnownCharacteristic(characteristic);
                      if (characteristicPrefix) {
                        console.log("Characteristics UUID:" + characteristic.uuid);
                        this.deviceCharacteristics[device.id][characteristicPrefix] = characteristic;
                        return true;
                      }
                    });
                    console.log("After filtering characteristics size:" + characteristics.length);

                    if (i === services.length - 1) {
                      console.log("deviceCharacteristics List:", JSON.stringify(Object.keys(this.deviceCharacteristics[device.id])));
                      const dialog = Object.values(this.deviceCharacteristics[device.id]).find(
                        characteristic => characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse
                      )
                      if (!dialog) {
                        console.log("No writable characteristic");
                        this.setState({
                          bleMessage: 'Required characteristics not found. Disconnecting from sensor..',
                          waitingDeviceLoader: false
                        })
                        device.cancelConnection();
                      }
                      else {
                        this.setState({
                          bleMessage: 'Characteristics discovered..',
                          waitingDeviceLoader: true
                        })
                        console.log("Opening registration modal..")

                        var deviceDeletionCharFound = false;
                        console.log('In Deletion Service Characteristic......................');
                        Object.keys(this.deviceCharacteristics[device.id]).every((characteristicPrefix) => {

                          if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_DELETION) {
                             this.deviceDeleteChar = this.deviceCharacteristics[device.id][characteristicPrefix];
                             deviceDeletionCharFound = true;
                           }
                            return !(deviceDeletionCharFound)

                          });
                          if (deviceDeletionCharFound) {
                             console.log('Deleting Sensor service found....................');
                             this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false});
                             this.sendSensorDeletionPayload(this.deviceDeleteChar,eui64,device);
                          }
                        else {
                          alert("One of the required characteristic for deletion of sensor not found in connected gateway. Disconnecting..");
                        }
                      }
                    }
                  })
                })
              })
            })
            .catch((error) => {
                this.props.uiStopLoading();
              if (error.errorCode === 205) {
                console.log("ErrorMessage:" + error.message);
                this.props.onRemoveDevice(device.id);
                alert('Unable to connect device......');
              }
              else {
                this.setState({
                  deviceDiscoveryModalVisible: false,
                  bleMessage: 'Error: Unable to connect to Gateway. Please try adding sensor again.',
                  waitingDeviceLoader: false
                })
                console.log("Error: " + error.message)
                console.log("ErrorCode:" + error.errorCode)
                device.cancelConnection().catch(error => {
                  console.log("Sensor is already disconnected." + error.message);
                });
              }
            })

        }
     sendSensorDeletionPayload(characteristic,sensor,device)
      {
        let payload = [
          {
          eui64: sensor,
          deviceType: "sentimate"
          }
        ];
      console.log("Checking characristics for send payload to BLE");
      console.log("sensorId:" + sensor);

        if(characteristic){
          this.writeCharacteristics(characteristic, payload, (this.deviceCharacteristics[device.id].mtu - 3), 'sendDeletionOfSensor');
          console.log('Sensor deleted successfully....Data has been sent to connected gateway for deletion');
          this._onRefresh();
        } else {
          return true;
        }
      }

    showDeviceDiscoveryModalForDeletionOfSensor(visible, inBackground,sensorId,eui64) {
          console.log('flags', visible, inBackground);

          if (visible) {
            this.props.uiStartLoading('Deleting Selected Sensor');
            const subscription = this.props.bleManager.onStateChange((state) => {
              if (state === 'PoweredOn') {
                if (!inBackground) this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                console.log("Checking for gateway connection");

                console.log('id', this.GatewayMacID, this.growAreaId);
                console.log('Total gateways Devices connected----------------', this.props.bleDevices);
                payload = [{"gatewayId": this.growAreaId,"sensorId":sensorId,"deviceType":"sentimate"}];
                if (this.growAreaId) {
                     console.log('in this.pros.----------------', this.props.bleDevices[this.GatewayMacID]);

                     if (this.props.bleDevices[this.GatewayMacID]) {
                       this.device = this.props.bleDevices[this.GatewayMacID];
                       console.log("Gateway found in redux..", this.device);
                        Promise.resolve(this.device.isConnected)
                                 .then((connected) => {
                                   if (connected) {
                                    if (!inBackground) this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                                    console.log("Already connected with Gateway");
                                    console.log('in this.pros----------------', this.props.bleDevices);
                                    this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                                     this.deleteSensorAPI(payload,this.device,sensorId,eui64);
                                   }
                                   else {
                                         this.timeOutValue = setTimeout(() => {
                                               this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                                               this.props.uiStartLoading("Deleting Selected Sensor");
                                               this.factoryResetDevice(payload,sensorId);
                                         }, 10000)
                                          console.log("Scanning for gateway..")
                                          this.props.uiStopLoading();
                                          this.scanAndConnectForDeleteSensor(inBackground,payload,sensorId,eui64);
                                   }
                                 });
                      }
                     else
                     {
                        this.timeOutValue = setTimeout(() => {
                                this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                                this.props.uiStartLoading("Deleting Selected Sensor");
                                this.factoryResetDevice(payload,sensorId);
                        }, 10000)
                        this.props.uiStopLoading();
                        console.log("Scanning for gateway..")
                        this.scanAndConnectForDeleteSensor(inBackground,payload,sensorId,eui64);

                     }
                 }
                 else
                 {
                       this.timeOutValue = setTimeout(() => {
                       this.setState({ deviceDiscoveryModalVisible: false, waitingDeviceLoader: false });
                                  this.props.uiStartLoading("Deleting Selected Sensor");
                                this.factoryResetDevice(payload,sensorId);
                       }, 10000)
                       this.props.uiStopLoading();
                       console.log("Scanning for gateway..")
                       this.scanAndConnectForDeleteSensor(inBackground,payload,sensorId,eui64);

                 }
                subscription.remove();
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
        }

    factoryResetDevice(payload,sensorId)
    {
            this.props.uiStopLoading();
            this.props.bleManager.stopDeviceScan();
            Alert.alert('Gateway is not reachable at this time.','Factory reset will be required after deletion. Are you sure want to do Force delete of Gateway?',
            [
             {
                text: 'Cancel', onPress: () => {
                  console.log('delete operation was canceled.');
                }, style: 'cancel'
             },
             {
                text: 'Delete', onPress: async() => {
                   this.props.uiStartLoading('Deleting selected Sensor');
                   let url = Urls.DELETE_GROWAREA;
                   console.log("payload for Sensor delete ---:"+JSON.stringify(payload));
                   try{
                        const response = await fetch(url,{ method: "POST",headers: {'Accept': 'application/json','Content-Type' : 'application/json' },
                                         body: JSON.stringify(payload)})
                        console.log("res---"+JSON.stringify(response));
                        if(response.ok)
                        {
                          const msg = await response.json();
                          console.log("response in json---"+msg);
                          this.props.uiStopLoading();
                          alert("Gateway deleted successfully from AWS cloud. Need to Factory reset");
                          this.setSensorListAfterDeletion(sensorId);
                          this._onRefresh();
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
    }
    onRegisterDevicesClick() {

      console.log("Register button clicked:" + JSON.stringify(Object.values(this.state.discoveredDevices)));
      this.setState({ isRegistrationProcessCompleted: false })

      Object.values(this.state.discoveredDevices).map((device) => {
        console.log('device--------------------------', device.decision);
        if (device.decision) {
          this.onTimeRegistredDevices = this.onTimeRegistredDevices + 1;
          console.log('this.ontime count', this.onTimeRegistredDevices);

        }
      });
      if (this.deviceNotificationChar && this.device) {
        this.provisionRequestSent = true;
        let payload = Object.values(this.state.discoveredDevices);

        this.writeCharacteristics(this.deviceNotificationChar, payload, (this.deviceCharacteristics[this.device.id].mtu - 3), 'sendProvisionDevices')
        if (this.deviceProvisionCallbackChar && this.onTimeRegistredDevices != 0) {
          console.log('hello if-==-=-=-=-');

          this.handleProvisionCallbackNotifications(this.deviceProvisionCallbackChar);
        }
        this.showDeviceDiscoveryModal(false, true, true, false);
        if (this.onTimeRegistredDevices !== 0) {
          this.setState({ deviceRegistrationModalVisible: true })
          setTimeout(() => {
            console.log('this.state.isRegistrationProcessCompleted', this.state.isRegistrationProcessCompleted);
            if (!this.state.isRegistrationProcessCompleted) {
              this.setState({ deviceRegistrationModalVisible: false, isRegistrationProcessCompleted: true, errorCode: 1 })

              this.onTimeRegistredDevices = 0;
              this._onRefresh();

            }
          }, (this.onTimeRegistredDevices * 120000))  // set 2 min timer to read response for sensors.
        }
      }
      else {
        if (this.device)
          alert('Connected BLE device does not have provision capabilities.');
        else
          alert("Device not connected" + this.onTimeRegistredDevices);
      }
    }

    stopDeviceScanUnsubscribeNotification(keepProvisionCallback) {
      console.log('hello stop');

      if (this.deviceDiscoverChar && this.device) {
        let payload = { discoverDevices: 0 }
        this.writeCharacteristics(this.deviceDiscoverChar, payload, (this.deviceCharacteristics[this.device.id].mtu - 3), 'sendStopDiscoverDevice')
        if (!keepProvisionCallback) {
          payload = [];
          Object.values(this.state.discoveredDevices).forEach(device => {
            device.decision = false;
            payload.push(device);
          });
          this.writeCharacteristics(this.deviceProvisionChar, payload, (this.deviceCharacteristics[this.device.id].mtu - 3), 'sendProvisionDevices')
          this.setState({
            discoveredDevices: {}
          });
        }
      }
      if (this.discoverCharSubscription) {
        this.discoverCharSubscription.remove();
      }
      if (this.connectivitySubscription) {
        this.connectivitySubscription.remove();
      }
      if (this.provisionCallbackCharSubscription && !keepProvisionCallback) {
        console.log('keepprovision callback', keepProvisionCallback);

        this.provisionCallbackCharSubscription.remove();
      }
      this.props.bleManager.stopDeviceScan();
    }

 checkForGatewayConnection = (inBackground) => {
    console.log('id', this.GatewayMacID, this.growAreaId);
    console.log('gateways in redux0-0-0-0-0-0-0-0-0-0-0-0-', this.props.bleDevices);

    if (this.growAreaId) {
      console.log('in this.pros.----------------', this.props.bleDevices[this.GatewayMacID]);

      if (this.props.bleDevices[this.GatewayMacID]) {
        this.device = this.props.bleDevices[this.GatewayMacID];
        console.log("Gateway found in redux..", this.device);
        Promise.resolve(this.device.isConnected)
          .then((connected) => {
            if (connected) {
              console.log("Already connected with Gateway");
              if (!inBackground) this.askForDevices(this.device);
            }
            else {
              console.log("Scanning for gateway..")
              this.scanAndConnect(inBackground);
            }
          });
      }
      else {
        console.log("Scanning for gateway..")
        this.scanAndConnect(inBackground);
      }
    }
    else {
      console.log("GrowAreaUID not found.")
    }
  }

  askForDevices = (device) => {
    console.log("Discovering services and characteristics...");
    this.setState({
      bleMessage: 'Discovering services and characteristics...',
      waitingDeviceLoader: true
    })
    device.discoverAllServicesAndCharacteristics()
      .then((device) => {
        console.log("DeviceId:" + device.id);
        this.deviceCharacteristics[device.id] = {};
        this.deviceCharacteristics[device.id]['mtu'] = device.mtu;
        device.services().then(services => {
          services = services.filter(this.isKnownService);
          console.log("Known Services size:" + services.length)
          if (services.length === 0) {
            console.log("No known services found in connected device.");
            this.setState({
              bleMessage: 'Required services not found. Disconnecting from device..',
              waitingDeviceLoader: false
            })
            device.cancelConnection();
          }
          else {
            this.setState({
              bleMessage: 'Services discovered..',
              waitingDeviceLoader: true
            })
          }
          services.forEach((service, i) => {
            service.characteristics().then(characteristics => {
              console.log("Service UUID:" + service.uuid);
              console.log("Initial characteristics size:" + characteristics.length);
              characteristics = characteristics.filter((characteristic) => {

                characteristicPrefix = this.isKnownCharacteristic(characteristic);
                if (characteristicPrefix) {
                  console.log("Characteristics UUID:" + characteristic.uuid);
                  this.deviceCharacteristics[device.id][characteristicPrefix] = characteristic;
                  return true;
                }
              });
              console.log("After filtering characteristics size:" + characteristics.length);

              if (i === services.length - 1) {
                console.log("deviceCharacteristics List:", JSON.stringify(Object.keys(this.deviceCharacteristics[device.id])));
                const dialog = Object.values(this.deviceCharacteristics[device.id]).find(
                  characteristic => characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse
                )
                if (!dialog) {
                  console.log("No writable characteristic");
                  this.setState({
                    bleMessage: 'Required characteristics not found. Disconnecting from sensor..',
                    waitingDeviceLoader: false
                  })
                  device.cancelConnection();
                }
                else {
                  this.setState({
                    bleMessage: 'Characteristics discovered..',
                    waitingDeviceLoader: true
                  })
                  console.log("Opening registration modal..")

                  var deviceProvisionCharFound = false;
                  var deviceDiscoverCharFound = false;
                  var deviceProvisionCallbackCharFound =false;
                  Object.keys(this.deviceCharacteristics[device.id]).every((characteristicPrefix) => {
                    console.log(characteristicPrefix, Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_DEVICE_DISCOVER_COMMAND_UUID);
                    console.log((characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_DEVICE_DISCOVER_COMMAND_UUID));
                    if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_DEVICE_DISCOVER_COMMAND_UUID) {
                       this.deviceDiscoverChar = this.deviceCharacteristics[device.id][characteristicPrefix];
                       deviceDiscoverCharFound = true;
                     }
                    if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_DEVICE_DISCOVER_PROVISION_UUID) {
                      this.deviceProvisionChar = this.deviceCharacteristics[device.id][characteristicPrefix];
                      deviceProvisionCharFound = true;
                    }
                    if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_DEVICE_PROVISION_CALLBACK_UUID) {
                      this.deviceProvisionCallbackChar = this.deviceCharacteristics[device.id][characteristicPrefix];
                      deviceProvisionCallbackCharFound = true;

                    }
                    if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_CONNECTIVITY) {
                       this.deviceNotificationChar = this.deviceCharacteristics[device.id][characteristicPrefix];
                       console.log('------------id----', this.deviceNotificationChar.id);

                       this.deviceConectivityCharFound = true;
                    }
                      return !(deviceDiscoverCharFound && deviceProvisionCharFound && deviceProvisionCallbackCharFound)

                    });
                    if (deviceDiscoverCharFound && deviceProvisionCharFound && deviceProvisionCallbackCharFound && this.deviceConectivityCharFound) {
                       console.log('sending to the notify', this.deviceNotificationChar.id);
                       this.handleConnectivityNotifications(this.deviceNotificationChar);
                       this.handleDeviceDiscoveryNotifications(this.deviceProvisionChar);
                       this.sendDiscoveryRequest(this.deviceDiscoverChar, device);
                    }
                  else {
                    alert("One of the required characteristic not found in connected gateway. Disconnecting..");
                  }
                }
              }
            })
          })
        })
      })
      .catch((error) => {
        if (error.errorCode === 205) {
          console.log("ErrorMessage:" + error.message);
          this.props.onRemoveDevice(device.id);
          setTimeout(() => {
            this.checkForGatewayConnection();
          }, 1000);
        }
        else {
          this.setState({
            bleMessage: 'Error: Unable to connect to Gateway. Please try adding sensor again.',
            waitingDeviceLoader: false
          })
          console.log("Error: " + error.message)
          console.log("ErrorCode:" + error.errorCode)
          device.cancelConnection().catch(error => {
            console.log("Sensor is already disconnected." + error.message);
          });
        }
      })

  }

  sendDiscoveryRequest = (characteristic, device) => {
    console.log("Sending discovery request..");
    let payload = { discoverDevices: 1 }
    if (!bleDebug) {
      this.setState({
        bleMessage: "Sending discovery request..",
        discoveredDevices: {},
        waitingDeviceLoader: true
      });
    }
    this.writeCharacteristics(characteristic, payload, (this.deviceCharacteristics[device.id].mtu - 3), 'sendStartDiscoverDevice')
    this.provisionRequestSent = false;
  }

  handleDeviceDiscoveryNotifications = (deviceProvisionChar) => {
    console.log("Subscribing to provision characteristic..", deviceProvisionChar);
    let discoveryResponse = {};
    let validPayload = '';

    this.discoverCharSubscription = deviceProvisionChar.monitor((error, characteristic) => {
      if (error) {
        console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverDeviceNotificationSubscription');
        if (this.state.errorCode === 1) {
          console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverDeviceProvisionCallbackNotificationSubscription');
        } else {
          this.setState({ errorCode: 1 });
          if (this.state.deviceDiscoveryModalVisible) {
            this.showDeviceDiscoveryModal(false, false, false, false);
          } else if (this.state.deviceRegistrationModalVisible) {
            this.setState({ deviceRegistrationModalVisible: false, isRegistrationProcessCompleted: true, callbackRegistredDevices: 0 })
          }
          Alert.alert('Provisioning Sensors Failed.', 'Please try again.');
        }
        this.provisionRequestSent = true;
      }
      else {
        console.log('deviceNotificationChar', this.deviceNotificationChar.id);
        let message = Base64.atob(characteristic.value);
        console.log("DeviceDiscoveryMessage:" + message);
        if (bleDebug) {
          let eui64 = guid();
          let payload = { eui64: eui64, deviceType: message, decision: false, deviceName: '' }
          discoveryResponse[eui64] = payload;
          this.setState({ discoveredDevices: discoveryResponse, waitingDeviceLoader: false });
        }
        else {
          if (message === Constant.BLE_PAYLOAD_PREFIX){
            console.log('Begin Payload received...............');
            validPayload = '';
           }
          else if (message === Constant.BLE_PAYLOAD_SUFFIX) {
            console.log('End Payload received...............');
                if (isJsonString(validPayload)) {
                   // let payload = {"eui64":"0x000B57FFFEF199AA","deviceType":"sentimate"}
                   let payload = JSON.parse(validPayload);
                    validPayload = '';
              if (payload.hasOwnProperty('eui64') && payload.hasOwnProperty('deviceType')) {
                console.log('payload.deviceType', payload.deviceType, payload);

                  payload.decision = false;
                  payload.deviceName = '';
                  payload.deviceType = payload.deviceType;
                  payload.description = 'EFR32';
                  payload.gatewayId = this.growAreaId;
                  discoveryResponse[payload.eui64] = payload;
                  console.log('device--=', discoveryResponse);
                  this.setState({
                    discoveredDevices: discoveryResponse,
                    showCancelButton: false
                  });


              }
              else alert("Invalid device object from Gateway: Required keys are missing");
            }
            else {
              console.log("Invalid JSON:" + validPayload);
              validPayload = '';
            }
          }
          else {
            validPayload = validPayload + message;
            console.log("ValidPayload = ",validPayload);
          }
        }
      }
    }, 'myDeviceTransaction');
  }


  handleProvisionCallbackNotifications = (deviceProvisionCallbackChar) => {
    console.log("Subscribing to provision callback characteristic..");
    let provisionCallbackResponse = {};
    let validPayload = bleDebug ? [] : '';
    this.provisionCallbackCharSubscription = deviceProvisionCallbackChar.monitor((error, characteristic) => {
      console.log('hello msg');

      if (error) {
        console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverDeviceProvisionCallbackNotificationSubscription');
        if (this.state.errorCode === 1) {
          console.log("Error:" + error.message + "\nErrorCode:" + error.errorCode + '\nDiscoverDeviceProvisionCallbackNotificationSubscription');
        } else {
          this.setState({ errorCode: 1 });
          if (this.state.deviceDiscoveryModalVisible) {
            this.showDeviceDiscoveryModal(false, false, false, false);
          } else if (this.state.deviceRegistrationModalVisible) {
            this.setState({ deviceRegistrationModalVisible: false, isRegistrationProcessCompleted: true, callbackRegistredDevices: 0 })
          }
          Alert.alert('Provisioning Devices Failed.', 'Please try again.');
        }
      }
      else {
       let message = Base64.atob(characteristic.value);
        console.log("DeviceProvisionCallbackMessage:" + message);
        console.log("DeviceProvisionCallbackPayload:" + bleDebug ? JSON.stringify(validPayload) : validPayload)
        if (message === Constant.BLE_PAYLOAD_PREFIX) {
          validPayload = bleDebug ? {} : '';
        }
        else if (message === Constant.BLE_PAYLOAD_SUFFIX) {
          if (bleDebug) validPayload = JSON.stringify(validPayload);
          if (isJsonString(validPayload)) {
            let device = JSON.parse(validPayload);
          if (device.hasOwnProperty('sensorId') && !device.hasOwnProperty('eui64'))
               device.eui64 = device.sensorId.split('-')[1];
            if (device.hasOwnProperty('eui64') && device.hasOwnProperty('sensorId') && this.growAreaId) {
              let payload = {};
              console.log('devicePayload:' + JSON.stringify(device));
              console.log('DiscoveredDevicesKey:' + JSON.stringify(Object.keys(this.state.discoveredDevices)));
              if (this.state.discoveredDevices.hasOwnProperty(device.eui64)) {
                let deviceObj = this.state.discoveredDevices[device.eui64];
                console.log('device_type', deviceObj.deviceType);
                console.log('deviceObj.result------------', device.result);
                if (deviceObj.hasOwnProperty('deviceName') && deviceObj.hasOwnProperty('deviceType') ) {

                  payload.deviceUId = device.sensorId;
                  payload.device_name = deviceObj.deviceName;
                  payload.device_type = deviceObj.deviceType;
                  payload.eui64 = deviceObj.eui64;
                  payload.sensorId= device.sensorId;
                  payload.gatewayId = this.growAreaId;
                  provisionCallbackResponse = payload;

                }
                else {
                  alert('Wrong sensorType found.');
                }
              } else {
                if (this.props.deviceTypes)
                  console.log("Invalid eui64 found.")
                else console.log('sensorTypes not found.')
              }
            } else {
              console.log('eui64 or sensorId or gateway id not found.')
            };
            console.log(JSON.stringify(provisionCallbackResponse), '--------------------', device.result);
            if (Object.keys(provisionCallbackResponse).length > 0 && device.result === Constant.BLE_RESPONSE_STATUS) {
                console.log('this.count================', this.props.registredDevice, this.state.callbackRegistredDevices);
                if (this.state.callbackRegistredDevices === 0 && this.props.registredDevice === 0) {
                     this.setState({ callbackRegistredDevices: 1 })
                }
             this.setState({ callbackRegistredDevices: this.props.registredDevice + this.state.callbackRegistredDevices });
             sensors = this.state.sensors;
             sensors.push(provisionCallbackResponse);
             console.log("--------------------------------------",sensors);
             AsyncStorage.setItem('sensorList',JSON.stringify(sensors)).then((token) => {
                                 this.setState({sensors});
                                 }).catch((error) => {
                                         console.log('error in saving name', error);
                                  })
            }
            validPayload = '';
          }
          else {
            console.log("Invalid JSON:" + validPayload);
            validPayload = '';
          }
        }
        else {
          if (bleDebug) {

            validPayload = {
              eui64: message,
              deviceUid: guid()
            }
          }
          else validPayload = validPayload + message;
        }
      }
    }, 'myDeviceProvisionCallbackTransaction');
  }

  scanAndConnect = (inBackground) => {
    if (this.props.bleManager) {
      if (!inBackground) {
        this.setState({
          waitingDeviceLoader: true,
          bleMessage: 'Searching for ' + (this.growAreaName ? "'" + this.growAreaName + "'" : 'gateway.')
        })
      }

      console.log("Started device scan...");
      this.props.bleManager.startDeviceScan(null, null, (error, device) => {

        if (error) {
          console.log('ErrorCode:' + error.errorCode);
          this.setState({ modalVisible: false });
          if (error.errorCode === 101) {
            //Device is not authorized to use BluetoothLE
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please provide access.')
            }
            else {
              Promise.resolve(requestLocationPermission())
                .then(sources => {
                  this.showDeviceDiscoveryModal(true, inBackground);
                  return;
                }).catch(error => {
                  if (!inBackground) {
                    this.setState({
                      bleMessage: 'Error: Unable to connect to Gateway. Please try adding Gateway again.',
                      waitingDeviceLoader: false
                    })
                  }
                  this.scanAndConnect(inBackground);
                });
            }
          }
          else if (error.errorCode === 601) {
            //Location services are disabled
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please enable it.')
              if (!inBackground) {
                this.showDeviceDiscoveryModal(false);
              }
            }
            else {
              RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
                .then(data => {
                  console.log(data);
                  if (!inBackground) this.showDeviceDiscoveryModal(true, inBackground);
                  return;
                }).catch(error => {
                  console.log(error);
                  if (!inBackground) this.showDeviceDiscoveryModal(true, inBackground);
                  return;
                });
            }
          }
          else {
            console.log(error.errorCode + ":" + error.message);
            if (!inBackground) {
              this.setState({
                bleMessage: 'Gateway scan failed.',
                waitingDeviceLoader: false
              })
            }
          }
          return;
        }

        if (device.name && device.id) {
          this.connectedBle = device;
          console.log("Gateway Name:" + device.name + "\nDeviceId:" + device.id);
          console.log(this.growAreaUId + "=" + device.id + "=");
          console.log('this.macId',this.props.selectedGrowArea.macId);
          console.log('this condition', device.name.indexOf(this.props.selectedGrowArea.macId) !== -1);



          if (device.name.indexOf(this.props.selectedGrowArea.macId) !== -1 || bleDebug) {
            if (bleDebug) this.growAreaUId = device.id;
            this.props.bleManager.stopDeviceScan();
            this.props.onSignoutDisconnect(device)
            console.log("Connecting to Gateway");
            this.GatewayMacID = device.id;
            if (!inBackground) {
              this.setState({
                bleMessage: 'Connecting to EFR32Gateway',
                waitingDeviceLoader: true
              })
            }
            this.tryDeviceConnection(device, inBackground);
          }
        }
      });
    }
    else {
      this.props.onSetBleManager(new BleManager());
      this.scanAndConnect(inBackground);
    }
  }

scanAndConnectForDeleteSensor = (inBackground,payload,sensorId,eui64) => {
    this.props.uiStartLoading('Deleting Selected Sensor');
    if(this.props.bleManager)
    {
      if (!inBackground)
      {
              this.setState({
                deviceDiscoveryModalVisible : false,
                waitingDeviceLoader: false,
                bleMessage: 'Searching for ' + (this.growAreaName ? "'" + this.growAreaName + "'" : 'Grow house (gateway).')
              })
      }

      console.log("Started device scan...");
      this.props.bleManager.startDeviceScan(null, null, (error, device) => {

        if (error) {
            this.props.uiStopLoading();
          console.log('ErrorCode:' + error.errorCode);
          this.setState({ modalVisible: false,deviceDiscoveryModalVisible:false });
          if (error.errorCode === 101) {
            //Device is not authorized to use BluetoothLE
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please provide access.')
            }
            else {
              Promise.resolve(requestLocationPermission())
                .then(sources => {
                  this.showDeviceDiscoveryModalForDeletionOfSensor(true, inBackground,sensorId,eui64);
                  return;
                }).catch(error => {
                  if (!inBackground) {
                    this.setState({
                      bleMessage: 'Error: Unable to connect to Gateway. Please try adding Gateway again.',
                      waitingDeviceLoader: false
                    })
                  }
                  this.scanAndConnectForDeleteSensor(inBackground,payload,sensorId,eui64);
                });
            }
          }
          else if (error.errorCode === 601) {
            //Location services are disabled
            if (Platform.OS === 'ios') {
              alert(appName + ' app wants to use location services.. please enable it.')
              if (!inBackground) {
                this.showDeviceDiscoveryModal(false);
              }
            }
            else {
            alert(appName + ' app wants to use location services.. please enable it.');
              RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
                .then(data => {
                console.log(data);
                  if (!inBackground) this.showDeviceDiscoveryModalForDeletionOfSensor(true, inBackground,sensorId,eui64);
                  return;
                }).catch(error => {
                   console.log(error);
                  if (!inBackground) this.showDeviceDiscoveryModalForDeletionOfSensor(true, inBackground,sensorId,eui64);
                  return;
                });
            }
          }
          else {
            console.log(error.errorCode + ":" + error.message);
            if (!inBackground) {
              this.setState({
                bleMessage: 'Gateway scan failed.',
                waitingDeviceLoader: false
              })
              this.props.uiStartLoading("Deleting Selected Sensor");
              this.factoryResetDevice(payload,sensorId);
            }
          }
          return;
        }

        if (device.name && device.id) {
          this.connectedBle = device;
          console.log("Gateway Name:" + device.name + "\nDeviceId:" + device.id);
         console.log('Gateway Selected.....',this.props.selectedGrowArea);
         if(this.props.selectedGrowArea)
         {
            if (device.name.indexOf(this.props.selectedGrowArea.macId) !== -1 || bleDebug) {
                if (bleDebug) this.growAreaUId = device.id;

                clearTimeout(this.timeOutValue);
                this.props.bleManager.stopDeviceScan();
                this.props.onSignoutDisconnect(device)
                console.log("Connecting to Gateway for deletion");
                this.GatewayMacID = device.id;
                if (!inBackground) {
                    this.setState({
                         waitingDeviceLoader: false
                    })
                }
               this.setState({modalVisible:false, deviceDiscoveryModalVisible : false,waitingDeviceLoader: false});
               this.tryDeviceConnectionForDeletion(device,inBackground,sensorId,eui64);
            }
         }
         else
          {
            clearTimeout(this.timeOutValue);
            this.props.bleManager.stopDeviceScan();
            this.props.onSignoutDisconnect(device)
            console.log("Connecting to Gateway for deletion");
            this.GatewayMacID = device.id;
            if (!inBackground) {
              this.setState({
                waitingDeviceLoader: false
              })
            }
              this.setState({modalVisible:false, deviceDiscoveryModalVisible : false,waitingDeviceLoader: false});
              this.tryDeviceConnectionForDeletion(device,inBackground,sensorId,eui64);
          }
        }
      });


    }
    else {
      this.props.onSetBleManager(new BleManager());
      this.scanAndConnectForDeleteSensor(inBackground,payload,sensorId,eui64);
    }
  }
  tryDeviceConnectionForDeletion = (device, inBackground,sensorId,eui64) => {

            device.connect()
              .then((device) => {

                console.log("Gateway connected for Deletion");
                this.device = device;
                this.props.onAddDevice(device);
                console.log("Adding device for deletion of sensor..");
                console.log('----------start fetching------------------');
                console.log("Already connected with Gateway");
                console.log("Connected with Gateway and now sending payload to AWS");
                if (!inBackground) this.deleteSensorAPI(payload,this.device,sensorId,eui64);
                return device;
              })
              .catch((error) => {
                this.props.uiStopLoading();
                if (error.errorCode === 203) {
                  this.device = device;
                  this.props.onAddDevice(device);
                  console.log("Adding device..");
                 if (!inBackground) this.deleteSensorAPI(payload,this.device,sensorId,eui64);
                }
                else if (error.errorCode === 201) {
                  console.log("Resetting BLE Manager");
                  if (this.props.manager) {
                    console.log("111");
                    this.props.manager.destroy();
                  }
                  this.props.onSetBleManager(new BleManager());
                  this.tryDeviceConnectionForDeletion(device, inBackground);
                }
                else {
                  console.log("Error:" + error.message)
                  this.setState({
                    bleMessage: 'Error: Unable to connect to Gateway.',
                    waitingDeviceLoader: false
                  })
                  device.cancelConnection().catch(error => {
                    console.log("Device is already disconnected." + error.message);
                    this.setState({
                      bleMessage: 'Error: Unable to connect to Gateway. Please try adding Sensor again.',
                      waitingDeviceLoader: false
                    })
                    this.props.uiStartLoading("Deleting Selected Sensor");
                     this.factoryResetDevice(payload,sensorId);
                  });
                }
                return null;
              })

  }

  tryDeviceConnection = (device, inBackground) => {
    device.connect()
      .then((device) => {
        console.log("Gateway connected");
        this.device = device;
        this.props.onAddDevice(device);
        console.log("Adding device..");
        console.log('----------start fetching------------------');
        if (!inBackground) this.askForDevices(device);
        console.log('----------finish fetching------------------');
        return device;
      })
      .catch((error) => {
        if (error.errorCode === 203) {
          this.device = device;
          this.props.onAddDevice(device);
          console.log("Adding device..");
          if (!inBackground) this.askForDevices(device);
          else this.props.bleManager.stopDeviceScan();
        }
        else if (error.errorCode === 201) {
          console.log("Resetting BLE Manager");
          if (this.props.manager) {
            console.log("111");
            this.props.manager.destroy();
          }
          this.props.onSetBleManager(new BleManager());
          this.tryDeviceConnection(device, inBackground);
        }
        else {
          console.log("Error:" + error.message)
          this.setState({
            bleMessage: 'Error: Unable to connect to Gateway. Please try adding Sensor again.',
            waitingDeviceLoader: false
          })
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
            this.setState({
              bleMessage: 'Error: Unable to connect to Gateway. Please try adding Sensor again.',
              waitingDeviceLoader: false
            })
          });
        }
        return null;
      })
  }

  isKnownService(service) {
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

  writeCharacteristics(characteristic, payload, chunkSize, info) {
    if (typeof payload === 'object') {
      payload = JSON.stringify(payload);
    }
    console.log("Writing " + payload.length + " bytes to " + characteristic.uuid + " for " + info);
    console.log(Constant.BLE_PAYLOAD_PREFIX);
    characteristic.writeWithResponse(Base64.btoa(Constant.BLE_PAYLOAD_PREFIX), info).catch(error => {
      console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
    });
    for (var k = 0; k < (payload.length / chunkSize); k++) {
      var str = payload.substring(k * chunkSize, ((k + 1) * chunkSize));
      console.log(str);
      characteristic.writeWithResponse(Base64.btoa(str), info + k).catch(error => {
        console.log("WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
      });
    }
    console.log(Constant.BLE_PAYLOAD_SUFFIX);
    characteristic.writeWithResponse(Base64.btoa(Constant.BLE_PAYLOAD_SUFFIX), info + '$').catch(error => {
      console.log("-=-==-WriteError:\nCode:" + error.code + "\nMessage:" + error.message);
    });
    if (info === 'sendStartDiscoverDevice') {
      this.setState({
        bleMessage: "Waiting for Sensors...",
        waitingDeviceLoader: true
      });
      setTimeout(() => {
        console.log('after 3.5 min flag', this.state.showCancelButton, this.state.deviceDiscoveryModalVisible, '---->', this.state);

        if (this.state.showCancelButton && this.state.deviceDiscoveryModalVisible) {
          this.showDeviceDiscoveryModal(false, false, false, false);
          this.setState({ errorCode: 1 });
          alert('No Sensors found.')
        }
      }, deviceDiscoveryTimeout)
    }
  }

  closeRegistrationModal() {
    if (this.onTimeRegistredDevices !== 0) {
      if (this.onTimeRegistredDevices === this.state.callbackRegistredDevices) {
        let numberOfDevices = this.onTimeRegistredDevices;
        this.onTimeRegistredDevices = 0;
        setTimeout(() => {
          this.setState({ deviceRegistrationModalVisible: false, isRegistrationProcessCompleted: true, callbackRegistredDevices: 0, errorCode: 1 })
          console.log('in fun ', this.state.callbackRegistredDevices, this.state.deviceRegistrationModalVisible);
          this._onRefresh()
        }, 5000);


      }
    }
  }


  handleConnectivityNotifications(connectivityChar) {
    console.log('---------id', connectivityChar.id, this.deviceConectivityCharFound);
    if (this.deviceConectivityCharFound) {
      this.connectivitySubscription = connectivityChar.monitor((error, response) => {
        if (error) {
          if (this.state.errorCode === 1) {
            console.log('error453544', error, this.state.errorCode);
          } else {
            this.setState({ errorCode: 1 });
            if (this.state.deviceDiscoveryModalVisible) {
              this.showDeviceDiscoveryModal(false, false, false, false);
            } else if (this.state.deviceRegistrationModalVisible) {
              console.log('log0-0-0-0-0--');

              this.setState({ deviceRegistrationModalVisible: false, isRegistrationProcessCompleted: true, callbackRegistredDevices: 0 })
            }
            Alert.alert('Provisioning Sensors Failed.', 'Please try again.');
          }
          this.connectivitySubscription.remove();
        } else {
          console.log('\n\n\n response.value', Base64.atob(response.value));
          this.setState({ errorCode: 1 });
          var value = Base64.atob(response.value);
          if (value === '\u0000') {
            this.showDeviceDiscoveryModal(false, false, false, false)
            this.deviceConectivityCharFound = false;
            this.connectivitySubscription.remove();
          } else {
            this.deviceConectivityCharFound = false;
            this.connectivitySubscription.remove();
            return {}
          }
        }
      })
      this.deviceConectivityCharFound = false

    }

  }

  onClearSearch = () => {
    this.setState({
      searching: false,
      filterKey: ''
    })
  }

  renderControls(info) {
        if (info.item.deviceUId) {

          let timeStamp = [];
          let timeStampToDisplay;


          return (
            <View style={styles.listItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>

                    <View style={{ flexDirection: 'column', color: '#fff', width: '60%', marginLeft: 0.5}}>
                        <Text style={{ alignSelf: 'flex-start', color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{debug ? info.item.eui64 + '-' : ''}{info.item.device_name}</Text>
                        <Text style={{ alignSelf: 'flex-start', color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{debug ? info.item.eui64 + '-' : ''}{info.item.device_type}</Text>
                        <Text style={{ color: '#fff', fontSize: 17  }}>{debug ? info.item.id + '-' : ''}{info.item.eui64}</Text>
                    </View>
               </View>

                <View style={{ justifyContent: 'space-evenly', flexDirection: 'row', marginTop: 10, alignItems: 'center', width: '100%' }}>
                      <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, backgroundColor: '#737373' }}>
                             <Icon name="history" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                                   this.openHistoricalChart(info.item);
                             }} />
                             <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 25, paddingBottom: 5 }}>Chart</Text>
                      </View>

                 <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, backgroundColor: '#737373', justifyContent: 'center' }}>

                 <MaterialIcon name="delete" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() =>
                 Alert.alert('Delete Sensor', 'Are you sure you want to delete ' + info.item.device_name + '?',
                  [
                    {
                       text: 'Cancel', onPress: () => {
                           console.log('delete operation was canceled.');
                       }, style: 'cancel'
                    },
                    {
                       text: 'Delete', onPress: () => {
                          this.showDeviceDiscoveryModalForDeletionOfSensor(true,false,info.item.sensorId,info.item.eui64);
                       }
                     },
                  ],
                  { cancelable: true }
                )} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 25, paddingBottom: 5 }}>Delete</Text>
                  </View>
                 </View>
              </View>

          );
        }
        else {
          return (
            <View style={styles.listItem}>
             <Text color="#00ff00">No Sensors found.</Text>
            </View>
          );
        }

    }

  render() {

      let growAreaId = this.props.selectedGrowArea ? this.growAreaId : null;
      listData = this.getSensorList() || [];

      displayList = [];
      if(growAreaId != null)
      {
      if(listData){
            listData.map((listItem,index) => {
                if(listItem.gatewayId === growAreaId)
                   displayList.push(listItem);
            });
      }
      }
      else
      {
            listData.map((listItem,index) => {
                     displayList.push(listItem);
             });
      }

      let devicesList;
      if (displayList) {
        if (displayList.length !== 0) {

              devicesList = (
                <FlatList
                  data={displayList}
                  renderItem={(info) => (
                    this.renderControls(info)
                  )}
                //  keyExtractor={(item) => item.eui64.toString()}
                  refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshing}
                      onRefresh={this._onRefresh}
                      colors={['red', 'green', 'blue']}
                    />
                  }
                />
              );

        } else {
              devicesList = (

              <ScrollView contentContainerStyle={styles.activityIndicator}
                        refreshControl={
                          <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh}
                            colors={['red', 'green', 'blue']}
                          />
                        }>
              <Text color="#00ff00">No Sensors found.</Text>

              </ScrollView>
                );
        }
        }else {
                       devicesList = (

                       <ScrollView contentContainerStyle={styles.activityIndicator}
                                 refreshControl={
                                   <RefreshControl
                                     refreshing={this.state.refreshing}
                                     onRefresh={this._onRefresh}
                                     colors={['red', 'green', 'blue']}
                                   />
                                 }>
                       <Text color="#00ff00">No Sensors found.</Text>

                       </ScrollView>
                         );
                 }

        if (this.props.isLoading) {
              devicesList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />
              <Text style={{ margin: 4, fontWeight: "bold" }}>{this.props.isMessage}</Text>
              </View>;
           } else if (displayList.length === 0) {
             devicesList = (

                   <ScrollView contentContainerStyle={styles.activityIndicator}
                        refreshControl={
                        <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this._onRefresh}
                        colors={['red', 'green', 'blue']}
                        />
                   }>
                   <Text color="#00ff00">No Sensors found.</Text>

                  </ScrollView>
             );
         }

      let deviceDiscoveryContainer = (
        <View style={styles.scanContainer}>
          <Image
            source={require('../../assets/images/scan.png')}
            style={styles.scanImage}
          />
          {this.state.waitingDeviceLoader ? <ActivityIndicator size='large' color='green' style={{ marginTop: 20 }} /> : <View></View>}
          {this.state.bleMessage && <Text style={styles.scanText}>{this.state.bleMessage}</Text>}
        </View>
      );

      let deviceListSize = Object.keys(this.state.discoveredDevices).length;
      if (deviceListSize > 0 && !this.provisionRequestSent) {
        deviceDiscoveryContainer = (
          <View style={styles.deviceListContainer}>
            <View style={{ alignItems: "center", marginBottom: 6, backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}><Text>{deviceListSize} {deviceListSize === 1 ? 'Device' : 'Devices'} found</Text></View>
            <KeyboardAvoidingView style={{ flex: 1, }} behavior="height" enabled>
              <FlatList
                removeClippedSubviews={false}
                keyboardDismissMode='on-drag'
                data={Object.values(this.state.discoveredDevices)}

                renderItem={(info) => (
                  <View style={styles.deviceItem}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image
                        source={require('../../assets/images/device_48.png')}
                        style={styles.deviceIcon}
                      />
                      <View style={{ width: '40%', paddingRight: 10, flexDirection: 'column' }}>
                        <Text style={{ fontSize: 10 }}>Device Name</Text>
                        <TextInput
                          placeholder='Sensor Name'
                          editable={!this.state.discoveredDevices[info.item.eui64].decision}
                          style={{ borderColor: 'gray', borderBottomWidth: 1, padding: 0 }}
                          onChangeText={(text) => {
                            let discoveredDevices = this.state.discoveredDevices
                            discoveredDevices[info.item.eui64].deviceName = text;
                            this.setState({
                              discoveredDevices: discoveredDevices
                            })
                          }}
                          value={this.state.discoveredDevices[info.item.eui64].deviceName}
                        />
                        <Text style={{ fontSize: 10, marginTop: 5 }}>EUI64</Text>
                        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "bold" }}>{info.item.eui64}</Text>
                      </View>
                      <View style={{ width: '35%', flexDirection: 'column' }}>
                        <Text style={{ fontSize: 10, marginTop: 5 }}>Sensor Type</Text>
                        <Text style={{ fontSize: 12, fontWeight: "bold" }}>{
                          info.item.deviceType
                        }</Text>
                      </View>
                      <CheckBox
                        style={{ margin: 15, justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => {
                          let regEx = /^[a-zA-Z][a-zA-Z_.]{0,1}[ a-z|A-Z|0-9|_.]*$/;

                          if (!this.state.discoveredDevices[info.item.eui64].deviceName ||
                            this.state.discoveredDevices[info.item.eui64].deviceName.trim() === '' ||
                            this.state.discoveredDevices[info.item.eui64].deviceName.length > 25 ||
                            !regEx.test(this.state.discoveredDevices[info.item.eui64].deviceName.trim())) {
                            Alert.alert("Please enter valid Device name.", 'Invalid Device name! Maximum length is 25. Name should start with alphabet and may contain dot, underscore, space and numeric value.');
                          }
                          else {
                            console.log("DeviceName:" + this.state.discoveredDevices[info.item.eui64].deviceName);
                            let discoveredDevices = this.state.discoveredDevices;
                            console.log(JSON.stringify(discoveredDevices));

                            discoveredDevices[info.item.eui64].decision = !discoveredDevices[info.item.eui64].decision;
                            discoveredDevices[info.item.eui64].sensorName = discoveredDevices[info.item.eui64].deviceName;
                            this.setState({
                              discoveredDevices: discoveredDevices,
                            })
                            console.log(JSON.stringify(discoveredDevices));
                          }
                        }}
                        checkBoxColor='green'
                        isChecked={this.state.discoveredDevices[info.item.eui64].decision}
                      />
                    </View>
                  </View>
                )}
              //  keyExtractor={(item) => item.eui64.toString()}
              />
            </KeyboardAvoidingView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.roundButton, styles.registerButton]} onPress={() => this.onRegisterDevicesClick()}>
                <Text style={[styles.buttonText, { marginLeft: 0 }]}>REGISTER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.showDeviceDiscoveryModal(false, false, false, true)}>
                <Text style={[styles.buttonText, { marginLeft: 0 }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>

          </View>
        );
      }

      let detailBlock = (<View />);
      if (this.growAreaId) {

        getDetailBlockTitleStyle = function (title) {
          var fontSize = 36;
          var multiplier = 2.5 - (title.length - 16) * 0.125;

          if (title.length > 15 && title.length <= 25) fontSize = fontSize - multiplier * (title.length - 15);
          else if (title.length > 25) fontSize = 19.5;

          return {
            marginLeft: 10,
            marginRight: 10,
            fontSize: fontSize,
            color: Constant.WHITE_TEXT_COLOR
          }
        }

        detailBlock = (
          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitleInfo}>Gateway Name</Text>
            <Text numberOfLines={1} style={getDetailBlockTitleStyle(this.growAreaName)}>{this.growAreaName}</Text>

            <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly' }}>

              <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />

            </View>
            <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10, marginLeft: 10 }}>
              <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.PRIMARY_COLOR, width: 90, height: 35 }]} onPress={() => {
                this.showDeviceDiscoveryModal(true, false, true, false)
                if (this.provisionCallbackCharSubscription) {
                  console.log('keepprovision callback');

                  this.provisionCallbackCharSubscription.remove();
                }

                if (this.discoverCharSubscription) {
                  this.discoverCharSubscription.remove();
                }
                this.setState({
                  callbackRegistredDevices: 0
                  , showCancelButton: true, errorCode: 0
                })
              }}>
                <Text style={styles.buttonText}>Sensors</Text>
                <Image source={require('../../assets/images/add_24.png')} style={styles.detailIcon} />
              </TouchableOpacity>

            </View>
          </View>
        );
      }

    return (
      <View style={[styles.container, { flex: 2 }]}>
       <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.deviceRegistrationModalVisible}
                onRequestClose={() => { }}
              >
                <View style={{ justifyContent: 'center', flex: 1, backgroundColor: '#rgba(0, 0, 0, 0.5)' }}>
                  <View style={{ alignItems: 'center', backgroundColor: '#fff' }}>
                    <ActivityIndicator size='large' color='green' style={{ marginTop: 20 }} />
                    <Text style={{ alignSelf: 'center', marginTop: 20 }}> Your {this.onTimeRegistredDevices === 1 ? 'Sensor is ' : 'Sensors are '}provisioning{debug ? this.onTimeRegistredDevices : ''}.</Text>
                    <Text style={{ alignSelf: 'center', marginTop: 0, marginBottom: 20 }}>This process may take time. </Text>
                    <Text style={{ alignSelf: 'center', marginTop: 20, marginBottom: 20 }}>Successfully registered Sensors: {this.state.callbackRegistredDevices}</Text>
                    {this.closeRegistrationModal()}
                  </View>

                </View>

              </Modal>
        <View style={styles.greenBackgroundContainer} />
        {detailBlock}
               <View style={styles.listContainer}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Text style={[styles.listTitle, { flex: 1 }]}> Sensors{debug ? ' (' + Object.keys(this.props.bleDevices).length + ')' : ''}</Text>
                   {!this.state.searching && displayList.length > 0 &&
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
                     onChangeText={(filterKey) => this.setState({ filterKey })}
                     onClear={() => this.onClearSearch()}
                     placeholder='Search sensor...'
                     containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2 }}
                     inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}
                     value={this.state.filterKey}
                     inputStyle={{ fontSize: 16 }} />

                 }
                 {devicesList}
                 <View style={{ height: 10, backgroundColor: '#fff' }}></View>
               </View>
               <Modal
                 animationType="slide"
                 transparent={true}
                 visible={this.state.deviceDiscoveryModalVisible}
                 onRequestClose={() => { this.showDeviceDiscoveryModal(false, false, false, true); }}
               >
                 <View style={styles.fullModalContainer}>
                   <View style={styles.modalContainer}>
                     <View style={styles.modalTitle}>
                       <Image
                         source={require('../../assets/images/search_27.png')}
                         style={styles.modalTitleAddButton}
                       />
                       <Text> Discover New Sensors </Text>
                     </View>
                     {deviceDiscoveryContainer}
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
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: '#636363',
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color : '#ff9900'
  },
  detailBlock: {
    backgroundColor: '#636363',
    marginBottom: 20,
    marginLeft: '5%',
    marginRight: '5%',
    borderRadius: 5,
    flexDirection: "column",
    maxHeight: '50%'
  },
  detailBlockTitleInfo: {
    marginLeft: 10,
    marginTop: 10,
    color: Constant.WHITE_TEXT_COLOR
  },
  detailBlockTitle: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 36,
    color: Constant.WHITE_TEXT_COLOR
  },
  roundButton: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: 'center',
    padding: 5,
    borderRadius: 16,
    marginRight: 12
  },
  cancelButton: {
    width: 60,
    margin: 10,
    padding: 6,
    borderRadius: 12,
    marginLeft: 12,
    backgroundColor: Constant.DARK_GREY_COLOR
  },
  registerButton: {
    width: 70,
    margin: 10,
    padding: 6,
    borderRadius: 12,
    marginLeft: 12,
    backgroundColor: Constant.PRIMARY_COLOR,
  },
  buttonText: {
    fontSize: 12,
    marginLeft: 7,
    color: Constant.WHITE_TEXT_COLOR,
    fontWeight: "bold",
    textAlign: 'center'
  },
  detailIcon: {
    backgroundColor: '#78787878',
    height: 24,
    width: 24,
    borderRadius: 12,
    marginLeft: 5
  },
  detailDeviceName: {
    color: Constant.GREY_TEXT_COLOR,
    fontSize: 10
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
  deviceList: {
    flex: 1
  },
  deviceListContainer: {
    flex: 1,
    justifyContent: "center",
  },
  deviceIcon: {
    backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
    height: 30,
    width: 30,
    borderRadius: 15,
    marginRight: 10
  },
  fullModalContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#78787885'
  },
  modalContainer: {
    width: '100%',
    minHeight: '90%',
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
  },
  deviceItem: {
    margin: 8,
    padding: 10,
    elevation: 5,
    width: "95%",
    backgroundColor: Constant.WHITE_BACKGROUND_COLOR
  }
});

mapStatesToProps = state => {
    this.connectedBle = state.ble.bleManager;
  return {
    devices: state.root.devices,
    devicesByGrowAreaId: state.root.devicesByGrowAreaId,
    isLoading: state.ui.isLoading,
    isMessage: state.ui.isMessage,
    bleDevices: state.ble.bleDevices,
    bleManager: state.ble.bleManager,
    deviceTypes: state.root.deviceTypes,
    registredDevice: state.ble.registredDevice,
    retry401Count: state.auth.retry401Count,

  }
};

mapDispatchToProps = dispatch => {


  return {
    onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
    onAddDevice: (device) => dispatch(addBleDevice(device)),
    onRemoveDevice: (deviceId) => dispatch(removeBleDevice(deviceId)),
    onSignoutDisconnect: (device) => dispatch(removeBleDevicefromDevice(device)),
    onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
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

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4();
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export const disconnectBleinDevice = () => {
  this.connectedBle.destroy();
}

export default connect(mapStatesToProps, mapDispatchToProps)(Devices);

