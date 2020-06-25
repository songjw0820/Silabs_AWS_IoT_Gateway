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
  getDevices, setBleManager, addBleDevice, removeBleDevice, getDeviceTypes, clearCurrentData,
  registerDevices, getGrowAreaCounts, authSetUser, getRecentData, removeBleDevicefromDevice, deleteDeviceResponse, deleteDevice
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
  growSectionId = null;
  growAreaId = null;
  growAreaName = null;
  location = null;
  deviceCharacteristics = {};
  connectedDevices = [];
  ledSelections = ["R", "G", "B", "NC"];
  defaultLedSelection = "NC";
  device = null;
  growAreaUId = null;
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


  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    if (!this.props.manager) this.props.onSetBleManager(new BleManager());

    this.deviceTypeList = [{ "id": 1, "device_type_name": "SoilNode", "device_type_display_name": "Soil Node" },
    { "id": 2, "device_type_name": "LightShield", "device_type_display_name": "Light Shield" },
    { "id": 3, "device_type_name": "LedNode", "device_type_display_name": "Led Node" },
    { "id": 4, "device_type_name": "SCMNode", "device_type_display_name": "SCM Node" }];

    this.LEDChannelConfrugration = [
      { id: '1', displayChannel: 'R', value: 'R' },
      { id: '2', displayChannel: 'G', value: 'G' },
      { id: '3', displayChannel: 'B', value: 'B' },
      { id: '4', displayChannel: 'UV A', value: 'UV A' },
      { id: '5', displayChannel: 'UV B', value: 'UV B' },
      { id: '6', displayChannel: 'UV C', value: 'UV C' },
      { id: '7', displayChannel: 'RB  ', value: 'RB' },
      { id: '8', displayChannel: 'CW', value: 'CW' },
      { id: '9', displayChannel: 'NW', value: 'NW' },
      { id: '10', displayChannel: 'Y', value: 'Y' },
      { id: '11', displayChannel: 'A', value: 'A' },
      { id: '12', displayChannel: 'O', value: 'O' },
      { id: '13', displayChannel: 'WW', value: 'WW' },
      { id: '14', displayChannel: 'DR', value: 'DR' },
      { id: '15', displayChannel: 'FR', value: 'FR' },
      { id: '16', displayChannel: 'IR', value: 'IR' },
      { id: '17', displayChannel: 'NC', value: 'NC' }
    ]


    this.state = {
      token: '',
      errorCode: 0,
      refreshing: false,
      selectedLeds: {},
      deviceDiscoveryModalVisible: false,
      discoveredDevices: {},
      deviceRegistrationModalVisible: false,
      callbackRegistredDevices: 0,
      isRegistrationProcessCompleted: false,
      ch1set: false,
      showCancelButton: false,
      waitingDeviceLoader: false,
      // discoveredDevices: { "000B57FFFEF199AA": { "eui64": "000B57FFFEF199AA", "deviceType": "LedNode", "ledconfigurationflag": 0, "ledconfiguration": { "led1": "R", "led2": "G", "led3": "B", "led4": "NC", "led5": "G", "led6": "B" } }, "000B67FFFEF199AA": { "eui64": "000B67FFFEF199AA", "deviceType": "SoilNode" }, "000B77FFFEF199AA": { "eui64": "000B77FFFEF199AA", "deviceType": "LedNode" } },
    };

    if (this.props.selectedGrowSection) { // redirect from grow section
      this.growSectionId = this.props.selectedGrowSection.id;
    }
    if (this.props.selectedGrowArea) { // redirect from grow area
      this.growAreaId = this.props.selectedGrowArea.id;
      this.growAreaName = this.props.selectedGrowArea.name;
      this.growAreaLocation = this.props.selectedGrowArea.location;
      this.growAreaUId = this.props.selectedGrowArea.uid;
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
      await this.props.onGetDevices(authToken, this.growSectionId, this.growAreaId);
      this.setState({ refreshing: false })
      console.log(JSON.stringify(this.props.deviceTypes));
      this.props.onGetDeviceTypes(authToken);
      if (this.growAreaId) {
        this.props.onGetCountsByGrowAreaId(this.growAreaId);
      }

      let growSectionId = this.growSectionId;
      let growAreaId = this.growAreaId;
      if (growSectionId) {
        if (growSectionId ? (!this.props.devicesByGrowSectionId[growSectionId] || this.props.devicesByGrowSectionId[growSectionId].length === 0) : this.props.devices.length === 0) {
          this._onRefresh();
        }
      }
      else if (growAreaId) {
        if (growAreaId ? (!this.props.devicesByGrowAreaId[growAreaId] || this.props.devicesByGrowAreaId[growAreaId].length === 0) : this.props.devices.length === 0) {
          this._onRefresh();
        }
      }
      else if (this.props.devices.length === 0) {
        this._onRefresh();
      }
    })
  }

  componentDidDisappear() {
    this.visible = false;
    this.setState({ errorCode: 1 });
    console.log(' in component will unmount');
    if (this.provisionCallbackCharSubscription) {
      console.log('keepprovision callback');

      this.provisionCallbackCharSubscription.remove();
    }
  }



  _onRefresh = () => {
    this.props.onClearCurrentData();
    AsyncStorage.getItem('accessToken').then((authToken) => {
      this.setState({ refreshing: true, searching: false, filterKey: '', token: authToken });
      Promise.resolve(this.props.onGetDevices(authToken, this.growSectionId, this.growAreaId)).then(async () => {
        await this.getCurrentData();
        this.setState({ refreshing: false, calledGetCurrentData: false });

      });
      console.log(JSON.stringify(this.props.deviceTypes));
      this.props.onGetDeviceTypes(authToken);
      if (this.growAreaId) {
        this.props.onGetCountsByGrowAreaId(this.growAreaId);
      }
    })
  }

  getCurrentData = (data) => {

    let result = [];
    if (data) {
      console.log('data.length------------>', data.length);

      data.map((listItem, i) => {
        return result.push({ deviceHid: listItem.deviceHId })
      });
      this.props.onGetRecentData(result, this.state.token);
      console.log('called 1');
    }
  }

  formatDate = (value) => {
    return value.getMonth() + 1 + "/" + value.getDate() + "/" + value.getFullYear();
  }

  formatStandardTime = (date) => {

    let time = date.toLocaleTimeString();
    time = time.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);

    // calculate
    var timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue = "" + hours;
    } else if (hours > 12) {
      timeValue = "" + (hours - 12);
    } else if (hours == 0) {
      timeValue = "12";
    }
    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
    timeValue += (seconds < 10) ? ":0" + seconds : ":" + seconds;  // get seconds
    timeValue += (hours >= 12) ? " PM" : " AM";  // get AM/PM

    return timeValue
  }


  renderData(deviceHId) {
    console.log(deviceHId, 'calling');
    if (this.props.currentData[deviceHId]) {
      return (
        this.props.currentData[deviceHId].map((listitem, index) => {
          console.log('listitem--0-', listitem, index);
          return (
            <View style={{ flexDirection: 'row', justifyContent: 'center', height: '100%', alignItems: 'flex-start' }}>
              <View style={[{ flexDirection: 'column', justifyContent: 'center', alignItems: "center", }, Object.keys(this.props.currentData[deviceHId]).length > 3 ? { marginLeft: 10, paddingLeft: 10, paddingRight: 10 } : {}]}>
                <Text style={styles.detailDeviceName}>{listitem.display_property_name}</Text>
                <Text style={styles.detailDeviceCount}>{listitem.value}</Text>
              </View>
              {index < Object.keys(this.props.currentData[deviceHId]).length - 1
                ? (<View style={{ width: 2, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR, marginHorizontal: 10 }} />)
                : (<View />)}
            </View>
          )
        })
      )
    }
  }

  // redirecting to the live chart screen of selected device
  openLiveChart = (device, subscriptionKey) => {
    let deviceType = device.device_type.virtual_device_type_name ? device.device_type.virtual_device_type_name : device.device_type.device_type_name;
    let screenName = 'LiveChart';
    if (liveChartDebug && device.id % 2 !== 0) {
      screenName = 'LiveChart2';
    }

    Navigation.push(this.props.componentId, {
      component: {
        name: screenName,
        passProps: {
          subscriptionKey: subscriptionKey,
          deviceName: device.device_name,
          deviceType,
          deviceId: device.id
        },
        options: {
          topBar: {
            visible: true,
            animate: true,
            elevation: 0,
            shadowOpacity: 0,
            drawBehind: false,
            hideOnScroll: false,
            background: {
              color: Constant.NAVIGATION_BACK_COLOR,
            },
            backButton: {
              color: '#fff',
            },
            title: {
              text: "Live Chart",
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

  // redirecting to the historical chart screen of selected device
  openHistoricalChart = (device) => {
    let screenName = 'History';
    let deviceType = device.device_type.virtual_device_type_name ? device.device_type.virtual_device_type_name : device.device_type.device_type_name;
    Navigation.push(this.props.componentId, {
      component: {
        name: screenName,
        passProps: {
          deviceName: device.device_name,
          deviceType,
          deviceId: device.id,
          deviceHid: device.deviceHId
        },
        options: {
          topBar: {
            visible: true,
            animate: true,
            elevation: 0,
            shadowOpacity: 0,
            drawBehind: false,
            hideOnScroll: false,
            background: {
              color: Constant.NAVIGATION_BACK_COLOR,
            },
            backButton: {
              color: '#fff',
            },
            title: {
              text: screenName,
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

  // redirecting to the LED control screen
  openLedControl = (device) => {

    let screenName = 'Led Control';
    let deviceType = device.device_type.virtual_device_type_name ? device.device_type.virtual_device_type_name : device.device_type.device_type_name;


    Navigation.push(this.props.componentId, {
      component: {
        name: screenName,
        passProps: {
          deviceName: device.device_name,
          deviceType,
          deviceId: device.id,
          deviceHid: device.deviceHId,
          deviceStatus: device.status
        },
        options: {
          topBar: {
            visible: true,
            animate: true,
            elevation: 0,
            shadowOpacity: 0,
            drawBehind: false,
            hideOnScroll: false,
            background: {
              color: Constant.NAVIGATION_BACK_COLOR,
            },
            backButton: {
              color: '#fff',
            },
            title: {
              text: screenName,
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
        'Device Provision',
        'Are you sure, you want to discard discovered devices?',
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
    if (this.deviceProvisionChar && this.device) {
      this.provisionRequestSent = true;
      let payload = Object.values(this.state.discoveredDevices);
      this.writeCharacteristics(this.deviceProvisionChar, payload, (this.deviceCharacteristics[this.device.id].mtu - 3), 'sendProvisionDevices')
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
            this._onRefresh()
            this.onTimeRegistredDevices = 0;
          }
        }, (this.onTimeRegistredDevices * 20000))
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



  redirectToGrowSections() {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'GrowSectionsScreen',
        passProps: {
          selectedGrowArea: {
            id: this.growAreaId,
            name: this.growAreaName,
            location: this.location,
            uid: this.growAreaUId
          },
          selectedContainer: this.props.selectedContainer,
          selectedFacility: this.props.selectedFacility
        },
        options: {
          topBar: {
            title: {
              text: this.growAreaName
            }
          }
        }
      }
    });
  }


  redirectToLEDGrops() {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'LEDGroupsScreen',
        passProps: {
          growAreaId: this.growAreaId,
          info: {
            gateway: this.props.gateway,
          }
        },
        options: {
          topBar: {
            visible: true,
            animate: true,
            elevation: 0,
            shadowOpacity: 0,
            drawBehind: false,
            hideOnScroll: false,
            background: {
              color: Constant.NAVIGATION_BACK_COLOR,
            },
            backButton: {
              color: '#fff',
            },
            title: {
              text: 'Groups',
              color: '#fff',
            }
          },
          layout: {
            orientation: ['portrait'] // An array of supported orientations
          },
        }
      }
    });
  }

  checkForGatewayConnection = (inBackground) => {
    console.log('id', this.GatewayMacID, this.growAreaId);
    console.log('gatewauys in redux0-0-0-0-0-0-0-0-0-0-0-0-', this.props.bleDevices);

    if (this.growAreaUId) {
      console.log('in this.pros.----------------', this.props.bleDevices[this.GatewayMacID]);

      if (this.props.bleDevices[this.GatewayMacID]) {
        this.device = this.props.bleDevices[this.GatewayMacID];
        console.log("Device found in redux..", this.device);
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
                    bleMessage: 'Required characteristics not found. Disconnecting from device..',
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
                  var deviceProvisionCallbackCharFound = false;
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
            bleMessage: 'Error: Unable to connect to Gateway. Please try adding Device again.',
            waitingDeviceLoader: false
          })
          console.log("Error: " + error.message)
          console.log("ErrorCode:" + error.errorCode)
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
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
          Alert.alert('Provisioning Devices Failed.', 'Please try again.');
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
          if (message === Constant.BLE_PAYLOAD_PREFIX)
            validPayload = '';
          else if (message === Constant.BLE_PAYLOAD_SUFFIX) {
            if (isJsonString(validPayload)) {
              let payload = JSON.parse(validPayload);
              validPayload = '';
              if (payload.hasOwnProperty('eui64') && payload.hasOwnProperty('deviceType')) {
                console.log('payload.deviceType', payload.deviceType, payload);

                this.getDeviceType(payload.deviceType).then(type => {
                  console.log('type', type);
                  payload.decision = false;
                  payload.deviceName = '';
                  payload.displayDeviceType = type
                  discoveryResponse[payload.eui64] = payload;
                  console.log('device--=', discoveryResponse);
                  this.setState({
                    discoveredDevices: discoveryResponse,
                    showCancelButton: false
                  });
                }).catch((error) => {
                  alert(error)
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
          }
        }
      }
    }, 'myDeviceTransaction');
  }

  getDeviceType(provisionTimeDeviceType) {
    return new Promise((resolve, reject) => {
      for (var i = 0; i < this.deviceTypeList.length; i++) {
        console.log(i, 'times');

        if (this.deviceTypeList[i].device_type_name === provisionTimeDeviceType) {
          return resolve(this.deviceTypeList[i].device_type_display_name);
        } 1
      }

      resolve(provisionTimeDeviceType);
    });
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
            if (device.hasOwnProperty('deviceUid') && !device.hasOwnProperty('eui64'))
              device.eui64 = device.deviceUid;
            if (device.hasOwnProperty('eui64') && device.hasOwnProperty('deviceUid') && this.growAreaUId) {
              let payload = {};
              console.log('devicePayload:' + JSON.stringify(device));
              console.log('DiscoveredDevicesKey:' + JSON.stringify(Object.keys(this.state.discoveredDevices)));
              if (this.state.discoveredDevices.hasOwnProperty(device.eui64) && this.props.deviceTypes) {
                let deviceObj = this.state.discoveredDevices[device.eui64];
                console.log('device_type', deviceObj.deviceType);
                console.log('deviceObj.result------------', device.result);

                if (deviceObj.hasOwnProperty('deviceName') && deviceObj.hasOwnProperty('deviceType') && this.props.deviceTypes[deviceObj.deviceType]) {


                  payload.deviceUId = device.deviceUid;
                  payload.device_name = deviceObj.deviceName;
                  payload.device_type = {}
                  payload.device_type.device_type_name = deviceObj.deviceType;
                  payload.device_type.id = this.props.deviceTypes[deviceObj.deviceType];
                  payload.eui64 = device.eui64;
                  payload.grow_area = {}
                  payload.grow_area.id = this.growAreaId;
                  if (deviceObj.deviceType === 'LedNode' && deviceObj.hasOwnProperty('ledconfiguration'))
                    payload.ledconfiguration = deviceObj.ledconfiguration;
                  provisionCallbackResponse = payload;

                }
                else {
                  alert('Wrong deviceType found.');
                }
              } else {
                if (this.props.deviceTypes)
                  console.log("Invalid eui64 found.")
                else console.log('deviceTypes not found.')
              }
            } else {
              console.log('eui64 or deviceUid or GrowAreaUid not found.')
            };
            console.log(JSON.stringify(provisionCallbackResponse), 'ffdsfsdf', device.result);
            if (Object.keys(provisionCallbackResponse).length > 0 && device.result === 'true') {
              console.log('this.count================', this.props.registredDevice, this.state.callbackRegistredDevices);
              if (this.state.callbackRegistredDevices === 0 && this.props.registredDevice === 0) {
                this.setState({ callbackRegistredDevices: 1 })
              }
              this.setState({ callbackRegistredDevices: this.props.registredDevice + this.state.callbackRegistredDevices });
              this.props.onRegisterDevices(provisionCallbackResponse);
            }
            validPayload = '';
          }
          else {
            console.log("Invalid JSON:" + validPayload);
            validPayload = '';
            this.setState(
              {
                onTimeRegistredDevices: this.state.onTimeRegistredDevices--
              }
            )
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
          bleMessage: 'Searching for ' + (this.growAreaName ? "'" + this.growAreaName + "'" : 'Grow house (gateway).')
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
                      bleMessage: 'Error: Unable to connect to Gateway. Please try adding Device again.',
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
                bleMessage: 'Grow house (gateway) scan failed.',
                waitingDeviceLoader: false
              })
            }
          }
          return;
        }

        if (device.name && device.id) {
          this.connectedBle = device;
          console.log("DeviceName:" + device.name + "\nDeviceId:" + device.id);
          console.log(this.growAreaUId + "=" + device.id + "=")
          console.log('this.macId', this.props.selectedGrowArea.macId);
          console.log('this condition', device.name.indexOf(this.props.selectedGrowArea.macId) !== -1);



          if (device.name.indexOf(this.props.selectedGrowArea.macId) !== -1 || bleDebug) {
            if (bleDebug) this.growAreaUId = device.id;
            this.props.bleManager.stopDeviceScan();
            this.props.onSignoutDisconnect(device)
            console.log("Connecting to device");
            this.GatewayMacID = device.id;
            if (!inBackground) {
              this.setState({
                bleMessage: 'Connecting to GrowHouse...',
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

  tryDeviceConnection = (device, inBackground) => {
    device.connect()
      .then((device) => {
        console.log("Grow area connected");
        this.device = device;
        this.props.onAddDevice(device);
        console.log("Adding device..");
        if (!inBackground) this.askForDevices(device);
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
            bleMessage: 'Error: Unable to connect to Gateway. Please try adding Device again.',
            waitingDeviceLoader: false
          })
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
            this.setState({
              bleMessage: 'Error: Unable to connect to Gateway. Please try adding Device again.',
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
        bleMessage: "Waiting for devices...",
        waitingDeviceLoader: true
      });
      setTimeout(() => {
        console.log('after 3.5 min flag', this.state.showCancelButton, this.state.deviceDiscoveryModalVisible, '---->', this.state);

        if (this.state.showCancelButton && this.state.deviceDiscoveryModalVisible) {
          this.showDeviceDiscoveryModal(false, false, false, false);
          this.setState({ errorCode: 1 });
          alert('No devices found.')
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

  deleteDevice(device) {
    console.log('devices---', device);

    if (device.status) {
      Alert.alert('Delete Device', 'Are you sure you want to delete ' + device.device_name + '?',
        [
          {
            text: 'Cancel', onPress: () => {
              console.log('delete operation was canceled.');
            }, style: 'cancel'
          },
          {
            text: 'Delete', onPress: () => {
              console.log('delete operation start');
              this.props.onDeleteDevice(device.id, this.state.token)
            }
          },
        ],
        { cancelable: true }
      )
    } else {
      Alert.alert('Delete Device', 'This Device seems to be out of network currently. If deleted now, a factory reset of the device is required in order to make it rediscoverable. Are you sure you want to delete this Device?',
        [
          {
            text: 'Cancel', onPress: () => {
              console.log('delete operation was canceled.');
            }, style: 'cancel'
          },
          {
            text: 'Delete', onPress: () => {
              console.log('delete operation start');
              this.props.onDeleteDevice(device.id, this.state.token)

            }
          },
        ],
        { cancelable: true }
      )
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
            Alert.alert('Provisioning Devices Failed.', 'Please try again.');
          }
          this.connectivitySubscription.remove();
        } else {
          console.log('\n\n\n response.value', Base64.atob(response.value));
          this.setState({ errorCode: 1 });
          var value = Base64.atob(response.value);
          if (value === '\u0000') {
            alert('Gateway is not connected to the cloud')
            this.showDeviceDiscoveryModal(false, false, false, false)
            this.deviceConectivityCharFound = false;
            this.connectivitySubscription.remove();
          } else {
            alert('Gateway is connected to the cloud')
            this.deviceConectivityCharFound = false;
            this.connectivitySubscription.remove();
            return {}
          }
        }
      })
      this.deviceConectivityCharFound = false

    }

  }

  getListData() {
    let growSectionId = this.growSectionId;
    let growAreaId = this.growAreaId;
    let data = growAreaId ? this.props.devicesByGrowAreaId[growAreaId] : this.props.devices;
    data = growSectionId ? this.props.devicesByGrowSectionId[growSectionId] : data;

    if (this.state.filterKey) {
      const newData = data.filter(item => {
        const itemData = `${item.device_name.toUpperCase()}`;
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
          `${item.eui64.toUpperCase()}`.indexOf(this.state.filterKey.toUpperCase()) > -1;
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
  // difrenceating device whether it is LED node or else to decide which control device has.
  renderControls(info) {
    if (info.item.device_type.device_type_name == "LedNode") {
      let timeStamp = [];
      let timeStampToDisplay;
      if (this.props.currentData[info.item.deviceHId]) {
        this.props.currentData[info.item.deviceHId].map((data) => {
          timeStamp.push(data.timestamp)
          timeStampToDisplay = this.isValidDate(new Date(_.max(timeStamp))) ? this.formatDate(new Date(_.max(timeStamp))) + ' | ' + this.formatStandardTime(new Date(_.max(timeStamp))) : '- | - ';
        })
      } else {
        return this.getCurrentData(listData);
      }
      return (
        <View style={styles.listItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, }}>
            <View style={{ flexDirection: 'column', width: '40%', color: '#fff', marginLeft: 10 }}>
              <Text style={{ alignSelf: 'flex-start', width: '60%', color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{debug ? info.item.id + '-' : ''}{info.item.device_name}</Text>
              <Text style={{ width: '60%', marginTop: 10, color: '#fff', }}>{debug ? info.item.id + '-' : ''}{info.item.eui64}</Text>
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <Icon name="wifi" size={24} style={{ paddingLeft: 10, color: info.item.status === true ? Constant.PRIMARY_COLOR : 'red', alignSelf: 'flex-end', paddingRight: 10 }} />

              <Text style={{ marginTop: 15, color: '#fff', paddingRight: 10 }}>{debug ? info.item.id + '-' : ''}{timeStampToDisplay ? timeStampToDisplay : '- | - '}</Text>
            </View>
          </View>
          <View style={{ height: 1, width: '100%', marginTop: 10, backgroundColor: '#000' }}>
          </View>

          <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', marginLeft: -10, }}>
            <View style={{ flexDirection: 'column', alignItems: "center", marginTop: 15, }}>
              <View style={{ flexDirection: 'column', alignItems: "center", backgroundColor: '#737373' }}>
                <Icon name="cog" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                  this.openLedControl(info.item);
                }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 5, paddingBottom: 5 }}>LED Control</Text>
              </View>

            </View>
            <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, marginTop: 15 }}>
              <View style={{ flexDirection: 'column', alignItems: "center", backgroundColor: '#737373', }}>
                <MaterialIcon name="delete" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                  this.deleteDevice(info.item);
                }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', alignSelf: 'center', paddingHorizontal: 25, paddingBottom: 5 }}>Delete</Text>
              </View>
            </View>
          </View>
        </View>

      );
    }

    else {
      if (info.item.deviceHId && info.item.grow_area && info.item.grow_area.grow_area_hid && this.props.currentData) {
        console.log('json log', JSON.stringify(this.props.currentData[info.item.deviceHId]));
        let timeStamp = [];
        let timeStampToDisplay;
        if (this.props.currentData[info.item.deviceHId]) {
          this.props.currentData[info.item.deviceHId].map((data) => {

            console.log('dataItem', data.name, data.value, data.timestamp);
            timeStamp.push(data.timestamp)
            console.log('max timestamp', _.max(timeStamp));
            timeStampToDisplay = this.isValidDate(new Date(_.max(timeStamp))) ? this.formatDate(new Date(_.max(timeStamp))) + ' | ' + this.formatStandardTime(new Date(_.max(timeStamp))) : '- | - ';
          })
        } else {
          return this.getCurrentData(listData);
        }

        return (
          <View style={styles.listItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
              <View style={{ flexDirection: 'column', color: '#fff', width: '40%', marginLeft: 10 }}>
                <Text style={{ alignSelf: 'flex-start', color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{debug ? info.item.id + '-' : ''}{info.item.device_name}</Text>
                <Text style={{ width: '60%', marginTop: 10, color: '#fff', }}>{debug ? info.item.id + '-' : ''}{info.item.eui64}</Text>
              </View>
              <View style={{ flexDirection: 'column' }}>
                <Icon name="wifi" size={24} style={{ paddingLeft: 10, color: info.item.status === true ? Constant.PRIMARY_COLOR : 'red', paddingRight: 10, alignSelf: 'flex-end' }} />

                <Text style={{ marginTop: 15, color: '#fff' }}>{debug ? info.item.id + '-' : ''}{timeStampToDisplay ? timeStampToDisplay : '- | - '}</Text>
              </View>
            </View>

            <View style={{ height: 1, width: '100%', marginTop: 10, backgroundColor: '#000' }}>
            </View>

            {

              Object.keys(this.props.currentData[info.item.deviceHId]).length > 3
                ? (
                  <ScrollView showsHorizontalScrollIndicator={false} horizontal style={{ flexDirection: 'row', backgroundColor: 'red', marginTop: 10, marginLeft: 10, marginRight: 10, width: '100%' }}>
                    {this.renderData(info.item.deviceHId)}

                  </ScrollView>
                ) : (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: "center", marginTop: 10, width: '100%', marginLeft: 0, }}>
                    {this.renderData(info.item.deviceHId)}
                  </View>
                )
            }



            <View style={{ justifyContent: 'space-evenly', flexDirection: 'row', marginTop: 10, alignItems: 'center', width: '100%' }}>
              <View style={{ flexDirection: 'column', alignItems: "center", backgroundColor: '#737373' }}>
                <Icon name="eye" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                  this.openLiveChart(info.item, info.item.deviceHId);
                }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 15, paddingBottom: 5 }}>Live Chart</Text>
              </View>

              <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, backgroundColor: '#737373' }}>
                <Icon name="history" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                  this.openHistoricalChart(info.item);
                }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 25, paddingBottom: 5 }}>History</Text>
              </View>


              <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, backgroundColor: '#737373', justifyContent: 'center' }}>
                <MaterialIcon name="delete" size={24} style={{ padding: (0, 0, 0, 10), color: '#fff' }} onPress={() => {
                  this.deleteDevice(info.item);
                }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingHorizontal: 25, paddingBottom: 5 }}>Delete</Text>
              </View>
            </View>
          </View>
        );
      }
      else {
        return (
          <View style={styles.listItem}>
            <Text>{debug ? info.item.id + '-' : ''}{info.item.device_name}</Text>
            <TouchableOpacity style={{ flex: 1, height: 20 }} onPress={() => { }} />
            <Icon name="eye-slash" size={24} style={{ paddingRight: 10 }} onPress={() => {
              if (liveChartDebug) {
                this.openLiveChart(info.item, Urls.LIVE_CHART_HIDS);
              } else {
                alert("Live chart not supported for this device...");
              }
            }} /><Icon name="history" size={24} style={{ paddingRight: 10 }} onPress={() => {
              this.openHistoricalChart(info.item);
            }} />
          </View>
        );
      }
    }

  }

  isValidDate(d) {
    return d instanceof Date && !isNaN(d);
  }




  render() {

    if (this.props.retry401Count === 20 && !this.state.enabled401) {
      this.setState({ deviceDiscoveryModalVisible: false, deviceRegistrationModalVisible: false, enabled401: true })
    }


    if (this.props.isDeviceDeleted) {
      console.log('in rednder state', this.props.isDeviceDeleted);

      this._onRefresh();
      this.props.onDeviceDeletionResponse(false);
    }



    console.log("Rendering devices", this.props.currentData);
    let growSectionId = this.growSectionId;
    let growAreaId = this.growAreaId;
    listData = this.getListData() || [];

    let devicesList;

    if (listData) {
      console.log('list data:     ', listData.length);

      if (listData.length !== 0) {
        if (this.props.currentData) {
          if (this.props.currentData.length === 0) {
            devicesList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
            if (!this.state.calledGetCurrentData) {
              this.getCurrentData(listData);
              console.log('called listdata---=-==-=-=-=-=-=-=-=-=>');

              this.setState({ calledGetCurrentData: true })
            }
          } else {
            devicesList = (
              <FlatList
                data={listData}
                renderItem={(info) => (
                  this.renderControls(info)
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
          }
        }
      } else {
        console.log('no device condition........');

        devicesList = (
          <ScrollView contentContainerStyle={styles.activityIndicator}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh}
                colors={['red', 'green', 'blue']}
              />
            }>
            <Text color="#00ff00">No devices found.</Text>

          </ScrollView>
        );
      }
    } else {
      devicesList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
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
              // requiresSameParentToManageScrollView
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
                        placeholder='Device Name'
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
                      <Text style={{ fontSize: 10, marginTop: 5 }}>Device Type</Text>
                      <Text style={{ fontSize: 12, fontWeight: "bold" }}>{
                        info.item.displayDeviceType
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
                          let selectedLeds = this.state.selectedLeds;
                          console.log(JSON.stringify(discoveredDevices));
                          if (!discoveredDevices[info.item.eui64].decision && this.state.discoveredDevices[info.item.eui64].deviceType === 'LedNode') {
                            if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                            for (var ledNo = 1; ledNo <= 6; ledNo++) {
                              if (!discoveredDevices[info.item.eui64].ledconfiguration['led' + ledNo]) {
                                discoveredDevices[info.item.eui64].ledconfiguration['led' + ledNo] = this.defaultLedSelection;
                                selectedLeds[info.item.eui64 + 'led' + ledNo] = true;
                              }
                            }
                          }
                          discoveredDevices[info.item.eui64].decision = !discoveredDevices[info.item.eui64].decision;
                          this.setState({
                            discoveredDevices: discoveredDevices,
                            selectedLeds: selectedLeds
                          })
                          console.log(JSON.stringify(discoveredDevices));
                        }
                      }}
                      checkBoxColor='green'
                      isChecked={this.state.discoveredDevices[info.item.eui64].decision}
                    />
                  </View>
                  {this.state.discoveredDevices[info.item.eui64].deviceType === 'LedNode' &&
                    <View>
                      <View style={{ backgroundColor: Constant.LIGHT_GREY_COLOR, marginTop: 5, marginBottom: 5, height: 2, width: "100%" }} />
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
                        <Text> CH 1 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led1 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led1 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led1 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led1'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                        <Text> CH 2 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led2 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led2 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led2 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led2'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                      </View>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
                        <Text> CH 3 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led3 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led3 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led3 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led3'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                        <Text> CH 4 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led4 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led4 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led4 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led4'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                      </View>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
                        <Text> CH 5 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led5 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led5 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led5 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led5'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                        <Text> CH 6 : </Text>
                        <View style={{ width: "35%", borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
                          <Picker
                            selectedValue={this.state.discoveredDevices[info.item.eui64].ledconfiguration && this.state.discoveredDevices[info.item.eui64].ledconfiguration.led6 ? this.state.discoveredDevices[info.item.eui64].ledconfiguration.led6 : this.defaultLedSelection}
                            enabled={(this.state.discoveredDevices[info.item.eui64].ledconfigurationflag === 0) ? true : false}
                            onValueChange={(itemValue) => {
                              let discoveredDevices = this.state.discoveredDevices;
                              if (!discoveredDevices[info.item.eui64].ledconfiguration) discoveredDevices[info.item.eui64].ledconfiguration = {}
                              discoveredDevices[info.item.eui64].ledconfiguration.led6 = itemValue;
                              let selectedLeds = this.state.selectedLeds;
                              selectedLeds[info.item.eui64 + 'led6'] = true;
                              this.setState({ discoveredDevices: discoveredDevices, selectedLeds: selectedLeds })
                            }
                            }>
                            {this.LEDChannelConfrugration.map((channel, i) => {
                              return <Picker.Item key={i} label={channel.displayChannel} value={channel.value} />
                            })}
                          </Picker>
                        </View>
                      </View>
                    </View>}
                </View>
              )}
              keyExtractor={(item) => item.eui64.toString()}
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
    if (this.growAreaId && !this.growSectionId) {

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

      let countObj = {};
      console.log("CountObj found:" + JSON.stringify(this.props.countsByGrowAreaId[this.growAreaId]));
      if (this.props.countsByGrowAreaId && this.props.countsByGrowAreaId[this.growAreaId] && this.props.countsByGrowAreaId[this.growAreaId][Constant.DEVICES_COUNT] && this.props.countsByGrowAreaId[this.growAreaId][Constant.DEVICES_COUNT][Constant.DEVICE_TYPE_COUNT]) {
        console.log("Setting countObj")
        countObj = this.props.countsByGrowAreaId[this.growAreaId][Constant.DEVICES_COUNT][Constant.DEVICE_TYPE_COUNT];
        console.log("Set....");
        console.log(JSON.stringify(countObj));
      }

      detailBlock = (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockTitleInfo}>Grow Area Name</Text>
          <Text numberOfLines={1} style={getDetailBlockTitleStyle(this.growAreaName)}>{this.growAreaName}</Text>
          <View style={{ flexDirection: 'row', alignItems: "center", marginBottom: 10 }}>
            <Text style={styles.locationTitleInfo}>Location:</Text>
            <Text style={styles.locationInfo}>{this.growAreaLocation}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly' }}>

            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>Soil Nodes</Text>
              <Text style={styles.detailDeviceCount}>{countObj.hasOwnProperty(Constant.SOIL_NODE_COUNT) ? countObj[Constant.SOIL_NODE_COUNT] : Constant.DEFAULT_DEVICE_COUNT}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>Light Nodes</Text>
              <Text style={styles.detailDeviceCount}>{countObj.hasOwnProperty(Constant.LIGHT_NODE_COUNT) ? countObj[Constant.LIGHT_NODE_COUNT] : Constant.DEFAULT_DEVICE_COUNT}</Text>
            </View>

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
              <Text style={styles.buttonText}>Devices</Text>
              <Image source={require('../../assets/images/add_24.png')} style={styles.detailIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.ORANGE_COLOR, width: 95, height: 35 }]} onPress={() => this.redirectToGrowSections()}>
              <Text style={styles.buttonText}>Sections</Text>
              <Image source={require('../../assets/images/view_20.png')} style={styles.detailIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.ORANGE_COLOR, width: 85, height: 35 }]} onPress={() => this.redirectToLEDGrops()}>
              <Text style={styles.buttonText}>Groups</Text>
              <Image source={require('../../assets/images/view_20.png')} style={styles.detailIcon} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.deviceRegistrationModalVisible}
          onRequestClose={() => { }}
        >
          <View style={{ justifyContent: 'center', flex: 1, backgroundColor: '#rgba(0, 0, 0, 0.5)' }}>
            <View style={{ alignItems: 'center', backgroundColor: '#fff' }}>
              <ActivityIndicator size='large' color='green' style={{ marginTop: 20 }} />
              <Text style={{ alignSelf: 'center', marginTop: 20 }}> Your {this.onTimeRegistredDevices === 1 ? 'device is ' : 'devices are '}provisioning{debug ? this.onTimeRegistredDevices : ''}.</Text>
              <Text style={{ alignSelf: 'center', marginTop: 0, marginBottom: 20 }}>This process may take time. </Text>
              <Text style={{ alignSelf: 'center', marginTop: 20, marginBottom: 20 }}>Successfully registered devices: {this.state.callbackRegistredDevices}</Text>
              {this.closeRegistrationModal()}
            </View>

          </View>

        </Modal>
        <View style={styles.greenBackgroundContainer} />
        {detailBlock}
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.listTitle, { flex: 1 }]}> Devices{debug ? ' (' + Object.keys(this.props.bleDevices).length + ')' : ''}</Text>
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
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search device...'
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
                <Text> Discover New Devices </Text>
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
    backgroundColor: '#636363'
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
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
  locationTitleInfo: {
    marginLeft: 10,
    fontSize: 10,
    color: Constant.GREY_TEXT_COLOR
  },
  locationInfo: {
    marginLeft: 4,
    marginRight: 10,
    fontSize: 12,
    fontWeight: "bold",
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
  detailDeviceCount: {
    color: Constant.GREY_TEXT_COLOR,
    fontSize: 30
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
  this.connectedBle = state.ble.disconnectBleFromDevice
  this.connectedBle = state.ble.bleManager;
  return {
    devices: state.root.devices,
    devicesByGrowSectionId: state.root.devicesByGrowSectionId,
    devicesByGrowAreaId: state.root.devicesByGrowAreaId,
    isLoading: state.ui.isLoading,
    bleDevices: state.ble.bleDevices,
    bleManager: state.ble.bleManager,
    deviceTypes: state.root.deviceTypes,
    countsByGrowAreaId: state.root.countsByGrowAreaId,
    countLoading: state.ui.countLoading,
    registredDevice: state.ble.registredDevice,
    currentData: state.device.currentData,
    isDeviceDeleted: state.device.isDeviceDeleted,
    retry401Count: state.auth.retry401Count

  }
};

mapDispatchToProps = dispatch => {


  return {
    onGetDevices: (token, growSectionId, growAreaId) => dispatch(getDevices(token, growSectionId, growAreaId)),
    onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
    onAddDevice: (device) => dispatch(addBleDevice(device)),
    onRemoveDevice: (deviceId) => dispatch(removeBleDevice(deviceId)),
    onGetDeviceTypes: (token) => dispatch(getDeviceTypes(token)),
    onRegisterDevices: (device) => dispatch(registerDevices(device)),
    onSignoutDisconnect: (device) => dispatch(removeBleDevicefromDevice(device)),
    onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
    onGetCountsByGrowAreaId: (growAreaId, inBackground) => dispatch(getGrowAreaCounts(growAreaId, inBackground)),
    onGetRecentData: (devices, token) => dispatch(getRecentData(devices, token)),
    onDeleteDevice: (deviceId, token) => dispatch(deleteDevice(deviceId, token)),
    onDeviceDeletionResponse: (flag) => dispatch(deleteDeviceResponse(flag)),
    onClearCurrentData: () => dispatch(clearCurrentData())

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
