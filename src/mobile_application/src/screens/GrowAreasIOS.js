import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Image, PermissionsAndroid, Alert, Platform, AsyncStorage, Dimensions
} from 'react-native';
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import * as RegistrationStates from '../RegistrationStates';
import { gateway_discovery_name_prefix, displayName as appName, debug } from './../../app.json';
import { connect } from 'react-redux';
import {
  getGrowAreas, registerGatewayToArrow, getContainers, getFacilities, deleteLedNodeProfile, deleteGatewayResponse,
  registerGateway, uiUpdateRegistrationState, getAllGateways, getGrowAreaTypes, addBleDevice, getUsers, removeBleDevicefromGrowarea
} from '../store/actions/rootActions';
import { BleManager } from 'react-native-ble-plx';
import { TextField } from 'react-native-material-textfield';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import { Menu, MenuTrigger, MenuOptions, MenuOption, MenuProvider } from 'react-native-popup-menu';
import { setBleManager } from '../store/actions/bleActions';
import Base64 from './../utils/Base64';
import { SearchBar, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MultiSelect from 'react-native-multiple-select';
import { Picker } from 'react-native-picker-dropdown'
import { Navigation } from 'react-native-navigation';



class GrowAreas extends Component {

  gatewayCharacteristics = {};
  visible = false;
  bleDevice = null;
  alreadyRegistredGateways = [];
  reteyConnection = 0;
  ConnectedDevice = null;
  errorCode = 0;
  reSendingPayloadCount = 0;

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE
  }
  constructor(props) {
    super(props);
    if (!this.props.bleManager) this.props.onSetBleManager(new BleManager());
    Navigation.events().bindComponent(this);
    this.state = {
      refreshing: false,
      modalVisible: false,
      registrationModalVisible: false,
      discoveredGateways: {},
      containerId: '',
      facilityId: '',
      bleMessage: '',
      bleError: '',
      gatewayUId: '',
      selectedUsers: [],
      users: [],
      currentUser: '',
      seleneVersion: '',
      showCancelButton: false,
      isGotAlreadyRegistredGateway: false,
      appleKey: false,
      growAreaType: '',
      token: '',
      gatewayName: '',
      
    };
  }


  componentDidAppear() {
    console.log('calling./././././');
    let containerId = this.state.containerId;
    this._onRefresh();
    this.props.bleManager.destroy()
    this.props.onSetBleManager(new BleManager());
    this.visible = true;
    this.forceUpdate();
    AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN', 'userEmail']).then(response => {

      let token = response[0][1];
      let appleKey = response[1][1];
      let currentUser = response[2][1];
      this.setState({ token, appleKey, currentUser }, () => {
        this.props.onGetGrowAreaTypes(true, this.state.token, this.state.appleKey);
        this.props.onGetUsers(true, this.state.token, this.state.appleKey);
        this.props.onGetFacilities(true, this.state.token, this.state.appleKey);
      });
      if ((containerId ? !this.props.growareasByContainerId[containerId] || this.props.growareasByContainerId[containerId].length === 0 : this.props.growareas.length === 0)) {
        this._onRefresh();
      }

    }).catch((e) => {
      console.log('error in geting asyncStorage\'s item:', e.message);
    })
    console.log('pdfmsdnv sv x', this.state, '\n apple key', this.state.appleKey);
  }

  componentDidDisappear() {
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
    AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN', 'userEmail']).then(response => {
      let token = response[0][1];
      let appleKey = response[1][1];
      if (this.search) this.search.clear();
      Promise.resolve(this.props.onGetGrowAreas(this.state.containerId, false, false, token, appleKey)).then(() => {
        this.props.onGetGrowAreas(undefined, false, false, token, appleKey)
        this.props.onGetUsers(true, token, appleKey);
        this.props.onGetGrowAreaTypes(true, token, appleKey);
        this.getListData();
        this.alreadyRegistredGateway(this.getListData())
        this.props.onGetAllGateways(token, this.state.containerId, undefined, appleKey);
        this.setState({ refreshing: false });
      });
    }).catch((e) => {
      console.log('error in geting asyncStorage\'s item in _onRefrreshGrowArea: ', e.message);
    })
  }

  onListItemClickHandler = growArea => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'GrowSectionsScreen',
        passProps: {
          selectedGrowArea: {
            id: growArea.id,
            name: growArea.grow_area_name,
            location: growArea.container.facility.locality.name,
            uid: growArea.grow_area_uid
          },
          selectedContainer: this.props.selectedContainer,
          selectedFacility: this.props.selectedFacility
        },
        options: {
          topBar: {
            title: {
              text: growArea.grow_area_name
            }
          }
        }
      }
    });

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
        console.log('state in iphone', state);

        if (state === 'PoweredOn') {
          this.props.bleManager.destroy()
          this.props.onSetBleManager(new BleManager());
          setTimeout(() => {
            if (this.state.isGotAlreadyRegistredGateway) {

              this.scanAndConnect();
              this.setState({ modalVisible: true, showCancelButton: true, bleMessage: '', bleError: '' });
              subscription.remove();
            } else {
              this.setState({ modalVisible: false, showCancelButton: false, bleMessage: '', bleError: '' });
            }
          }, 1000)


        }
        else if (state === 'PoweredOff') {
          if (Platform.OS === 'ios') {
            console.log('state in ios', state);

            Alert.alert('Permission required', appName + ' app wants to use your Bluetooth.. please enable it.', [{
              text: 'Ok', onPress: () => {
                this.setState({ modalVisible: false, showCancelButton: false, bleMessage: '', bleError: '' });
              }
            }], { cancelable: false });
            this.setState({ modalVisible: false, showCancelButton: false, bleMessage: '', bleError: '' });

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

  getUserForDisplay() {
    var users = [];
    if (this.props.users.length != 0) {
      this.props.users.map((user) => {
        if (user.email_id === this.state.currentUser) {
        } else {
          var displayName = `${user.username}(` + `${user.email_id})`
          users.push({ email_id: `${user.email_id}`, username: `${user.username}`, displayName, id: `${user.id}` })
          this.setState({ users })
        }
      })
    }
  }

  gatewayRegisterClickHandler = (bleGateway) => {
    console.log('register called', bleGateway, this.state.registrationModalVisible);
    this.setState({ registrationModalVisible: true })
    this.getUserForDisplay();
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
        gatewayMacId: bleGateway.name,
        waitingForGatewayLoader: false
      })
      console.log("gatewayMacId set");
    }
    else {
      this.setState({
        gatewayName: bleGateway.name,
        gatewayUId: bleGateway.id,
        growAreaType: {},
        modalVisible: false,
        gatewayDescription: 'My Description',
        registrationModalVisible: true,
        bleMessage: 'Connecting to device..',
        bleError: '',
        gatewayMacId: bleGateway.name.split(gateway_discovery_name_prefix)[1],
        waitingForGatewayLoader: false
      })
      console.log('macid in ios', this.state.registrationModalVisible);

    }
    this.connectAndDiscoverCharacteristics(bleGateway);
  }

  gatewayRegisterSubmitClickHandler = () => {
    this.errorCode = 0;
    let payload = {}
    let regEx = /^[a-zA-Z][a-zA-Z_.]{0,1}[ a-z|A-Z|0-9|_.:]*$/;
    if (this.state.gatewayName.trim() !== '' && this.state.gatewayName.length <= 25 && regEx.test(this.state.gatewayName.trim())) payload.name = this.state.gatewayName.trim();
    else { Alert.alert("Invalid Gateway name.", "Invalid Gateway name! Maximum length is 25. Name should start with alphabet and may contain dot, underscore, space and numeric value."); return; }
    if (this.state.gatewayUId.trim()) payload.uid = this.state.gatewayUId;
    else { alert("GatewayUId not found."); return; }
    if (this.state.gatewayDescription.length <= 200) payload.description = this.state.gatewayDescription;
    else { alert("Please provide valid gateway description. (Maximum length 200)"); return; }
    if (Object.keys(this.state.growAreaType).length !== 0) payload.growAreaType = this.state.growAreaType;
    else { alert("Please select valid Grow area type."); return; }
    if (this.state.gatewayMacId.trim()) payload.gatewayMacId = this.state.gatewayMacId
    else { alert("Gateway Mac address not found."); return; }
    if (this.state.facilityId.toString().trim()) payload.facilityId = this.state.facilityId
    else { alert("Please select valid Facility."); return; }
    if (this.state.containerId.toString().trim()) payload.containerId = this.state.containerId
    else {
      alert("Please select valid Container.");
      console.log('device', payload); return;
    }

    payload.users = this.props.users.filter(item => {
      return this.state.selectedUsers.includes(item.email_id);
    });
    payload.osName = 'Linux';
    console.log('[][][][][][][][][', payload);
    console.log('this.state.seleneversion-=-=-=-=-=-=-=-=-=', this.state.seleneVersion);

    Promise.resolve(this.props.onGatewayRegistrationToArrow(payload, this.bleDevice, this.state.seleneVersion)).then(() => {
      console.log("Done");
      this.setState({ seleneVersion: '', containerId: '', facilityId: '' })
    });
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
        return "Registering to " + appName + "..."
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
    console.log('visible, disconnectDevice', visible, disconnectDeivce);

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
      if (disconnectDeivce) {

        this.bleDevice.isConnected().then((isDeviceConnected) => {
          console.log('isDeviceConnected in groearea', isDeviceConnected, this.bleDevice);
          if (isDeviceConnected) {
            this.bleDevice.cancelConnection().then(() => {
              console.log('successfully disconnected in Groarea');
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

        if (device.name && device.name.startsWith(gateway_discovery_name_prefix) && !(this.alreadyRegistredGateways.includes(device.name.split(gateway_discovery_name_prefix)[1]))) {
          let preLength = Object.keys(discoveredGateways).length;
          discoveredGateways[device.id] = device;
          let latestLength = Object.keys(discoveredGateways).length;
          if (preLength < latestLength) {
            console.log("Name:" + device.name + "\nMac address:" + device.id);
            this.setState({ discoveredGateways: discoveredGateways, showCancelButton: false })
          }
        }
      });
    }
  }

  connectAndDiscoverCharacteristics(device) {
    console.log('in connectAndDiscoverCharacteristics', device);

    device.connect()
      .then((device) => {
        console.log('in connectAndDiscoverCharacteristics then 1');

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
        console.log('in connectAndDiscoverCharacteristics then 2');

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
                  this.ConnectedDevice = device;
                  this.setRegistrationModalVisible(true);
                }
              }
            })
          })
        })
        this.reteyConnection = 0;
      })
      .catch((error) => {
        console.log('in connectAndDiscoverCharacteristics catch 1', error);

        if (error.errorCode === 203) {
          device.cancelConnection().then(() => {
            this.connectAndDiscoverCharacteristics(device);
            console.log("Reconnecting to device.." + error.message);
          }).catch(error => {
            console.log('erroor at 203 ', error);
          });
        } else if (error.errorCode === 201) {
          console.log('in retry connection');
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

    setTimeout(() => {
      if (this.state.registrationModalVisible && this.state.bleMessage === 'Connecting to device..') {
        this.setState({
          registrationModalVisible: true,
          bleMessage: '',
          bleError: 'Error: Unable to connect to Gateway. Please try adding Gateway again.'
        }),
          device.cancelConnection().catch(error => {
            console.log("Device is already disconnected." + error.message);
          }).then(() => {
            console.log("Device is succesfully disconnected.");

          });
      }
    }, Constant.CONNECTION_TIMEOUT)
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

  writeCharacteristics(characteristic, payload, chunkSize, info) {
    console.log("type of", typeof (payload));
    var code = 0;
    if (typeof (payload) === 'object') {
      payload = JSON.stringify(payload);
    }
    console.log("Writing " + payload.length + " bytes to " + characteristic.uuid + " for " + info);
    characteristic.writeWithResponse(Base64.btoa(Constant.BLE_PAYLOAD_PREFIX), info).catch(error => {
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
        setTimeout(() => {
          Alert.alert('Provisioning Grow Area Failed.', 'Please try again.');
        }, 200);
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
            setTimeout(() => {
              Alert.alert('Provisioning Grow Area Failed.', 'Please try again.');
            }, 200);
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
          setTimeout(() => {
            Alert.alert('Provisioning Grow Area Failed.', 'Please try again.');
          }, 200);
        }
      }
    }).then(() => {
      if (this.errorCode == 1) {
        return console.log('code 1');
      } else {
        this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_STARTED_TO_INTERNAL_CLOUD);
        console.log('------------payload', this.props.internalCloudePayload);
        console.log('-------------ble', this.bleDevice);
        Promise.resolve(this.props.onRegisterGateway(this.props.internalCloudePayload, this.bleDevice, this.state.token, this.state.appleKey)).then(() => {
          this.bleDevice = null;
        });
      }
    });




  }

  onViewDevices(growArea) {
    console.log('-------this.state.id', this.state.gatewayUId);
    console.log('growArea', growArea);
    this.props.bleManager.destroy()
    this.props.onSetBleManager(new BleManager());

    Navigation.push(this.props.componentId, {
      component: {
        name: 'DevicesScreen',
        passProps: {
          selectedGrowArea: {
            id: growArea.id,
            name: growArea.grow_area_name,
            location: growArea.container.facility.locality.name,
            uid: growArea.grow_area_uid,
            macId: growArea.mac_id,
          },
          gateway: growArea,
          selectedContainer: this.props.selectedContainer,
          selectedFacility: this.props.selectedFacility
        },
        options: {
          topBar: {
            title: {
              text: growArea.grow_area_name,
            }
          }
        }
      }
    });
  }

  getListData() {
    let containerId = this.state.containerId;
    let data = containerId && !this.state.containerPicked ? this.props.growareasByContainerId[containerId] : this.props.growareas;
    if (this.state.filterKey) {
      const newData = data.filter(item => {
        const itemData = `${item.grow_area_name.toUpperCase()}`;
        console.log('-----------------------------itemdata-------------------------');
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1;
      });
      console.log("--------------------newData---------------");
      return newData;
    }
    console.log("----------------------data----------------");

    return data;

  }

  onClearSearch = () => {
  }

  alreadyRegistredGateway(registeredGateway) {
    try {
      console.log('data-0=0-0-------------------=-0-=0=-0-=0=-0=-0=-0=-0=-', registeredGateway);
      var data = []
      if (registeredGateway != undefined) {
        console.log("data", registeredGateway.length);

        registeredGateway.map((gateway) => {
          console.log('gateway maccc iddd', gateway.mac_id);

          console.log('mac id', gateway.mac_id);
          data.push(gateway.mac_id);
        })
        this.setState({ isGotAlreadyRegistredGateway: true })
        return data;
      }
      this.setState({ isGotAlreadyRegistredGateway: true })
      return [];
    } catch (e) {
      this.setState({ isGotAlreadyRegistredGateway: false })
      console.log('error in alreadyRegistered data', e);
      Alert.alert('Alert', 'Failed to get already provisioned gateway\'s list. Please try again');
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

  showCanselButtonMethod() {
    if (this.state.showCancelButton) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.showGatewayDiscoveryModal(false)}>
            <Text style={[styles.buttonText, { marginLeft: 0 }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  showCancelInRegistrationModal() {
    if (this.state.bleError) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.setRegistrationModalVisible(false, true)}>
            <Text style={[styles.buttonText, { marginLeft: 0 }]}>Ok</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  render() {

    if (this.props.isGatewayDeleted) {
      this._onRefresh();
      this.props.onGatewayDeletionResponse(false);
    }
    if (this.props.registrationState === RegistrationStates.REGISTRATION_PROCESS_COMPLETE) {
      this.setState({ modalVisible: false, registrationModalVisible: false });
      this._onRefresh();
      this.props.onUpdateRegistrationState(RegistrationStates.REGISTRATION_NOT_STARTED);
    }
    console.log("Rendering growAreas");
    let containerId = this.state.containerId;
    let listData = this.getListData() || [];

    let growAreasList = (

      <FlatList
        data={listData}
        renderItem={({ item, index }) => (
          <View style={(index === listData.length - 1) ? [styles.listItem, {
            borderBottomWidth: 2
          }] : styles.listItem}>
            <View style={{ width: '80%' }}>
              <TouchableOpacity onPress={() => this.onViewDevices(item)}>
                <View style={{}}>
                  <Text style={{ fontWeight: 'bold' }}>{debug ? item.id + '-' : ''}{item.grow_area_name}</Text>
                  <Text style={{}}>{item.mac_id}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1, height: 35 }} onPress={() => { }} />
            <View style={{ flexDirection: 'row' }}>
              <Icon name="wifi" size={24} style={item.latest_heartbeat_timestamp === 'true' ? { paddingRight: 10, color: Constant.PRIMARY_COLOR } : { paddingRight: 10, color: 'red' }} />
              <Icon name="delete" size={24} style={{ paddingRight: 10, color: 'grey' }} onPress={() => {
                item.latest_heartbeat_timestamp === 'true' ?
                  Alert.alert('Delete GrowArea', 'Are you sure you want to delete ' + item.grow_area_name + '?',
                    [
                      {
                        text: 'Cancel', onPress: () => {
                          console.log('delete operation was canceled.');
                        }, style: 'cancel'
                      },
                      {
                        text: 'Delete', onPress: () => {
                          console.log('delete operation start');
                          this.props.onDeleteGateway(this.state.token, item.id, this.state.appleKey);
                        }
                      },
                    ],
                    { cancelable: true }
                  ) :
                  Alert.alert('Delete GrowArea', `This Gateway seems to be out of network currently. If deleted now, a factory reset of the Gateway and all the devices provisioned under this Gateway is required in order to make them rediscoverable. Are you sure you want to delete this Gateway?`,
                    [
                      {
                        text: 'Cancel', onPress: () => {
                          console.log('delete operation was canceled.');
                        }, style: 'cancel'
                      },
                      {
                        text: 'Delete', onPress: () => {
                          console.log('delete operation start');
                          this.props.onDeleteGateway(this.state.token, item.id, this.state.appleKey);
                        }
                      },
                    ],
                    { cancelable: true }
                  )
              }} />
            </View>
          </View>
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

    if (this.state.containerId === '' || this.state.containerPicked === true) {
      growAreasList = (

        <FlatList
          data={listData}
          renderItem={({ item, index }) => (
            <View style={(index === listData.length - 1) ? [styles.listItem, {
              borderBottomWidth: 2
            }] : styles.listItem}>
              <View style={{ width: '80%' }}>
                <TouchableOpacity onPress={() => this.onViewDevices(item)}>
                  <View style={{}}>
                    <Text style={{ fontWeight: 'bold' }} >{debug ? item.id + '-' : ''}{item.grow_area_name}</Text>
                    <Text style={{}}>{item.mac_id}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ flex: 1, height: 35 }} onPress={() => { }} />
              <View style={{ flexDirection: 'row' }}>
                <Icon name="wifi" size={24} style={item.latest_heartbeat_timestamp === 'true' ? { paddingRight: 10, color: Constant.PRIMARY_COLOR } : { paddingRight: 10, color: 'red' }} />
                <Icon name="delete" size={24} style={{ paddingRight: 10, color: 'grey' }} onPress={() => {
                  item.latest_heartbeat_timestamp === 'true' ?
                    Alert.alert('Delete GrowArea', 'Are you sure you want to delete ' + item.grow_area_name + '?',
                      [
                        {
                          text: 'Cancel', onPress: () => {
                            console.log('delete operation was canceled.');
                          }, style: 'cancel'
                        },
                        {
                          text: 'Delete', onPress: () => {
                            console.log('delete operation start');
                            this.props.onDeleteGateway(this.state.token, item.id, this.state.appleKey);
                          }
                        },
                      ],
                      { cancelable: true }
                    ) :
                    Alert.alert('Delete GrowArea', `This Gateway seems to be out of network currently. If deleted now, a factory reset of the Gateway and all the devices provisioned under this Gateway is required in order to make them rediscoverable. Are you sure you want to delete this Gateway?`,
                      [
                        {
                          text: 'Cancel', onPress: () => {
                            console.log('delete operation was canceled.');
                          }, style: 'cancel'
                        },
                        {
                          text: 'Delete', onPress: () => {
                            console.log('delete operation start');
                            this.props.onDeleteGateway(this.state.token, item.id, this.state.appleKey);
                          }
                        },
                      ],
                      { cancelable: true }
                    )
                }} />
              </View>
            </View>
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

    if (this.props.isLoading) {
      growAreasList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
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
          <Text color="#00ff00">No grow areas found.</Text>
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
                    <Text style={{ fontSize: 10 }}>{info.item.name.split(gateway_discovery_name_prefix)[1]}</Text>
                  </View>
                  <TouchableOpacity style={[styles.roundButton, styles.registerButton]} onPress={() => {
                    this.setState({ registrationModalVisible: true });
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

    let selectFacilityPicker;
    if (!this.state.facilityId || this.state.facilityPicked) {
      selectFacilityPicker = (
        <View style={{ marginTop: 10 }}>
          <Text>Facility {debug && this.state.facilityId ? '(' + this.state.facilityId + ')' : ''}</Text>
          <View style={{ borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            <Picker
              mode="dialog"
              selectedValue={this.state.facilityId}
              style={{ width: '100%', height: 20, alignSelf: 'center', marginTop: 20 }}
              textStyle={{ fontSize: 15 }}
              onValueChange={(itemValue) => {
                this.setState({ facilityId: itemValue, facilityPicked: true })
                this.props.onGetContainers(itemValue, false, true, this.state.token, this.state.appleKey);
                console.log('√vvtest', this.state.facilityId == '' && this.props.containersByFacilityId[this.state.facilityId] ? false : true);

              }
              }>
              <Picker.Item label="Select Facility" value="" />
              {this.props.facilities.map((facility, i) => {
                return <Picker.Item key={i} value={facility.id} label={facility.facility_name} />
              })}
            </Picker>
          </View>
        </View>
      )
    }
    let selectContainerPicker;
    if (!this.state.containerId || this.state.containerPicked) {
      selectContainerPicker = (
        <View style={{ marginTop: 10 }}>
          <Text>Container {debug && this.state.containerId ? '(' + this.state.containerId + ')' : ''}</Text>
          <View style={{ borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>

            <Picker
              mode="dialog"
              selectedValue={this.state.containerId}
              style={(this.state.facilityId != '' && this.props.containersByFacilityId[this.state.facilityId] ? true : false) ? { width: '100%', alignSelf: 'center', height: 30, marginTop: 15 } : { width: '100%', alignSelf: 'center', height: 30, marginTop: 15, backgroundColor: '#DCDCDC' }}
              textStyle={{ fontSize: 15 }}
              disabled={!(this.state.facilityId != '' && this.props.containersByFacilityId[this.state.facilityId] ? true : false)}
              onValueChange={(itemValue) => this.setState({ containerId: itemValue, containerPicked: true })}>
              <Picker.Item label="Select Container" value="" />
              {
                this.state.facilityId && this.props.containersByFacilityId[this.state.facilityId] ?
                  this.props.containersByFacilityId[this.state.facilityId].length !== 0 ?
                    this.props.containersByFacilityId[this.state.facilityId].map((container, i) => {
                      console.log('container', JSON.stringify(this.props.containersByFacilityId[this.state.facilityId]));
                      return <Picker.Item key={i} value={container.id} label={container.container_name} />
                    }) : [{ id: 0, container_name: 'No Containers found for this facility. Please create one.' }].map((container, i) => {
                      return <Picker.Item key={i} value='' label={container.container_name} />
                    }) :
                  [].map((container, i) => {
                    return <Picker.Item key={i} value='' label={container.container_name} />
                  })
              }
            </Picker>
          </View>
        </View>
      )
    }

    let gatewayDetailsContainer = (
      <ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, padding: 10, borderBottomWidth: 1, }}> Register Gateway </Text>
        <ScrollView contentContainerStyle={styles.inputContainer}>
          <MultiSelect
            items={this.state.users.length > 0 ? this.state.users : []}
            uniqueKey="email_id"
            hideTags
            onSelectedItemsChange={users => this.onSelectedItemsChange(users)}
            selectedItems={this.state.selectedUsers}
            selectText="Pick Users"
            searchInputPlaceholderText="Search User"
            onAddItem={(text) => {
              console.log('OnAddItem called');
              console.log(text)
            }}
            tagRemoveIconColor="#CCC"
            tagBorderColor="#CCC"
            tagTextColor="#CCC"
            selectedItemTextColor="#CCC"
            selectedItemIconColor="#CCC"
            itemTextColor="#000"
            displayKey="displayName"
            hideSubmitButton
            searchInputStyle={{ color: '#CCC' }}
          />
          <TextField label='Gateway Name' onChangeText={(gatewayName) => this.setState({ gatewayName })} value={this.state.gatewayName} labelHeight={18} />
          <TextField label='Description' onChangeText={(gatewayDescription) => this.setState({ gatewayDescription })} value={this.state.gatewayDescription} labelHeight={18} />

          <Text>Grow Area Type</Text>
          <View style={{ borderBottomWidth: 1, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            <Picker
              mode="dialog"
              selectedValue={this.state.growAreaType}
              style={{ width: '100%', marginTop: 15, height: 30 }}
              textStyle={{ fontSize: 15 }}
              onValueChange={(itemValue) => {
                if (itemValue) this.setState({ growAreaType: itemValue })
                else this.setState({ growAreaType: {} })
              }}>
              <Picker.Item label="Select Grow Area Type" value='' />
              {this.props.growAreaTypes.map((growAreaType, i) => {
                return <Picker.Item key={i} value={growAreaType} label={growAreaType.grow_area_type_name} />
              })}
            </Picker>
          </View>
          {selectFacilityPicker}

          {selectContainerPicker}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10 }}>
          <Button title="Cancel" onPress={() => this.setRegistrationModalVisible(false, true)} />
          <Button onPress={this.gatewayRegisterSubmitClickHandler} title="Submit" />
        </View>
      </ScrollView>
    );

    if (this.props.registrationState && this.props.registrationState !== 0) {
      stateIndicator = (<ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />);
      if (this.props.registrationState === RegistrationStates.REGISTRATION_FAILED_TO_ARROW ||
        this.props.registrationState === RegistrationStates.FETCHING_CONFIG_FROM_ARROW_FAILED ||
        this.props.registrationState === RegistrationStates.REGISTRATION_FAILED_TO_INTERNAL_CLOUD ||
        this.props.registrationState === RegistrationStates.SENDING_DATA_TO_GATEWAY_UNSUCCESSFULL) {
        stateIndicator = (<Button title="Retry" onPress={() => {
          this.setState({ registrationModalVisible: false, containerId: '', facilityId: '' })
        }} />);
      } else if (this.props.registrationState === RegistrationStates.FETCHING_CONFIG_FROM_ARROW_SUCCESS) {
        console.log("REGISTRATION_SUCCESS_TO_INTERNAL_CLOUD");
        this.props.onUpdateRegistrationState(RegistrationStates.SENDING_PAYLOAD_TO_GATEWAY)
        var payload = {
          deviceClass: 'com.arrow.selene.device.self.SelfModule',
          name: this.state.gatewayName,
          uid: this.state.gatewayMacId,
          apikey: this.props.apiKey,
          secretkey: this.props.apiSecretKey,
          iotConnectUrl: Urls.ARROW_BASE_URL,
          iotConnectMqtt: Urls.ARROW_MQTT_BASE_URL,
          enabled: 'true',
          cloudTransferMode: "BATCH",
          cloudBatchSendingIntervalMs: "500",
          heartBeatIntervalMs: "900000",
          iotConnectMqttVHost: Urls.ARROW_MQTT_VHost,
          hid: this.props.gatewayHId,
          growhouseUrl: Urls.BASE_URL
        };
        console.log("REGISTRATION_SUCCESS_TO_INTERNAL_CLOUD2");
        console.log("UId:" + this.state.gatewayUId);
        var gatewayRegCharFound = false;
        Object.keys(this.gatewayCharacteristics[this.state.gatewayUId]).every((characteristicPrefix) => {
          console.log(characteristicPrefix, Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID);
          console.log(characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID);
          if (characteristicPrefix === Constant.KNOWN_BLE_CHARACTERISTICS.CHAR_GATEWAY_ACCOUNT_UUID) {
            gatewayRegCharFound = true;
            this.writeCharacteristics(this.gatewayCharacteristics[this.state.gatewayUId][characteristicPrefix], payload, (this.gatewayCharacteristics[this.state.gatewayUId].mtu - 3), 'gatewayInfo')


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
            <Text style={styles.listTitle}> Grow Areas</Text>
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
            <TouchableOpacity style={[styles.roundButton, styles.addNewButton]} onPress={() => {
              this.showGatewayDiscoveryModal(true)
              console.log('already provisioned gateways', this.props.alreadyProvisionedGateway.length);
              this.alreadyRegistredGateways = this.alreadyRegistredGateway(this.props.alreadyProvisionedGateway)
              this.setState({ discoveredGateways: {}, waitingForGatewayLoader: true })
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
              placeholder='Search grow area...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2, maxHeight: 34 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR, maxHeight: 34 }}
              inputStyle={{ fontSize: 16 }} />
          }
          {growAreasList}
          <View style={{ height: 2, backgroundColor: '#f3f3f3' }}></View>
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
                {this.state.waitingForGatewayLoader ? <ActivityIndicator size='large' color={Constant.PRIMARY_COLOR} style={{
                  alignSelf: 'flex-end',
                  justifyContent: 'center',
                  height: 30,
                  width: 30,
                  borderRadius: 15,
                  margin: 15
                }} /> : <View />}
              </View>
              {gatewayDiscoveryContainer}
              {this.showCanselButtonMethod()}

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
              {this.showCancelInRegistrationModal()}
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
    width: 80,
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
    height: 100,
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
    marginRight: '5%',
  },
  menuItem: { margin: 6 }
});

mapStatesToProps = state => {
  this.connectedBleGrowarea = state.ble.bleManager;

  return {
    growareas: state.root.growareas,
    growAreaTypes: state.root.growAreaTypes,
    facilities: state.root.facilities,
    containers: state.root.containers,
    containersByFacilityId: state.root.containersByFacilityId,
    growareasByContainerId: state.root.growareasByContainerId,
    isLoading: state.ui.isLoading,
    registrationState: state.ui.registrationState,
    gatewayHId: state.root.gatewayHId,
    apiKey: state.root.apiKey,
    apiSecretKey: state.root.apiSecretKey,
    bleManager: state.ble.bleManager,
    users: state.root.users,
    alreadyProvisionedGateway: state.root.allProvisionedGateways,
    internalCloudePayload: state.ble.payLoadForInternalCloud,
    isGatewayDeleted: state.gateway.isGatewayDeleted
  }
};

mapDispatchToProps = dispatch => {
  return {
    onGetGrowAreas: (containerId, inBackground, isLessThenVersion4, token, appleKey) => dispatch(getGrowAreas(containerId, inBackground, isLessThenVersion4, token, appleKey)),
    onGatewayRegistrationToArrow: (payload, bleDevice, seleneVersion) => dispatch(registerGatewayToArrow(payload, bleDevice, seleneVersion)),
    onUpdateRegistrationState: (state) => dispatch(uiUpdateRegistrationState(state)),
    onGetContainers: (facilityId, inBackground, showAlert) => dispatch(getContainers(facilityId, inBackground, showAlert)),
    onGetUsers: (inBackground, token, appleKey) => dispatch(getUsers(inBackground, token, appleKey)),
    onGetFacilities: (inBackground, token, appleKey) => dispatch(getFacilities(inBackground, token, appleKey)),
    onGetGrowAreaTypes: (inBackground, token, appleKey) => dispatch(getGrowAreaTypes(inBackground, token, appleKey)),
    onAddDevice: (device) => dispatch(addBleDevice(device)),
    onSetBleManager: (bleManager) => dispatch(setBleManager(bleManager)),
    onSignoutDisconnectFromGrowarea: (device) => dispatch(removeBleDevicefromGrowarea(device)),
    onGetAllGateways: (token, containerId, inBackground, appleKey) => dispatch(getAllGateways(token, containerId, inBackground, appleKey)),
    onRegisterGateway: (payload, bleDevice, token, appleKey) => dispatch(registerGateway(payload, bleDevice, token, appleKey)),
    onDeleteGateway: (token, id, appleKey) => dispatch(deleteLedNodeProfile(token, id, appleKey)),
    onGatewayDeletionResponse: (flag) => dispatch(deleteGatewayResponse(flag))
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


export const disconnectBleinGrowarea = () => {
  this.connectedBleGrowarea.destroy()
}

export default connect(mapStatesToProps, mapDispatchToProps)(GrowAreas);
