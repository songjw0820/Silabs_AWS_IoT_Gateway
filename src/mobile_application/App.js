import FacilitiesScreen from './src/screens/Facilities';
import ContainersScreen from './src/screens/Containers';
import GrowAreasScreenIOS from './src/screens/GrowAreasIOS';
import GrowAreasScreen from './src/screens/GrowAreas';
import GrowSectionsScreen from './src/screens/GrowSections';
import DevicesScreen from './src/screens/Devices';
import DevicesScreenIOS from './src/screens/DevicesIOS';
import LoginScreen from './src/screens/Login';
import SideDrawer from './src/screens/SideDrawer';
import { AsyncStorage, Alert } from 'react-native';
import { Navigation } from 'react-native-navigation';
import * as Constant from './src/Constant';
import { debug, allowExceptionsInDevMode } from './app.json';
import configureStore from "./src/store/configureStore";
import { Provider } from "react-redux";
import Icon from 'react-native-vector-icons/Ionicons';
import WebSocketIOS from './src/screens/WebSocketIOS';
import WebSocket from './src/screens/WebSocket';
import WebSocket2 from './src/screens/WebSocket2';
import RNRestart from 'react-native-restart'; // Import package from node modules 
import HistoricalChartIOS from './src/screens/HistoricalChartIOS';
import HistoricalChart from './src/screens/HistoricalChart';
import LedControlIOS from './src/screens/LedControlIOS';
import LedControl from './src/screens/LedControl';
import Dashboard from './src/screens/Dashboard';
import LEDGroupsList from './src/screens/LEDGroupsList';
import LEDGroup from './src/screens/LEDGroup';
import GroupProfileControl from './src/screens/GroupProfile';
import EventList from './src/screens/EventList';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { Platform } from 'react-native';
import profileList from './src/screens/profileList';
let tabCount = 0;
let position = false;



const store = configureStore();


Navigation.registerComponentWithRedux('FacilitiesScreen', () => FacilitiesScreen, Provider, store);

Navigation.registerComponentWithRedux('ContainersScreen', () => ContainersScreen, Provider, store);

Navigation.registerComponentWithRedux('GrowAreasScreen', () => (Platform.OS === 'ios' ? GrowAreasScreenIOS : GrowAreasScreen), Provider, store);

Navigation.registerComponentWithRedux('GrowSectionsScreen', () => GrowSectionsScreen, Provider, store);

Navigation.registerComponentWithRedux('DevicesScreen', () => (Platform.OS === 'ios' ? DevicesScreenIOS : DevicesScreen), Provider, store);

Navigation.registerComponentWithRedux('LoginScreen', () => LoginScreen, Provider, store);

Navigation.registerComponentWithRedux('SideDrawer', () => SideDrawer, Provider, store);

Navigation.registerComponentWithRedux('LiveChart', () => (Platform.OS === 'ios' ? WebSocketIOS : WebSocket), Provider, store);

Navigation.registerComponentWithRedux('LiveChart2', () => WebSocket2);

Navigation.registerComponentWithRedux('History', () => (Platform.OS === 'ios' ? HistoricalChartIOS : HistoricalChart), Provider, store);

Navigation.registerComponentWithRedux('Led Control', () => (Platform.OS === 'ios' ? LedControlIOS : LedControl), Provider, store);

Navigation.registerComponentWithRedux('DashboardScreen', () => Dashboard, Provider, store);

Navigation.registerComponentWithRedux('LEDGroupsScreen', () => LEDGroupsList, Provider, store);

Navigation.registerComponentWithRedux('IndividualLedScreen', () => LEDGroup, Provider, store)

Navigation.registerComponentWithRedux('ProfileList', () => profileList, Provider, store)

Navigation.registerComponentWithRedux('GroupProfile', () => GroupProfileControl, Provider, store)

Navigation.registerComponentWithRedux('EventList', () => EventList, Provider, store)


const forceAppQuit = false;
const executeDefaultHandler = true;

const jsExceptionhandler = (error, isFatal) => {
  if (isFatal) {
    console.log("\n\n\n\n\nJSExceptionHandler:" + error);
    Alert.alert(
      'Unexpected error occurred',
      `
            Error: ${(isFatal) ? 'Fatal:' : ''} ${error.name} ${error.message}

            We will need to restart the app.
            `,
      [{
        text: 'Restart',
        onPress: () => {
          RNRestart.Restart();
        }
      }]
    );
    Alert.alert(
      'Unexpected error occurred',
      `We will need to restart the app.${error.message}`,
      [{
        text: 'Restart',
        onPress: () => {
          RNRestart.Restart();
        }
      }],
      { cancelable: false }
    );
  } else {
    console.log("\n\n\n\n\nJSExceptionHandler:" + error); // So that we can see it in the ADB logs in case of Android if needed
  }
  // This is your custom global error handler
  // You do stuff like show an error dialog
  // or hit google analytics to track crashes
  // or hit a custom api to inform the dev team.
};
setJSExceptionHandler(jsExceptionhandler, allowExceptionsInDevMode);
// - exceptionhandler is the exception handler function
// - allowInDevMode is an optional parameter is a boolean.
//   If set to true the handler to be called in place of RED screen
//   in development mode also.

const nativeExceptionhandler = exceptionString => {
  console.log("\n\n\n\n\nNative Exception:" + exceptionString);
  return {}
  // This is your custom global error handler
  // You do stuff likehit google analytics to track crashes.
  // or hit a custom api to inform the dev team.
  //NOTE: alert or showing any UI change via JS
  //WILL NOT WORK in case of NATIVE ERRORS.
};

setNativeExceptionHandler(
  nativeExceptionhandler,
  forceAppQuit,
  executeDefaultHandler
);

// - exceptionhandler is the exception handler function
// - forceAppQuit is an optional ANDROID specific parameter that defines
//    if the app should be force quit on error.  default value is true.
//    To see usecase check the common issues section.
// - executeDefaultHandler is an optional boolean (both IOS, ANDROID)
//    It executes previous exception handlers if set by some other module.
//    It will come handy when you use any other crash analytics module along with this one
//    Default value is set to false. Set to true if you are using other analytics modules.


export default (pageIndex) => {
  Navigation.setDefaultOptions({
    bottomTabs: {
      hideShadow: true,
      backgroundColor: 'white'
    },
    layout: {
      orientation: 'portrait'
    }
  });
  Promise.all([
    AsyncStorage.getItem('accessToken'),
    Icon.getImageSource("ios-menu", 30)
  ]).then(sources => {
    if (!sources[0]) {
      Navigation.setRoot({
        root: {
          component: {
            name: 'LoginScreen'
          }
        }
      });

    } else {
      startTABBasedNavigation(pageIndex, sources[1]);

    }
  });
}


const startTABBasedNavigation = (pageIndex, iconSrc) => {
  let index = pageIndex ? pageIndex : 0;
  Navigation.setRoot({
    root: {
      sideMenu: {
        id: 'SideMenu',
        left: {
          component: {
            id: 'sideDrawer',
            name: 'SideDrawer',
          },
        },
        center: {
          root: {

          },
          bottomTabs: {
            id: 'BottomTabsId',
            children: [
              {
                stack: {
                  id: 'FACILITY',
                  children: [{
                    component: {
                      name: 'FacilitiesScreen',
                      options: {
                        bottomTab: {
                          text: 'Facilities',
                          icon: require('./assets/images/facilities.png'),
                          iconColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,

                        },
                        topBar: {
                          title: {
                            text: 'My Facilities',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white',

                            }
                          ]
                        },
                        popGesture: true,
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
              {
                stack: {
                  id: 'CONTAINER',
                  children: [{
                    component: {
                      name: 'ContainersScreen',
                      options: {
                        bottomTab: {
                          text: 'Containers',
                          icon: require('./assets/images/containers.png'),
                          iconColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Containers',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
              {
                stack: {
                  id: 'GROWAREA',
                  children: [{
                    component: {
                      name: 'GrowAreasScreen',
                      options: {
                        bottomTab: {
                          text: 'Grow Area',
                          icon: require('./assets/images/growarea.png'),
                          iconColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Grow Areas',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
              {
                stack: {
                  id: 'GROWSECTION',
                  children: [{
                    component: {
                      name: 'GrowSectionsScreen',
                      options: {
                        bottomTab: {
                          text: 'Grow Section',
                          icon: require('./assets/images/growsection.png'),
                          iconColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Grow Sections',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
              {
                stack: {
                  id: 'DEVICES',
                  children: [{
                    component: {
                      name: 'DevicesScreen',
                      options: {
                        bottomTab: {
                          text: 'Devices',
                          icon: require('./assets/images/device_72.png'),
                          iconColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor: Constant.TABBAR_BUTTON_COLOR,
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Devices',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      },

                    },

                  }
                  ]
                }
              },
            ],
            options: {
              bottomTabs: {
                hideShadow: true,
                currentTabIndex: index,
                backgroundColor: 'white'

              },
              popGesture: true,
              topBar: {
                visible: true,
                hideOnScroll: true,
                drawBehind: true,
                background: {
                  color: '#00ff00',
                },
              },
              layout: {
                orientation: ['portrait'] // An array of supported orientations
              },
            },
          },
        },
      },
    },
    options: {
      layout: {
        orientation: ['portrait'],
      },
    }
  });
}

Navigation.events().registerBottomTabSelectedListener(async (res) => {
  let currentTabIndex = 0;
  try {
    tabCount++;
    setTimeout(() => {
      tabCount = 0;
    }, 1000)
    if (tabCount === 2) {
      tabCount = 0;
      if (res.selectedTabIndex === res.unselectedTabIndex) {
        currentTabIndex = res.selectedTabIndex;        
        await Navigation.popToRoot(Constant.rootStack[res.selectedTabIndex]);
      }
    }
  } catch (error) {
    if (error.message === 'Nothing to pop') {
      Icon.getImageSource("ios-menu", 30).then((src) => {
        startTABBasedNavigation(currentTabIndex, src);
      });
    }
  }
});


Navigation.events().registerNavigationButtonPressedListener((res) => {
  position = !position
  Platform.OS === 'ios' ?
    Navigation.mergeOptions(res.componentId, {
      sideMenu: {
        left: {
          visible: position,
          enabled: false,
        }
      }
    })
    :
    Navigation.mergeOptions(res.componentId, {
      sideMenu: {
        left: {
          visible: true,
          enabled: true
        }
      }
    })
})