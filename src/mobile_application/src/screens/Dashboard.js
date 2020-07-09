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

  renderCount() {
      return (
        <View style={styles.listItem}>
          <ActivityIndicator size='large' />
        </View>
      )
   // }
  }

  renderPage() {
    
      return (
        <View style={styles.listItem}>
          <ActivityIndicator size='large' />
        </View>)
  }

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
    //backgroundColor: '#ff9900',
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

export default Dashboard;