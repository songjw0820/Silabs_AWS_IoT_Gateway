import React, { Component } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator,
  Platform, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';
import { connect } from 'react-redux';
import Slide from './SlideComponent';
import {
  getDashboardCount, getAlerts
} from '../store/actions/rootActions';
import Swiper from 'react-native-swiper';
import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/Ionicons';




class Dashboard extends Component {

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE
  }

  imageUri = {
    'OK': require('../../assets/images/gray-plant.png'),//green-plant //baki
    'Soil needs attention': require('../../assets/images/water-drop.png'),//water-drop,
    'Need Sunlight': require('../../assets/images/yellow-plant.png'),//yellow-plant
    'More Temperature': require('../../assets/images/red-plant.png'),//red-plant
    'Need Sunlight@#$More Temperature': require('../../assets/images/RY-plant.png'), //RY-plant
    'More Temperature@#$Need Sunlight': require('../../assets/images/RY-plant.png'), //RY-plant
    'Soil needs attention@#$More Temperature': require('../../assets/images/RB-plant.png'), //RB-plant
    'More Temperature@#$Soil needs attention': require('../../assets/images/RB-plant.png'), //RB-plant
    'Soil needs attention@#$Need Sunlight': require('../../assets/images/BY-plant.png'), //BY-plant
    'Need Sunlight@#$Soil needs attention': require('../../assets/images/BY-plant.png'), //BY-plant
    'Soil needs attention@#$Need Sunlight@#$More Temperature': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'Need Sunlight@#$Soil needs attention@#$More Temperature': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'Soil needs attention@#$More Temperature@#$Need Sunlight': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'Need Sunlight@#$More Temperature@#$Soil needs attention': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'More Temperature@#$Need Sunlight@#$Soil needs attention': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'More Temperature@#$Soil needs attention@#$Need Sunlight': require('../../assets/images/RBY-plant.png'), //RBY-plant
    'Battery needs attention': require('../../assets/images/battery-red.png'), //battery-red
    'Temperature needs attention': require('../../assets/images/Thermometer-03.png'), //thermometer-03
    'Battery needs attention@#$Temperature needs attention': require('../../assets/images/battery-thermo_BT-icon.png'), //battery-thermo_BT-icon.svg
    'Temperature needs attention@#$Battery needs attention': require('../../assets/images/battery-thermo_BT-icon.png'), //battery-thermo_BT-icon.svg
    'Soil needs attention@#$Temperature needs attention': require('../../assets/images/water-thermo_TW-icon.png'), //water-thermo_TW-icon.svg
    'Temperature needs attention@#$Soil needs attention': require('../../assets/images/water-thermo_TW-icon.png'), //water-thermo_TW-icon.svg
    'Soil needs attention@#$Battery needs attention': require('../../assets/images/battery-water_BW-icon.png'), //battery-water_BW-icon.svg
    'Battery needs attention@#$Soil needs attention': require('../../assets/images/battery-water_BW-icon.png'), //battery-water_BW-icon.svg
    'Latest device information is not available': require('../../assets/images/gray-plant.png'), //grey-plant
    'Device is not available': require('../../assets/images/gray-plant.png'), // grey plant
    'Soil needs attention@#$Battery needs attention@#$Temperature needs attention': require('../../assets/images/TWB-icon.png'),  // TWB-icon.svg
    'Battery needs attention@#$Soil needs attention@#$Temperature needs attention': require('../../assets/images/TWB-icon.png'),  // TWB-icon.svg
    'Soil needs attention@#$Temperature needs attention@#$Battery needs attention': require('../../assets/images/TWB-icon.png'),  // TWB-icon.svg
    'Battery needs attention@#$Temperature needs attention@#$Soil needs attention': require('../../assets/images/TWB-icon.png'),  // TWB-icon.svg
    'Temperature needs attention@#$Battery needs attention@#$Soil needs attention': require('../../assets/images/TWB-icon.png'),  // TWB-icon.svg
    'Temperature needs attention@#$Soil needs attention@#$Battery needs attention': require('../../assets/images/TWB-icon.png')   // TWB-icon.svg
  }

  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    this.eventSubscription = Navigation.events().registerNavigationButtonPressedListener(this.MenuIconPrressed);
    this.state = {
      token: '',
      sideMenuVisible: false
    };
  }

  componentDidAppear() {
    AsyncStorage.getItem('accessToken').then((authToken) => {
      this.setState({ token: authToken });
      this.props.onGetDashboardCount(authToken);
      this.props.onGetDashboardAlerts(authToken);

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





  formatStandardTime = (date) => {

    let time = date.toLocaleTimeString();
    time = time.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);
    console.log('second', seconds, time);

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
    timeValue += Platform.OS === 'ios' ? ':' + time[2] : (seconds < 10) ? ":0" + seconds : ":" + seconds;  // get seconds
    timeValue += Platform.OS === 'ios' ? '' : (hours >= 12) ? " PM" : " AM";  // get AM/PM

    return timeValue
  }



  renderCount() {
    if (this.props.dashboardCount.devices_count) {
      return (
        <View style={styles.listItem}>
          <Text style={{ alignSelf: 'flex-start', color: '#fff' }}>Summary</Text>
          <View style={{ height: 1, width: '100%', marginTop: 10, backgroundColor: '#000' }}>
          </View>
          <View horizontal style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginLeft: 10, marginRight: 10, width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, paddingLeft: 10, paddingRight: 10 }}>
                <Text style={styles.detailDeviceName}>Facilities</Text>
                <Text style={styles.detailDeviceCount}>{this.props.dashboardCount.facilities_count}</Text>
              </View>
              <View style={{ width: 2, height: 40, alignSelf: 'center', backgroundColor: Constant.GREY_TEXT_COLOR, marginLeft: 10 }} />
            </View>
            <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, paddingLeft: 10, paddingRight: 10 }}>
              <Text style={styles.detailDeviceName}>Containers</Text>
              <Text style={styles.detailDeviceCount}>{this.props.dashboardCount.containers_count}</Text>
            </View>
            <View style={{ width: 2, height: 40, alignSelf: 'center', backgroundColor: Constant.GREY_TEXT_COLOR, marginLeft: 10 }} />

            <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10, paddingLeft: 10, paddingRight: 10 }}>
              <Text style={styles.detailDeviceName}>Grow Areas</Text>
              <Text style={styles.detailDeviceCount}>{this.props.dashboardCount.grow_areas_count}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', marginLeft: -10, }}>
            <View style={{ flexDirection: 'column', alignItems: "center", }}>

              <View style={{ flexDirection: 'column', alignItems: "center", marginTop: 15, backgroundColor: '#737373' }}>
                <Text style={styles.detailDeviceCount}>{this.props.dashboardCount.devices_count.devicetype_count.light_nodes_count}</Text>
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 5 }}>LED Nodes</Text>
              </View>

            </View>
            <View style={{ flexDirection: 'column', alignItems: "center", marginLeft: 10 }}>
              <View style={{ flexDirection: 'column', alignItems: "center", marginTop: 15, backgroundColor: '#737373' }}>
                <Text style={styles.detailDeviceCount}>{this.props.dashboardCount.devices_count.devicetype_count.soil_nodes_count}</Text>
                <Text style={{ color: '#fff', fontWeight: 'bold', paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 5 }}>Soil Nodes</Text>
              </View>
            </View>
          </View>
        </View>
      )
    } else {
      return (
        <View style={styles.listItem}>
          <ActivityIndicator size='large' />
        </View>
      )
    }
  }



  renderAlerts() {
    return this.props.dashboardAlerts.map((slide, index) => {
      let alertName = slide.profileVirtualName + `[${slide.growSectionName}]`;
      let properties = JSON.parse(slide.properties)
      let message = slide.alertMessage.split('@#$');
      let timeStamp = new Date(slide.timestamp).toLocaleDateString() + ' | ' + this.formatStandardTime(new Date(slide.timestamp));
      console.log('messages --------', message);

      return (
        <View style={{
          flex: 1, marginVertical: '2%', justifyContent: 'center', alighItems: 'center',
        }}>
          <Slide
            gatewayName={slide.growAreaName}
            alertName={alertName}
            properties={properties}
            uri={this.imageUri[slide.alertMessage]}
            messages={message}
            timeStamp={timeStamp}
          />
        </View>
      );
    })


  }

  renderPage() {
    console.log('calling', this.props.dashboardAlerts);

    if (this.props.dashboardAlerts) {
      return (
        <View style={[styles.listContainer, { flex: 1 }]}>
          {this.renderCount()}
          <Swiper style={styles.wrapper} showsButtons={false} autoplay activeDotStyle={{ backgroundColor: Constant.PRIMARY_COLOR }}>
            {this.renderAlerts()}
          </Swiper>
        </View>
      )

    } else {
      return (
        <View style={styles.listItem}>
          <ActivityIndicator size='large' />
        </View>)
    }
  }
  render() {
    return (
      <View style={[styles.container, { flex: 2 }]}>
        <View style={styles.greenBackgroundContainer} />
        {this.renderPage()}
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
    position: 'absolute',
  },
  listContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constant.LIGHT_GREY_COLOR,
    marginLeft: '5%',
    marginRight: '5%',
    borderRadius: 5,
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
    marginTop: -5
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
  },
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB',
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  }

});

mapStatesToProps = state => {
  return {
    dashboardCount: state.dashboard.dashboardCount,
    dashboardAlerts: state.dashboard.dashboardAlerts
  }
};

mapDispatchToProps = dispatch => {


  return {
    onGetDashboardCount: (token) => dispatch(getDashboardCount(token)),
    onGetDashboardAlerts: (token) => dispatch(getAlerts(token))

  }
};



export default connect(mapStatesToProps, mapDispatchToProps)(Dashboard);