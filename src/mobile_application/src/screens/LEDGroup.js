import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator,
  TouchableOpacity, Image, ScrollView, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import { debug } from './../../app.json';
import { connect } from 'react-redux';
import {
  getGroupDetails
} from '../store/actions/rootActions';


import _ from 'lodash';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Navigation } from 'react-native-navigation';

class LEDGroup extends Component {

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

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE;
  }

  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);

    this.state = {
      token: '',

    };
  }

  componentDidAppear() {
    this._onRefresh();
    this.visible = true;
    this.forceUpdate();
  }

  componentDidDisappear() {
    this.visible = false;
    console.log(' in component will unmount');
  }



  _onRefresh = () => {
    AsyncStorage.getItem('accessToken').then((authToken) => {
      this.setState({ refreshing: true, searching: false, filterKey: '', token: authToken });
      Promise.resolve(this.props.onGetGroupDetails(authToken, this.props.groupId)).then(async () => {
        this.setState({ refreshing: false });
      });
    })
  }


  onViewProfileList() {
    console.log('--------going into profile list', this.props.info);
    Navigation.push(this.props.componentId, {
      component: {
        name: 'ProfileList',
        passProps: {
          groupId: this.props.groupId,
          channel_configuration: this.props.groupDetails.channel_configuration,
          info: this.props.info
        },
        options: {
          topBar: {
            title: {
              text: 'Profiles',
              color: '#fff',
            }
          },
        }
      }
    });
  }

  onViewEventScreen() {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'EventList',
        passProps: {
          groupId: this.props.groupId,
          channel_configuration: this.props.groupDetails.channel_configuration,
          info: this.props.info
        },
        options: {
          topBar: {
            title: {
              text: 'Events',
              color: '#fff',
            }
          },
        }
      }
    });
  }

  getListData() {
    if (this.state.filterKey) {
      const newData = this.props.groupDetails.added_devices.filter(item => {
        const itemData = `${item.device_name.toUpperCase()}`;
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
          (`${item.deviceUId.toUpperCase()}`).indexOf(this.state.filterKey.toUpperCase()) > -1;
      });
      return newData;
    }
    return this.props.groupDetails.added_devices;
  }

  onClearSearch = () => {
    this.setState({
      searching: false,
      filterKey: ''
    })
  }



  render() {
    let listData = this.getListData() || [];
    let devicesList;

    if (this.props.groupDetails.added_devices) {
      console.log('listdate condition = listData !== 0', listData, this.props.groupDetails.added_devices.length !== 0 && listData.length !== 0)
      if (this.props.groupDetails.added_devices.length !== 0 && listData.length !== 0) {
        devicesList = (
          <FlatList
            data={listData}
            renderItem={({ item, index }) => (
              <View style={(index === listData.length - 1) ? [styles.listItem, {
                borderBottomWidth: 2
              }] : styles.listItem}>
                <View style={{ width: '80%' }}>
                  <View style={{}}>
                    <Text style={{ fontWeight: 'bold' }} >{debug ? item.id + '-' : ''}{item.device_name}</Text>
                    <Text style={{}}>{item.deviceUId} </Text>
                  </View>

                </View>
                <View style={{ flex: 1, height: 35 }} />
                <View style={{ flexDirection: 'row' }}>
                  <Icon name="wifi" size={24} style={item.status === 'true' ? { paddingRight: 10, color: Constant.PRIMARY_COLOR } : { paddingRight: 10, color: 'red' }} />
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
            <Text color="#00ff00">No devices found.</Text>

          </ScrollView>
        );
      }
    }
    let detailBlock = (<View />);

    getDetailBlockTitleStyle = function (title) {

      var fontSize = 20;
      return {
        marginLeft: 10,
        marginRight: 10,
        fontSize: fontSize,
        color: Constant.WHITE_TEXT_COLOR
      }
    }


    if (this.props.groupDetails.channel_configuration) {
      detailBlock = (
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockTitleInfo}>Group Name</Text>
          <Text numberOfLines={1} style={getDetailBlockTitleStyle(this.props.groupName)}>{this.props.groupDetails.group_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: "center", marginBottom: 10 }}>
            <Text numberOfLines={3} style={styles.locationTitleInfo}>
              {this.props.groupDetails.description}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly' }}>
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 1</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH1}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 2</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH2}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 3</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH3}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 4</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH4}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 5</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH5}</Text>
            </View>
            <View style={{ width: 1, height: '100%', backgroundColor: Constant.GREY_TEXT_COLOR }} />
            <View style={{ flexDirection: 'column', alignItems: "center", }}>
              <Text style={styles.detailDeviceName}>CH 6</Text>
              <Text style={styles.detailDeviceCount}>{this.props.groupDetails.channel_configuration.CH6}</Text>
            </View>
          </View>


          <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10, marginLeft: 10 }}>
            <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.PRIMARY_COLOR }]} onPress={() => {
              this.onViewProfileList();
            }}>
              <Text style={styles.buttonText}>Profiles</Text>
              <Image source={require('../../assets/images/view_20.png')} style={styles.detailIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.ORANGE_COLOR }]} onPress={() => {
              this.onViewEventScreen();
            }}>
              <Text style={styles.buttonText}>Events</Text>
              <Image source={require('../../assets/images/view_20.png')} style={styles.detailIcon} />
            </TouchableOpacity>

          </View>
        </View>
      );
    }
    if (this.props.individualGroupLoading) {
      return (
        <View style={styles.container}>
          <View style={styles.greenBackgroundContainer} />
          <View style={[styles.container, { justifyContent: 'center' }]}>
            <ActivityIndicator size='large' color={Constant.PRIMARY_COLOR} ></ActivityIndicator>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <View style={styles.greenBackgroundContainer} />
        {detailBlock}
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.listTitle, { flex: 1 }]}> Devices</Text>
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
              value={this.state.filterKey}
              lightTheme
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search device...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}
              inputStyle={{ fontSize: 16 }} />
          }
          {devicesList}
          <View style={{ height: 10, backgroundColor: '#fff' }}></View>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constant.WHITE_BACKGROUND_COLOR
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
    color: Constant.WHITE_TEXT_COLOR
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
    fontSize: 20
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
  return {
    groupDetails: state.LEDGroup.groupDetails,
    individualGroupLoading: state.LEDGroup.individualGroupLoading
  }
};

mapDispatchToProps = dispatch => {
  return {
    onGetGroupDetails: (token, id) => dispatch(getGroupDetails(token, id))
  }
};




export default connect(mapStatesToProps, mapDispatchToProps)(LEDGroup);
